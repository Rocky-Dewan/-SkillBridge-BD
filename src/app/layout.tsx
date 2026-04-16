import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SkillBridge BD', template: '%s | SkillBridge BD' },
  description: "Bangladesh's #1 AI-powered skill verification and job matching platform. Get verified, get hired.",
  keywords: ['Bangladesh jobs', 'skill assessment', 'freelancer', 'career', 'AI assessment', 'BD jobs'],
  openGraph: {
    type: 'website',
    siteName: 'SkillBridge BD',
    title: 'SkillBridge BD — Get Verified. Get Hired.',
    description: "Bangladesh's first AI-powered skill verification platform",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
