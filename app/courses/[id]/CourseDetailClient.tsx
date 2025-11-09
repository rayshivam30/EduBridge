"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  Clock,
  Users,
  Play,
  CheckCircle2,
  ArrowLeft,
  Download,
  Share2,
  Award,
  Globe,
  Calendar,
  Wifi,
  WifiOff
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { CourseDownload } from "@/components/course-download"
import { useOffline } from "@/hooks/use-offline"

interface CourseDetailClientProps {
  courseId: string
}

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [relatedCourses, setRelatedCourses] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])
  const { isOnline } = useOffline()

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseRes = await fetch(`/api/courses/${courseId}`)
        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourse(courseData)
        }

        // Check if user is enrolled
        const enrollmentRes = await fetch(`/api/enrollments?courseId=${courseId}`)
        if (enrollmentRes.ok) {
          const enrollmentData = await enrollmentRes.json()
          const userEnrollment = enrollmentData.find((e: any) => e.courseId === courseId)
          setEnrollment(userEnrollment)
          
          // If enrolled, fetch progress data
          if (userEnrollment && session?.user?.id) {
            const progressRes = await fetch(`/api/progress?courseId=${courseId}`)
            if (progressRes.ok) {
              const progressData = await progressRes.json()
              setProgressData(progressData)
            }
          }
        }

        // Fetch related courses
        const relatedRes = await fetch('/api/courses/public')
        if (relatedRes.ok) {
          const allCourses = await relatedRes.json()
          // Filter out current course and take first 3
          const related = allCourses
            .filter((c: any) => c.id !== courseId)
            .slice(0, 3)
          setRelatedCourses(related)
        }
      } catch (error) {
        console.error("Failed to fetch course data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId, session?.user?.id])

  const handleEnroll = async () => {
    if (!session?.user?.id) return

    setEnrolling(true)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      })

      if (res.ok) {
        const newEnrollment = await res.json()
        setEnrollment(newEnrollment)
      } else {
        alert("Failed to enroll in course")
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      alert("An error occurred while enrolling")
    } finally {
      setEnrolling(false)
    }
  }

  const handleStartCourse = () => {
    router.push(`/course-player/${courseId}`)
  }

  const handleShare = async () => {
    const shareData = {
      title: course.title,
      text: `Check out this course: ${course.title}`,
      url: window.location.href
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Course link copied to clipboard!')
      }
    } catch (error) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Course link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Failed to share or copy:', error, clipboardError)
        alert('Unable to share. Please copy the URL manually.')
      }
    }
  }

  const handleNavigate = (page: string) => {
    switch (page) {
      case "landing":
        router.push("/student-dashboard")
        break
      case "courses":
        router.push("/courses")
        break
      case "student-dashboard":
        router.push("/student-dashboard")
        break
      case "ai-tutor":
        router.push("/ai-tutor")
        break
      case "community-forum":
        router.push("/community-forum")
        break
      default:
        router.push(`/${page}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="courses" onNavigate={handleNavigate} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-muted rounded-lg mb-6"></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
              <div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="courses" onNavigate={handleNavigate} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Course not found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              The course you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push("/courses")}>
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isEnrolled = !!enrollment
  const isPaid = course.price && Number(course.price) > 0

  // Calculate real progress based on lesson completion
  const calculateProgress = () => {
    if (!progressData.length || !course?.lessons?.length) return 0
    
    const completedLessons = progressData.filter(p => p.progress?.percent === 100).length
    const totalLessons = course.lessons.length
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const progress = calculateProgress()



  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="courses" onNavigate={handleNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => router.push("/courses")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isPaid ? "default" : "secondary"}>
                      {isPaid ? "Premium" : "Free"}
                    </Badge>
                    <Badge variant="outline">
                      {course.status === "published" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {course.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Course Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course._count?.enrollments || 0} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course._count?.lessons || 0} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course._count?.lessons ? `${course._count.lessons} lessons` : 'No lessons yet'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Progress Bar (if enrolled) */}
              {isEnrolled && (
                <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Your Progress</span>
                    <span className="text-sm text-primary font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              )}
            </div>



            {/* First Lesson Preview Video */}
            {course.lessons && course.lessons.length > 0 && course.lessons[0] && (
              <Card className="mb-8 overflow-hidden">
                <div className="p-4 bg-muted/30 border-b">
                  <h3 className="font-medium text-foreground">Course Preview</h3>
                  <p className="text-sm text-muted-foreground">{course.lessons[0].title}</p>
                </div>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative group cursor-pointer">
                  <button 
                    className="w-20 h-20 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center transition-colors group-hover:scale-110 duration-200"
                    onClick={() => {
                      if (isEnrolled) {
                        router.push(`/course-player/${courseId}`)
                      } else {
                        alert('Please enroll in the course to watch lessons')
                      }
                    }}
                  >
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {isEnrolled ? 'Click to start course' : 'Enroll to watch'}
                  </div>
                </div>
              </Card>
            )}

            {/* What You'll Learn */}
            {course.description && (
              <Card className="p-6 mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">About this course</h3>
                <p className="text-foreground leading-relaxed">{course.description}</p>
              </Card>
            )}

            {/* Course Content */}
            {course.lessons && course.lessons.length > 0 && (
              <Card className="p-6 mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">Course Content</h3>
                <div className="space-y-2">
                  {course.lessons.map((lesson: any, idx: number) => {
                    const lessonProgress = progressData.find(p => p.lessonId === lesson.id)
                    const isCompleted = lessonProgress?.progress?.percent === 100
                    const progressPercent = lessonProgress?.progress?.percent || 0
                    
                    return (
                      <div key={lesson.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-mono">
                            {String(lesson.order || idx + 1).padStart(2, '0')}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Play className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm ${isCompleted ? 'text-green-600' : 'text-foreground'}`}>
                            {lesson.title}
                          </span>
                        </div>
                        {isEnrolled && progressPercent > 0 && progressPercent < 100 && (
                          <span className="text-xs text-muted-foreground">
                            {progressPercent}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Instructor */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Instructor</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {course.createdBy?.name?.charAt(0) || "I"}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {course.createdBy?.name || "Instructor"}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Course Creator
                  </p>
                  <p className="text-sm text-foreground">
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                {isPaid && (
                  <div className="text-3xl font-bold text-foreground mb-2">
                    ₹{Number(course.price).toLocaleString()}
                  </div>
                )}
                {!isPaid && (
                  <div className="text-2xl font-bold text-primary mb-2">Free Course</div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {isEnrolled ? (
                  <>
                    {progress > 0 ? (
                      <Button
                        className="w-full gap-2"
                        onClick={handleStartCourse}
                      >
                        <Play className="h-4 w-4" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={handleStartCourse}
                      >
                        <Play className="h-4 w-4" />
                        Start Course
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Share Course
                </Button>
                
                {/* Offline Download - Only for enrolled students */}
                {isEnrolled && (
                  <div className="pt-3">
                    <CourseDownload 
                      courseId={courseId}
                      courseName={course.title}
                    />
                  </div>
                )}
              </div>

              <Separator className="mb-6" />

              {/* Course Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">This course includes:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{course._count?.lessons || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course._count?.enrollments || 0} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Access on mobile and desktop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-yellow-600" />
                    )}
                    <span>Offline access available</span>
                  </div>
                  {isEnrolled && (
                    <div className="flex items-center gap-3">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>Downloadable for offline use</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <Card className="p-6">
                <h4 className="font-semibold text-foreground mb-4">Related Courses</h4>
                <div className="space-y-4">
                  {relatedCourses.map((relatedCourse: any) => (
                    <div 
                      key={relatedCourse.id} 
                      className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => router.push(`/courses/${relatedCourse.id}`)}
                    >
                      <div className="w-16 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-foreground text-sm line-clamp-2">
                          {relatedCourse.title}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {relatedCourse.price && Number(relatedCourse.price) > 0 
                            ? `₹${Number(relatedCourse.price).toLocaleString()}` 
                            : "Free"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

