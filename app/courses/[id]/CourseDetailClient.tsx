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
  Star,
  Play,
  CheckCircle2,
  ArrowLeft,
  Download,
  Share2,
  Heart,
  Award,
  Globe,
  Calendar
} from "lucide-react"
import { Navigation } from "@/components/navigation"

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
        }
      } catch (error) {
        console.error("Failed to fetch course data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId])

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
              The course you're looking for doesn't exist or has been removed.
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
  const progress = enrollment?.progress || 0

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
                  <span>~8 hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span>4.8 (124 reviews)</span>
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

            {/* Course Preview Video */}
            <Card className="mb-8 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative group cursor-pointer">
                <button className="w-20 h-20 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center transition-colors group-hover:scale-110 duration-200">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </button>
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  Preview: Introduction to {course.title}
                </div>
              </div>
            </Card>

            {/* What You'll Learn */}
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">What you'll learn</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {learningObjectives.map((objective, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{objective}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Course Content */}
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Course Content</h3>
              <div className="space-y-4">
                {courseModules.map((module, idx) => (
                  <div key={idx} className="border border-border rounded-lg">
                    <div className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{module.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {module.lessons.length} lessons • {module.duration}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {module.lessons.map((lesson, lessonIdx) => (
                        <div key={lessonIdx} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{lesson.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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
                    Senior Developer & Educator
                  </p>
                  <p className="text-sm text-foreground">
                    Experienced developer with 10+ years in web development.
                    Passionate about teaching and helping students achieve their goals.
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

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Heart className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Course Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">This course includes:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>8 hours on-demand video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Access on mobile and desktop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Related Courses */}
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4">Related Courses</h4>
              <div className="space-y-4">
                {relatedCourses.map((relatedCourse, idx) => (
                  <div key={idx} className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                    <div className="w-16 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-foreground text-sm line-clamp-2">
                        {relatedCourse.title}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {relatedCourse.price > 0 ? `₹${relatedCourse.price}` : "Free"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// Mock data - replace with actual data from your API
const learningObjectives = [
  "Build responsive websites using HTML, CSS, and JavaScript",
  "Understand modern web development best practices",
  "Create interactive user interfaces",
  "Work with APIs and handle data",
  "Deploy applications to production",
  "Debug and troubleshoot web applications"
]

const courseModules = [
  {
    title: "Module 1: Getting Started",
    duration: "2h 30m",
    lessons: [
      { title: "Course Introduction", duration: "5:30" },
      { title: "Setting up Development Environment", duration: "15:20" },
      { title: "HTML Fundamentals", duration: "25:45" },
      { title: "CSS Basics", duration: "30:15" }
    ]
  },
  {
    title: "Module 2: Advanced Concepts",
    duration: "3h 15m",
    lessons: [
      { title: "JavaScript Fundamentals", duration: "45:30" },
      { title: "DOM Manipulation", duration: "35:20" },
      { title: "Event Handling", duration: "25:45" },
      { title: "Async Programming", duration: "40:15" }
    ]
  },
  {
    title: "Module 3: Project Building",
    duration: "2h 45m",
    lessons: [
      { title: "Planning Your Project", duration: "20:30" },
      { title: "Building the Frontend", duration: "55:20" },
      { title: "Adding Interactivity", duration: "35:45" },
      { title: "Testing and Deployment", duration: "25:15" }
    ]
  }
]

const relatedCourses = [
  { title: "Advanced JavaScript Concepts", price: 2999 },
  { title: "React for Beginners", price: 0 },
  { title: "Node.js Backend Development", price: 3999 }
]