'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string; ts: string }

const QUICK_PROMPTS = [
  'What skills should I learn for a ৳50K/month job in Dhaka?',
  'How do I get my first freelance client on Upwork?',
  'Review my career path as a React developer in Bangladesh',
  'What salary can I expect with my JavaScript skills?',
  'How do I write a strong CV for BD tech companies?',
  'Which certifications help the most for remote jobs?',
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg, ts: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '', ts: new Date().toISOString() }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => { const copy = [...prev]; copy[copy.length - 1].content = `Error: ${err.error}`; return copy })
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                full += parsed.text
                setMessages(prev => { const copy = [...prev]; copy[copy.length - 1] = { ...copy[copy.length - 1], content: full }; return copy })
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      setMessages(prev => { const copy = [...prev]; copy[copy.length - 1].content = 'Sorry, something went wrong. Please try again.'; return copy })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-lg">🤖</div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">SkillBridge AI Career Advisor</h1>
            <p className="text-xs text-gray-500">Expert guidance for Bangladesh&apos;s job market • Powered by Claude</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your AI Career Advisor</h2>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">I know Bangladesh&apos;s job market, salary benchmarks, freelancing tips, and more. Ask me anything!</p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => sendMessage(p)} className="text-left p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gradient-to-br from-brand-500 to-purple-600 text-white'}`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm'
              }`}>
                {msg.content || (loading && i === messages.length - 1 ? (
                  <span className="flex gap-1 items-center py-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : '')}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about careers, salaries, skills, freelancing in Bangladesh..."
            rows={1}
            className="input flex-1 resize-none min-h-[44px] max-h-32 py-3"
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary flex-shrink-0 w-11 h-11 p-0 justify-center items-center disabled:opacity-50"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '↑'}
          </button>
        </div>
        <div className="max-w-3xl mx-auto mt-2 text-xs text-gray-400 text-center">
          20 messages/hour on free plan • Press Enter to send, Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}
