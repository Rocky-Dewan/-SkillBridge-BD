import { redirect } from 'next/navigation'

// This route just redirects to /jobs — no duplication
export default function DashboardJobsPage() {
  redirect('/jobs')
}
