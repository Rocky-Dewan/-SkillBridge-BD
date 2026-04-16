import Groq from 'groq-sdk'

// Lazy init — only create client when actually called (not at import time)
// This prevents build errors when GROQ_API_KEY is not set in build environment
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build' })
}

// Free Groq models (https://console.groq.com/docs/models):
// - llama-3.3-70b-versatile  → best quality, 30 req/min free
// - llama-3.1-8b-instant     → fastest, 30 req/min free
// - gemma2-9b-it             → Google's model, free
const MAIN_MODEL = 'llama-3.3-70b-versatile'
const FAST_MODEL = 'llama-3.1-8b-instant'

// ─── Generate Assessment Questions ───
export async function generateAssessmentQuestions(params: {
  skillName: string
  level: 'beginner' | 'intermediate' | 'advanced'
  count?: number
}) {
  const { skillName, level, count = 10 } = params
  const groq = getGroq()

  const prompt = `You are an expert assessment designer for SkillBridge BD.

Generate exactly ${count} multiple-choice questions to assess ${level}-level knowledge of "${skillName}".

Requirements:
- Practical, real-world focused questions
- Options should be plausible (not obviously wrong)
- Difficulty calibrated to ${level} level
- Use Bangladesh context where relevant (e.g., BD company examples)

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`

  const response = await groq.chat.completions.create({
    model: MAIN_MODEL,
    max_tokens: 4000,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: 'You output ONLY valid JSON. No markdown. No explanation. No code fences.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content || '{}'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ─── Generate Assessment Feedback ───
export async function generateAssessmentFeedback(params: {
  skillName: string
  score: number
  level: string
  wrongAnswers: Array<{ question: string; userAnswer: string; correctAnswer: string }>
}) {
  const { skillName, score, level, wrongAnswers } = params
  const groq = getGroq()

  const prompt = `You are a career coach at SkillBridge BD. A user just completed a ${skillName} assessment.

Results:
- Score: ${score}%
- Level Achieved: ${level}
- Wrong answers: ${wrongAnswers.length}

Wrong answers:
${wrongAnswers.slice(0, 5).map((w, i) => `${i + 1}. ${w.question}`).join('\n')}

Write 2-3 short paragraphs:
1. Acknowledge their performance positively
2. Point out 2-3 specific areas to improve
3. Give 2-3 free resources or next steps

Keep it motivational, practical, relevant for Bangladesh's job market.
English with optional Bangla phrases (আপনি পারবেন!, শুভকামনা!).`

  const response = await groq.chat.completions.create({
    model: FAST_MODEL,
    max_tokens: 500,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.choices[0]?.message?.content || ''
}

// ─── AI Career Advisor Chat (Streaming) ───
export async function chatWithAdvisor(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  userContext: {
    name: string
    skills: string[]
    skillScore: number
    role: string
    location?: string
  }
}) {
  const { messages, userContext } = params
  const groq = getGroq()

  const systemPrompt = `You are SkillBridge Career Advisor, an expert career counselor for Bangladesh's job market.

User Profile:
- Name: ${userContext.name}
- Role: ${userContext.role}
- Skills: ${userContext.skills.join(', ') || 'None assessed yet'}
- Skill Score: ${userContext.skillScore}/100
- Location: ${userContext.location || 'Bangladesh'}

Your expertise:
- Bangladesh job market (Dhaka, Chittagong, Sylhet, etc.)
- International freelancing (Upwork, Fiverr, Toptal alternatives)
- In-demand skills for BD: React, Python, Digital Marketing, UI/UX, Data Analysis
- Government programs: LEDP, Startup Bangladesh, a2i
- Salary benchmarks in BDT and USD for remote work
- CV/resume writing for BD companies AND international clients
- English communication improvement for freelancers

Guidelines:
- Be warm, encouraging, and culturally aware of BD context
- Give specific, actionable advice with real numbers (salaries in BDT/USD)
- Mention specific BD companies, job portals (BDJobs, LinkedIn BD)
- You can use Bangla phrases (আপনি পারবেন!, শুভকামনা!)
- Max 250 words per response`

  // Groq streaming
  const stream = await groq.chat.completions.create({
    model: MAIN_MODEL,
    max_tokens: 600,
    temperature: 0.7,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  return stream
}

// ─── Job Match Scoring ───
export async function scoreJobMatch(params: {
  jobTitle: string
  jobDescription: string
  requiredSkills: string[]
  userSkills: Array<{ name: string; score: number; level: string }>
  userBio: string
}) {
  const { jobTitle, jobDescription, requiredSkills, userSkills, userBio } = params
  const groq = getGroq()

  const prompt = `Score this candidate's match for a job. Return ONLY valid JSON.

Job: ${jobTitle}
Required skills: ${requiredSkills.join(', ')}
Description: ${jobDescription.slice(0, 300)}

Candidate:
- Bio: ${userBio?.slice(0, 200) || 'Not provided'}
- Verified skills: ${userSkills.map(s => `${s.name} (${s.level}, ${s.score}%)`).join(', ')}

JSON format only:
{
  "matchScore": 75,
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Brief 1-sentence recommendation"
}`

  const response = await groq.chat.completions.create({
    model: FAST_MODEL,
    max_tokens: 300,
    temperature: 0.2,
    messages: [
      { role: 'system', content: 'Output ONLY valid JSON. No markdown. No explanation.' },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content || '{}'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ─── Generate Freelancer Export Profile ───
export async function generateFreelancerProfile(params: {
  name: string
  skills: Array<{ name: string; level: string; score: number }>
  bio: string
  experience?: string
}) {
  const { name, skills, bio, experience } = params
  const groq = getGroq()

  const prompt = `Generate a professional freelancer profile for international clients (Upwork/Toptal style).

Freelancer:
- Name: ${name}
- Verified skills: ${skills.map(s => `${s.name} (${s.level}, verified ${s.score}%)`).join(', ')}
- Bio: ${bio}
- Experience: ${experience || 'Not specified'}

Write a compelling profile:
1. Strong value proposition (1 sentence)
2. Highlight verified skill badges from SkillBridge BD
3. Show international-client readiness
4. Clear call-to-action

Under 200 words. Professional English. Sound like a senior professional.`

  const response = await groq.chat.completions.create({
    model: FAST_MODEL,
    max_tokens: 400,
    temperature: 0.6,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.choices[0]?.message?.content || ''
}
