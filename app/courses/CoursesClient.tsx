"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Search, Filter, ArrowRight, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { CourseDownload } from "@/components/course-download"
import { useOffline } from "@/hooks/use-offline"

export function CoursesClient() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    level: "",
    category: "",
    sort: "newest"
  })
  const { isOnline } = useOffline()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesRes = await fetch("/api/courses/public")
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(Array.isArray(coursesData) ? coursesData : [])
        }

        // Fetch user enrollments to check which courses are enrolled
        const enrollmentsRes = await fetch("/api/enrollments")
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isEnrolledInCourse = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.courseId === courseId)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="courses" onNavigate={handleNavigate} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Explore Our Courses</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover a wide range of courses taught by industry experts
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-muted rounded-lg mb-4"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/50" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                      {course.price && Number(course.price) > 0 ? 'Premium' : 'Free'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {course._count?.lessons || 0} lessons
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        View Course
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {isEnrolledInCourse(course.id) && (
                      <CourseDownload 
                        courseId={course.id}
                        courseName={course.title}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No courses found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {searchQuery 
                ? 'Try adjusting your search or filter criteria'
                : 'No courses are currently available'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}