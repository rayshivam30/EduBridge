'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizCreator } from './quiz-creator'
import { QuizPlayer } from './quiz-player'
import { QuizLeaderboard } from './quiz-leaderboard'
import { Brain, Plus, Play, Clock, Trophy, Users, Star, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Quiz {
  id: string
  title: string
  description: string | null
  topic: string
  difficulty: string
  isPublic: boolean
  createdAt: string
  createdBy: {
    name: string | null
    image: string | null
  }
  questions: any[]
  _count?: {
    attempts: number
  }
}

export function QuizDashboard() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const [myQuizzesRes, publicQuizzesRes] = await Promise.all([
        fetch('/api/quiz/my'),
        fetch('/api/quiz/public')
      ])

      if (myQuizzesRes.ok) {
        const myQuizzes = await myQuizzesRes.json()
        setQuizzes(myQuizzes)
      }

      if (publicQuizzesRes.ok) {
        const publicQuizzes = await publicQuizzesRes.json()
        setPublicQuizzes(publicQuizzes)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      toast.error('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizCreated = (quizId: string) => {
    setShowCreator(false)
    fetchQuizzes()
    toast.success('Quiz created successfully!')
  }

  const handleQuizComplete = async (score: number, totalPoints: number, answers: any[], timeSpent: number) => {
    if (!selectedQuiz) return

    try {
      const response = await fetch(`/api/quiz/${selectedQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          totalPoints,
          answers,
          timeSpent
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Quiz completed! +${result.pointsEarned} points earned!`)
        
        if (result.newAchievements?.length > 0) {
          result.newAchievements.forEach((achievement: any) => {
            toast.success(`Achievement unlocked: ${achievement.title}!`)
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Quiz completed but failed to save: ${errorData.error}`)
        toast.success(`You scored ${score}/${totalPoints} points!`)
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error)
      toast.error('Failed to save quiz results')
    }

    setSelectedQuiz(null)
    
    // Refresh the quiz list to show updated attempt counts
    setTimeout(() => {
      fetchQuizzes()
    }, 1000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (selectedQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedQuiz(null)}
          >
            ← Back to Quizzes
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{selectedQuiz.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedQuiz.questions.length} questions • {selectedQuiz.difficulty} difficulty
            </p>
          </div>
        </div>
        
        <QuizPlayer 
          quiz={selectedQuiz} 
          onComplete={handleQuizComplete}
        />
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowLeaderboard(null)}
          >
            ← Back to Dashboard
          </Button>
          <h2 className="text-xl font-semibold">Quiz Leaderboard</h2>
        </div>
        
        <QuizLeaderboard 
          quizId={showLeaderboard.id} 
          quizTitle={showLeaderboard.title}
        />
      </div>
    )
  }

  if (showCreator) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCreator(false)}
          >
            ← Back to Dashboard
          </Button>
          <h2 className="text-xl font-semibold">Create New Quiz</h2>
        </div>
        
        <QuizCreator onQuizCreated={handleQuizCreated} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold">Quiz Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create, take, and share AI-generated quizzes
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreator(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Quiz
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/quiz/results')} 
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Results
          </Button>

        </div>
      </div>

      <Tabs defaultValue="my-quizzes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-quizzes">My Quizzes ({quizzes.length})</TabsTrigger>
          <TabsTrigger value="public-quizzes">Public Quizzes ({publicQuizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-quizzes" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No quizzes yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Create your first AI-generated quiz to get started!
                </p>
                <Button onClick={() => setShowCreator(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">
                          {quiz.title}
                        </CardTitle>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Topic: {quiz.topic}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          {quiz.questions.length} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={() => setSelectedQuiz(quiz)}
                          className="w-full gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Take Quiz
                        </Button>
                        {quiz.isPublic && (
                          <Button 
                            onClick={() => setShowLeaderboard(quiz)}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            Leaderboard
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public-quizzes" className="space-y-4">
          {publicQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No public quizzes available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Be the first to create a public quiz for the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicQuizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">
                          {quiz.title}
                        </CardTitle>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Topic: {quiz.topic}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>by {quiz.createdBy.name}</span>
                        {quiz._count?.attempts && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {quiz._count.attempts} attempts
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          {quiz.questions.length} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Public
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={() => setSelectedQuiz(quiz)}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <Play className="w-4 h-4" />
                          Take Quiz
                        </Button>
                        <Button 
                          onClick={() => setShowLeaderboard(quiz)}
                          variant="ghost"
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          Leaderboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}