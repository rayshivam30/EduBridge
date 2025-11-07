"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Circle, 
  BookOpen, 
  Clock, 
  User,
  FileText,
  Video,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Lesson {
  id: string
  title: string
  contentURL: string | null
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  price: number | string // Can be Decimal from Prisma
  status: string
  lessons: Lesson[]
  createdBy: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    enrollments: number
  }
  createdAt: Date
  updatedAt: Date
  createdById: string
}

interface ProgressRow {
  lessonId: string
  order: number
  progress: { 
    id: string
    percent: number
    completedAt?: string | null 
  } | null
}

interface CoursePlayerClientProps {
  course: any // Using any for now to avoid type conflicts with Prisma return type
}

export function CoursePlayerClient({ course }: CoursePlayerClientProps) {
  const router = useRouter()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [progressData, setProgressData] = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("content")

  const sortedLessons = useMemo(() => 
    [...course.lessons].sort((a, b) => a.order - b.order),
    [course.lessons]
  )

  const currentLesson = sortedLessons[currentLessonIndex]

  const loadProgress = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/progress?courseId=${encodeURIComponent(course.id)}`)
      if (res.ok) {
        const data = await res.json()
        setProgressData(data)
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }, [course.id])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const markLessonComplete = async (lessonId: string) => {
    setLoading(true)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lessonId, 
          percent: 100, 
          completedAt: new Date().toISOString() 
        }),
      })
      await loadProgress()
    } catch (error) {
      console.error("Error marking lesson complete:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLessonProgress = useCallback((lessonId: string) => {
    const progress = progressData.find(p => p.lessonId === lessonId)
    return progress?.progress?.percent || 0
  }, [progressData])

  const isLessonCompleted = useCallback((lessonId: string) => {
    return getLessonProgress(lessonId) >= 100
  }, [getLessonProgress])

  const overallProgress = useMemo(() => {
    if (sortedLessons.length === 0) return 0
    const totalProgress = sortedLessons.reduce((sum, lesson) => 
      sum + getLessonProgress(lesson.id), 0
    )
    return Math.round(totalProgress / sortedLessons.length)
  }, [sortedLessons, getLessonProgress])

  const completedLessons = useMemo(() => 
    sortedLessons.filter(lesson => isLessonCompleted(lesson.id)).length,
    [sortedLessons, isLessonCompleted]
  )

  const handleNavigate = (page: string) => {
    switch (page) {
      case "student-dashboard":
        router.push("/student-dashboard")
        break
      case "courses":
        router.push("/courses")
        break
      default:
        router.push(`/${page}`)
    }
  }

  const goToNextLesson = () => {
    if (currentLessonIndex < sortedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    }
  }

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
    }
  }

  const renderLessonContent = (lesson: Lesson) => {
    if (!lesson.contentURL) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No content available</h3>
          <p className="text-muted-foreground">This lesson doesn&apos;t have any content yet.</p>
        </div>
      )
    }

    // Check if it's iframe embed code
    if (lesson.contentURL.includes('<iframe') && lesson.contentURL.includes('</iframe>')) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <div 
            dangerouslySetInnerHTML={{ __html: lesson.contentURL }}
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
          />
        </div>
      )
    }

    // Check if it's a video URL
    if (lesson.contentURL.includes('youtube.com') || lesson.contentURL.includes('youtu.be') || lesson.contentURL.includes('vimeo.com')) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={lesson.contentURL}
            className="w-full h-full"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      )
    }

    // Check if it's a regular URL
    if (lesson.contentURL.startsWith('http')) {
      return (
        <div className="border rounded-lg p-6 text-center">
          <LinkIcon className="mx-auto h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">External Resource</h3>
          <p className="text-muted-foreground mb-4">This lesson links to an external resource.</p>
          <Button asChild>
            <a href={lesson.contentURL} target="_blank" rel="noopener noreferrer">
              Open Resource
            </a>
          </Button>
        </div>
      )
    }

    // Treat as text content
    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-6">
          {lesson.contentURL}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="courses" onNavigate={handleNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/student-dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {course.createdBy.name || "Instructor"}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {sortedLessons.length} lessons
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {completedLessons}/{sortedLessons.length} completed
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Course Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedLessons} of {sortedLessons.length} lessons completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }} 
            />
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Lesson {currentLesson?.order}: {currentLesson?.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {isLessonCompleted(currentLesson?.id) ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Circle className="w-3 h-3" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousLesson}
                    disabled={currentLessonIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextLesson}
                    disabled={currentLessonIndex === sortedLessons.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6">
                  {currentLesson && renderLessonContent(currentLesson)}
                  
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Lesson {currentLessonIndex + 1} of {sortedLessons.length}
                    </div>
                    {!isLessonCompleted(currentLesson?.id) && (
                      <Button 
                        onClick={() => markLessonComplete(currentLesson.id)}
                        disabled={loading}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-6">
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Notes feature coming soon</h3>
                    <p className="text-muted-foreground">Take notes while learning to enhance your experience.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Lesson Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Course Lessons</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentLessonIndex 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setCurrentLessonIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {lesson.order}. {lesson.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isLessonCompleted(lesson.id) ? "Completed" : "Not started"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Course Info */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Course Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-medium">{course.createdBy.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Lessons</span>
                  <span className="font-medium">{sortedLessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{course._count.enrollments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}