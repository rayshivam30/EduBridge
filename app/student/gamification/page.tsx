import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GamificationDashboard } from '@/components/gamification/gamification-dashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function GamificationPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/student-dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Learning Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress, achievements, and learning streaks
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading your achievements...</div>}>
          <GamificationDashboard />
        </Suspense>
      </div>
    </div>
  )
}