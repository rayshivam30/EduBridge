"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BookOpen, Clock, Award, Users, TrendingUp, Play, MessageCircle } from "lucide-react"

interface StudentDashboardProps {
  onNavigate?: (page: string) => void
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enrollments, setEnrollments] = useState<any[] | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/enrollments", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setEnrollments(Array.isArray(data) ? data : [])
        }
      } catch (_) {
        // ignore, keep mock
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const currentCourses = useMemo(
    () =>
      (enrollments ?? []).map((e) => ({
        title: e.course?.title ?? "Course",
        instructor: `by ${e.course?.createdBy?.name ?? "Instructor"}`,
        level: e.course?.price && Number(e.course.price) > 0 ? "Paid" : "Free",
        progress: e.progress ?? 0,
        id: e.courseId as string,
      })),
    [enrollments]
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here{'\''}s your learning progress this week</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Learning Time */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Learning Time This Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={learningTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="hours" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Progress Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Course Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Ongoing Courses */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Current Courses</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading your courses...</p>
                </div>
              ) : currentCourses.length > 0 ? (
                currentCourses.map((course, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const cid = (course as any).id as string | undefined
                    if (cid) window.location.href = `/course-player/${cid}`
                    else onNavigate?.("course-player")
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.instructor}</p>
                    </div>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {course.level}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No courses yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by enrolling in a course from the catalog.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => onNavigate?.("courses")}>
                      Browse Courses
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                className="w-full justify-start gap-3 h-auto py-3 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onNavigate?.("course-player")}
              >
                <Play className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Continue Learning</div>
                  <div className="text-xs opacity-90">Resume from where you left off</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => onNavigate?.("ai-tutor")}
              >
                <MessageCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Ask AI Tutor</div>
                  <div className="text-xs opacity-90">Get help with your doubts</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-3 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => onNavigate?.("community-forum")}
              >
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Join Community</div>
                  <div className="text-xs opacity-90">Connect with other learners</div>
                </div>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Recommended For You</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/50" />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-foreground text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{rec.category}</p>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 bg-muted rounded-full">
                      <div className="h-1 bg-accent rounded-full" style={{ width: `${rec.popularity}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{rec.students}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

const stats = [
  { label: "Hours Learning", value: "12.5", icon: Clock, color: "bg-primary/10 text-primary" },
  { label: "Courses Active", value: "4", icon: BookOpen, color: "bg-secondary/10 text-secondary" },
  { label: "Certificates", value: "3", icon: Award, color: "bg-accent/10 text-accent" },
  { label: "Study Streak", value: "15 days", icon: TrendingUp, color: "bg-primary/10 text-primary" },
]

const learningTimeData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 3.5 },
  { day: "Fri", hours: 4 },
  { day: "Sat", hours: 2 },
  { day: "Sun", hours: 1.5 },
]

const progressData = [
  { name: "Completed", value: 35, color: "var(--primary)" },
  { name: "In Progress", value: 45, color: "var(--secondary)" },
  { name: "Not Started", value: 20, color: "var(--muted)" },
]

// Removed mock courses to only show enrolled courses

const recommendations = [
  {
    title: "Advanced JavaScript",
    category: "Programming",
    popularity: 92,
    students: 15,
  },
  {
    title: "Machine Learning 101",
    category: "AI/ML",
    popularity: 88,
    students: 22,
  },
  {
    title: "UI/UX Design Sprint",
    category: "Design",
    popularity: 85,
    students: 18,
  },
  {
    title: "Business Analytics",
    category: "Business",
    popularity: 80,
    students: 12,
  },
]
