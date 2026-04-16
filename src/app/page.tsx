import Link from 'next/link'

export default function HomePage() {
  const stats = [
    { label: 'Graduates Unemployed', value: '900K+', desc: 'who need verified skills' },
    { label: 'Active Freelancers', value: '1M+', desc: 'needing verified profiles' },
    { label: 'Platform Fee Savings', value: '20%', desc: 'vs Upwork/Fiverr' },
    { label: 'Skill Gap', value: '84%', desc: 'of youth lack digital skills' },
  ]
  const features = [
    { icon: '🎯', title: 'AI Skill Assessment', desc: 'Take adaptive 10-minute tests. Get verified badges trusted by employers across BD.', href: '/assessment' },
    { icon: '🤖', title: 'AI Career Advisor', desc: 'Get personalized career advice, CV help, and salary benchmarks for BD market.', href: '/ai-assistant' },
    { icon: '💼', title: 'Smart Job Matching', desc: 'Match with jobs that fit your verified skills. No more wasted applications.', href: '/jobs' },
    { icon: '🌐', title: 'Freelancer Export Profile', desc: 'One-click international profile to pitch to global clients. Bypass Upwork fees.', href: '/freelancer' },
    { icon: '📊', title: 'Company Dashboard', desc: 'Screen verified candidates fast. Post jobs. Find talent that actually can do the work.', href: '/auth/register?role=employer' },
    { icon: '📚', title: 'Micro Learning', desc: 'AI-generated learning paths in Bangla + English to close your skill gaps.', href: '/dashboard' },
  ]
  const skills = ['JavaScript', 'Python', 'React', 'Digital Marketing', 'UI/UX Design', 'SQL', 'Data Analysis', 'English', 'Node.js', 'Content Writing', 'Graphic Design', 'Project Mgmt']

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="page-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">SB</div>
            <span className="font-bold text-gray-900 dark:text-white">SkillBridge BD</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">Jobs</Link>
            <Link href="/assessment" className="hover:text-brand-600 transition-colors">Assessments</Link>
            <Link href="/freelancer" className="hover:text-brand-600 transition-colors">Freelancers</Link>
            <Link href="/ai-assistant" className="hover:text-brand-600 transition-colors">AI Advisor</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm py-2">Log in</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950 pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="page-container relative text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Bangladesh&apos;s First AI Skill Verification Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Get Verified.<br />
            <span className="text-gradient">Get Hired.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop losing jobs and freelance gigs to skill gaps. Take AI-powered assessments,
            earn verified badges, and let employers find <em>you</em>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5">
              Start Free Assessment →
            </Link>
            <Link href="/jobs" className="btn-secondary text-base px-8 py-3.5">
              Browse Jobs
            </Link>
          </div>
          {/* Skill pills */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {skills.map(s => (
              <span key={s} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-brand-600 mb-1">{s.value}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Everything you need to succeed</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">One platform for job seekers, freelancers, and employers in Bangladesh</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <Link key={f.title} href={f.href} className="card p-6 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="page-container">
          <h2 className="section-heading text-center mb-16">How SkillBridge works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Sign Up Free', desc: 'Create your profile in 2 minutes. No credit card needed.' },
              { step: '02', title: 'Take Assessments', desc: 'AI-generated 10-min tests. Get instant verified badges.' },
              { step: '03', title: 'Build Your Profile', desc: 'Skill scores, AI feedback, and export-ready freelancer profile.' },
              { step: '04', title: 'Get Matched', desc: 'Employers and international clients find you by skill score.' },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gray-200 dark:bg-gray-800" />}
                <div className="relative z-10 w-16 h-16 rounded-full bg-brand-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{item.step}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-600">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to prove your skills?</h2>
          <p className="text-brand-100 mb-8 max-w-md mx-auto">Join thousands of Bangladeshi professionals getting verified and hired faster.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-3.5 rounded-lg hover:bg-brand-50 transition-colors">
            Start Free — No Credit Card →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="page-container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white text-xs font-bold">SB</div>
                <span className="font-bold text-white text-sm">SkillBridge BD</span>
              </div>
              <p className="text-xs leading-relaxed">Bangladesh&apos;s AI-powered skill verification and job matching platform.</p>
            </div>
            {[
              { title: 'Platform', links: [['Jobs', '/jobs'], ['Assessments', '/assessment'], ['Freelancers', '/freelancer'], ['AI Advisor', '/ai-assistant']] },
              { title: 'Company', links: [['About', '/about'], ['Blog', '/blog'], ['Careers', '/careers'], ['Contact', '/contact']] },
              { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies']] },
            ].map(col => (
              <div key={col.title}>
                <div className="font-semibold text-white text-sm mb-3">{col.title}</div>
                {col.links.map(([label, href]) => (
                  <div key={label}><Link href={href} className="text-xs hover:text-white transition-colors block py-0.5">{label}</Link></div>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            © {new Date().getFullYear()} SkillBridge BD. Made with ❤️ in Bangladesh.
          </div>
        </div>
      </footer>
    </div>
  )
}
