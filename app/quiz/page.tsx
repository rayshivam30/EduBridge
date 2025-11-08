import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuizDashboard } from '@/components/quiz/quiz-dashboard'

export default async function QuizPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Quiz Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and take AI-generated quizzes on any topic to test your knowledge and earn points!
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <QuizDashboard />
        </Suspense>
      </div>
    </div>
  )
}