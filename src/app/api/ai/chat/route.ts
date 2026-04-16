import { NextRequest, NextResponse } from 'next/server'
import { aiChatSchema } from '@/lib/validation/schemas'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, aiRateLimit, sanitizeObject } from '@/lib/security'
import { chatWithAdvisor } from '@/lib/ai'

interface AISession {
  id: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const limit = aiRateLimit(user!.id)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'AI chat limit reached (20/hour). Try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const parse = aiChatSchema.safeParse(sanitizeObject(body))
    if (!parse.success) return NextResponse.json({ error: 'Invalid message' }, { status: 400 })

    const { message, session_id } = parse.data

    // Fetch existing session
    let session: AISession | null = null
    if (session_id) {
      const { data } = await supabaseAdmin
        .from('ai_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user!.id)
        .single()
      session = data as AISession | null
    }

    const sessionMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      session?.messages || []
    const newUserMessage = { role: 'user' as const, content: message }
    const allMessages = [...sessionMessages, newUserMessage]

    // Fetch user context
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role, location, skill_score')
      .eq('id', user!.id)
      .single()
    const { data: assessments } = await supabaseAdmin
      .from('assessments')
      .select('skill_name, level')
      .eq('user_id', user!.id)
      .eq('status', 'completed')
      .limit(10)

    const userContext = {
      name: profile?.full_name || 'User',
      role: profile?.role || 'jobseeker',
      skills: (assessments || []).map((a) => `${a.skill_name} (${a.level})`),
      skillScore: profile?.skill_score || 0,
      location: profile?.location || 'Bangladesh',
    }

    // Get Groq stream
    const stream = await chatWithAdvisor({ messages: allMessages, userContext })

    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Groq streaming: iterate over chunks
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Persist session after stream ends
          const updatedMessages = [
            ...allMessages,
            { role: 'assistant' as const, content: fullResponse },
          ]
          if (session) {
            await supabaseAdmin
              .from('ai_sessions')
              .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
              .eq('id', session.id)
          } else {
            await supabaseAdmin
              .from('ai_sessions')
              .insert({
                user_id: user!.id,
                session_type: 'career_advisor',
                messages: updatedMessages,
              })
          }
        } catch (e) {
          console.error('Stream error:', e)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    console.error('AI chat error:', e)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
