'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizCreator } from './quiz-creator'
import { QuizPlayer } from './quiz-player'
import { QuizLeaderboard } from './quiz-leaderboard'
import { Brain, Plus, Play, Clock, Trophy, Users, Star, BarChart3, Wifi, WifiOff, Check, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useOffline } from '@/hooks/use-offline'

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
  const { isOnline } = useOffline()
  const [userId, setUserId] = useState<string>("")
  const [downloadedQuizzes, setDownloadedQuizzes] = useState<Set<string>>(new Set())
  const [downloadingQuizzes, setDownloadingQuizzes] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get user ID for offline functionality
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setUserId(session.user.id)
        }
      })
      .catch(console.error)
  }, [])

  const checkDownloadedQuizzes = useCallback(async () => {
    try {
      const { db } = await import('@/lib/offline-db')
      const cachedQuizzes = await db.quizzes.toArray()

      // Clean up old demo quizzes and invalid entries
      const publicQuizIds = new Set(publicQuizzes.map(quiz => quiz.id))
      const validCachedQuizzes = []
      const invalidQuizIds = []

      for (const quiz of cachedQuizzes) {
        if (publicQuizIds.has(quiz.id)) {
          validCachedQuizzes.push(quiz)
        } else {
          // Mark demo/invalid quizzes for potential cleanup
          if (quiz.id.includes('demo') || quiz.id.includes('test')) {
            invalidQuizIds.push(quiz.id)
          }
        }
      }

      // Clean up demo quizzes if we have real ones
      if (validCachedQuizzes.length > 0 && invalidQuizIds.length > 0) {
        for (const invalidId of invalidQuizIds) {
          await db.quizzes.delete(invalidId)
        }
        console.log(`Cleaned up ${invalidQuizIds.length} demo/invalid quizzes`)
      }

      const downloadedIds = new Set(validCachedQuizzes.map(quiz => quiz.id))
      setDownloadedQuizzes(downloadedIds)
    } catch (error) {
      console.error('Failed to check downloaded quizzes:', error)
    }
  }, [publicQuizzes])

  useEffect(() => {
    // Check which quizzes are already downloaded
    checkDownloadedQuizzes()
  }, [checkDownloadedQuizzes])

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-quizzes">My Quizzes ({quizzes.length})</TabsTrigger>
          <TabsTrigger value="public-quizzes">Public Quizzes ({publicQuizzes.length})</TabsTrigger>
          <TabsTrigger value="offline-quiz" className="gap-2">
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            Offline Quiz
          </TabsTrigger>
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

        <TabsContent value="offline-quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-yellow-600" />}
                    Offline Quiz Mode
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isOnline
                      ? "Download quizzes for offline access - perfect for areas with poor connectivity"
                      : "You're offline! Take cached quizzes and sync results when back online"
                    }
                  </p>
                </div>
                <Badge variant={isOnline ? "secondary" : "outline"}>
                  {isOnline ? "Online" : "Offline Mode"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available Offline Quizzes */}
              <div>
                <h4 className="font-medium mb-3">Available Offline Quizzes</h4>
                <div className="grid gap-3">
                  {/* Show available quizzes for offline download */}
                  {publicQuizzes.slice(0, 5).map((quiz) => {
                    const isDownloaded = downloadedQuizzes.has(quiz.id)
                    const isDownloading = downloadingQuizzes.has(quiz.id)

                    return (
                      <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{quiz.title}</h5>
                            {isDownloaded && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Downloaded
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {quiz.questions.length} questions • {quiz.difficulty} difficulty
                          </p>
                          {isDownloaded && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Available offline
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isDownloaded && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!userId || !isOnline) return

                                setDownloadingQuizzes(prev => new Set([...prev, quiz.id]))

                                try {
                                  // Cache this quiz for offline use
                                  const { db } = await import('@/lib/offline-db')
                                  const offlineQuiz = {
                                    id: quiz.id,
                                    courseId: 'general',
                                    title: quiz.title,
                                    questions: quiz.questions.map((q: any, index: number) => ({
                                      id: q.id || index.toString(),
                                      question: q.question,
                                      options: q.options || [],
                                      correctAnswer: q.correctAnswer || 0,
                                      explanation: q.explanation
                                    })),
                                    timeLimit: 10,
                                    lastSynced: new Date()
                                  }

                                  await db.quizzes.put(offlineQuiz)
                                  setDownloadedQuizzes(prev => new Set([...prev, quiz.id]))
                                  toast.success(`${quiz.title} downloaded for offline use!`)
                                } catch (error) {
                                  console.error('Download error:', error)
                                  toast.error('Failed to download quiz')
                                } finally {
                                  setDownloadingQuizzes(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(quiz.id)
                                    return newSet
                                  })
                                }
                              }}
                              disabled={!isOnline || isDownloading}
                            >
                              {isDownloading ? (
                                <>
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => {
                              if (userId) {
                                // Take quiz (works online or offline if downloaded)
                                setSelectedQuiz(quiz)
                              }
                            }}
                            disabled={!isOnline && !isDownloaded}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Take Quiz
                          </Button>

                          {isDownloaded && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  const { db } = await import('@/lib/offline-db')
                                  await db.quizzes.delete(quiz.id)
                                  setDownloadedQuizzes(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(quiz.id)
                                    return newSet
                                  })
                                  toast.success('Quiz removed from offline storage')
                                } catch (error) {
                                  toast.error('Failed to remove quiz')
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {publicQuizzes.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No quizzes available. Create some quizzes first!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Downloaded Quizzes Summary */}
              {downloadedQuizzes.size > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          {downloadedQuizzes.size} quiz{downloadedQuizzes.size !== 1 ? 'es' : ''} ready for offline use
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        You can take these quizzes even when offline. Results will sync when you&apos;re back online.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const { db } = await import('@/lib/offline-db')
                          const cachedQuizzes = await db.quizzes.toArray()

                          // Only count quizzes that match current public quizzes (real downloaded ones)
                          const publicQuizIds = new Set(publicQuizzes.map(quiz => quiz.id))
                          const validQuizzes = cachedQuizzes.filter(quiz =>
                            publicQuizIds.has(quiz.id) &&
                            quiz.questions &&
                            quiz.questions.length > 0
                          )

                          if (validQuizzes.length > 0) {
                            toast.success(`✓ Verified: ${validQuizzes.length} real quiz${validQuizzes.length !== 1 ? 'es' : ''} ready for offline use`)

                            // Show details in console
                            const quizTitles = validQuizzes.map(q => q.title).join(', ')
                            console.log('Offline quizzes:', quizTitles)
                          } else {
                            toast.warning('No real offline quizzes found. Download some quizzes first!')
                          }
                        } catch (error) {
                          toast.error('Failed to verify offline quizzes')
                        }
                      }}
                    >
                      Verify Offline
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}