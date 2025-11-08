"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, BookOpen, TrendingUp, MessageSquare, Plus, Edit, Trash2, Eye, Award, Clock } from "lucide-react"

interface TeacherDashboardProps {
  onNavigate?: (page: string) => void
}

interface AnalyticsData {
  engagementData: Array<{
    day: string
    active: number
    completed: number
  }>
  assessmentData: Array<{
    name: string
    score: number
  }>
  activities: Array<{
    student: string
    action: string
    time: string
    type: string
  }>
  summary?: {
    totalStudents: number
    totalCourses: number
    activeCourses: number
    totalLessons: number
    totalForumPosts: number
  }
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/courses", { cache: "no-store" })
      if (res.ok) {
        setItems(await res.json())
      } else {
        console.error("Failed to load courses:", res.status)
        alert("Failed to load courses. Please try again.")
      }
    } catch (error) {
      console.error("Error loading courses:", error)
      alert("An error occurred while loading courses.")
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const res = await fetch("/api/dashboard/teacher-analytics", { cache: "no-store" })
      if (res.ok) {
        setAnalyticsData(await res.json())
      } else {
        setAnalyticsError("Failed to load analytics data")
        console.error("Failed to load analytics:", res.status)
      }
    } catch (error) {
      setAnalyticsError("An error occurred while loading analytics")
      console.error("Error loading analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }



  const editCourse = async (id: string) => {
    const title = window.prompt("New title (leave blank to keep)")
    const description = window.prompt("New description (leave blank to keep)")
    const priceStr = window.prompt("New price (leave blank to keep)")
    const payload: any = {}
    if (title) payload.title = title
    if (description) payload.description = description
    if (priceStr) payload.price = Number(priceStr)
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Failed to update course: ${res.status}`)
      }
      await load()
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Failed to update course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Delete this course?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error(`Failed to delete course: ${res.status}`)
      }
      await load()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadAnalytics()
  }, [])

  const list = useMemo(
    () =>
      (items ?? []).map((c) => ({
        id: c.id as string,
        title: c.title as string,
        students: c._count?.enrollments ?? 0,
        completion: 0,
        status: (c.status ?? "draft") === "published" ? "Active" : "Draft",
      })),
    [items]
  )

  const dynamicStats = useMemo(() => {
    const totalStudents = list.reduce((sum, course) => sum + course.students, 0)
    const activeCourses = list.filter(course => course.status === "Active").length
    const totalCourses = list.length

    return [
      {
        label: "Total Students",
        value: totalStudents.toString(),
        icon: Users,
        color: "bg-primary/10 text-primary",
        change: `${totalCourses} courses`
      },
      {
        label: "Active Courses",
        value: activeCourses.toString(),
        icon: BookOpen,
        color: "bg-secondary/10 text-secondary",
        change: `${totalCourses - activeCourses} drafts`,
      },
      {
        label: "Total Courses",
        value: totalCourses.toString(),
        icon: TrendingUp,
        color: "bg-accent/10 text-accent",
        change: activeCourses > 0 ? "Published courses" : "No published yet",
      },
      {
        label: "Avg. Students",
        value: totalCourses > 0 ? Math.round(totalStudents / totalCourses).toString() : "0",
        icon: MessageSquare,
        color: "bg-primary/10 text-primary",
        change: "per course"
      },
    ]
  }, [list])

  const dynamicCourseDistribution = useMemo(() => {
    if (list.length === 0) {
      return [{ name: "No courses", value: 1, color: "var(--muted)" }]
    }

    const statusCounts = list.reduce((acc, course) => {
      acc[course.status] = (acc[course.status] || 0) + course.students
      return acc
    }, {} as Record<string, number>)

    const colors = ["var(--primary)", "var(--secondary)", "var(--accent)"]
    return Object.entries(statusCounts).map(([status, value], index) => ({
      name: status,
      value,
      color: colors[index % colors.length]
    }))
  }, [list])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Teacher!</h1>
          <p className="text-muted-foreground">Manage your courses and monitor student progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {dynamicStats.map((stat, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-secondary mt-2">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Courses Overview */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Your Courses</h3>
              <Button onClick={() => onNavigate?.("create-course")} className="gap-2">
                <Plus className="w-4 h-4" /> Create Course
              </Button>
            </div>
            <div className="space-y-4">
              {list.length > 0 ? list.map((course, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-foreground">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.students} students enrolled</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => (typeof (course as any).id === "string" ? (window.location.href = `/teacher-course-preview/${(course as any).id}`) : onNavigate?.("course-player"))} variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => typeof (course as any).id === "string" ? (window.location.href = `/manage-course/${(course as any).id}`) : editCourse((course as any).id)} variant="ghost" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => typeof (course as any).id === "string" && deleteCourse((course as any).id)} variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{course.completion}% avg completion</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${course.status === "Active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: `${course.completion}%` }} />
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No courses yet</h3>
                  <p className="text-muted-foreground mb-6">Start building your first course to share knowledge with students</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => onNavigate?.("create-course")} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Course
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {list.length > 0 ? "Student Distribution" : "Course Overview"}
            </h3>
            {list.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dynamicCourseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dynamicCourseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-center">
                <div>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Create courses to see analytics</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Analytics Overview</h2>
          <Button
            onClick={loadAnalytics}
            disabled={analyticsLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {analyticsLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Student Engagement */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Student Engagement</h3>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">Loading engagement data...</div>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{analyticsError}</p>
                  <Button onClick={loadAnalytics} variant="outline" size="sm" className="mt-4">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : analyticsData?.engagementData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => [
                      value,
                      name === 'active' ? 'Active Students' : 'Completed Lessons'
                    ]}
                  />
                  <Line type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2} name="Active Students" />
                  <Line type="monotone" dataKey="completed" stroke="var(--secondary)" strokeWidth={2} name="Completed Lessons" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No engagement data available</p>
                  <p className="text-sm text-muted-foreground">Data will appear when students start engaging with your courses</p>
                </div>
              </div>
            )}
          </Card>

          {/* Assessment Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Course Progress Overview</h3>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">Loading progress data...</div>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{analyticsError}</p>
                  <Button onClick={loadAnalytics} variant="outline" size="sm" className="mt-4">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : analyticsData?.assessmentData && analyticsData.assessmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.assessmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    formatter={(value) => [`${value}%`, 'Average Progress']}
                  />
                  <Bar dataKey="score" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No progress data available</p>
                  <p className="text-sm text-muted-foreground">Data will appear when students make progress in your courses</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Recent Student Activity</h3>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading recent activities...</div>
            </div>
          ) : analyticsError ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{analyticsError}</p>
              <Button onClick={loadAnalytics} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : analyticsData?.activities && analyticsData.activities.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.activities.map((activity, idx) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'completion': return Award
                    case 'progress': return Clock
                    case 'forum': return MessageSquare
                    default: return BookOpen
                  }
                }

                const getActivityColor = (type: string) => {
                  switch (type) {
                    case 'completion': return "bg-secondary/10 text-secondary"
                    case 'progress': return "bg-primary/10 text-primary"
                    case 'forum': return "bg-accent/10 text-accent"
                    default: return "bg-primary/10 text-primary"
                  }
                }

                const ActivityIcon = getActivityIcon(activity.type)

                return (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{activity.student}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No recent activity</h3>
              <p className="text-muted-foreground mb-6">Student activities will appear here when they engage with your courses</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}




