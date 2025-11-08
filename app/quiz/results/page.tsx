import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuizResults } from '@/components/quiz/quiz-results'

export default async function QuizResultsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your quiz attempts and performance history
          </p>
        </div>

        <Suspense fallback={<div>Loading results...</div>}>
          <QuizResults />
        </Suspense>
      </div>
    </div>
  )
}