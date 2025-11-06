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

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState(0)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)

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

  const createCourse = async () => {
    const title = window.prompt("Course title")
    if (!title) return
    const description = window.prompt("Short description") || ""
    const priceStr = window.prompt("Price (number)", "0") || "0"
    const price = Number(priceStr) || 0
    setLoading(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, price, status: "draft" }),
      })
      if (!res.ok) {
        throw new Error(`Failed to create course: ${res.status}`)
      }
      await load()
    } catch (error) {
      console.error("Error creating course:", error)
      alert("Failed to create course. Please try again.")
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Prof. Kumar!</h1>
          <p className="text-muted-foreground">Manage your courses and monitor student progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {teacherStats.map((stat, idx) => (
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
              <Button onClick={createCourse} disabled={loading} className="gap-2">
                <Plus className="w-4 h-4" /> Create Course
              </Button>
            </div>
            <div className="space-y-4">
              {(list.length ? list : courses).map((course, idx) => (
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
                      <Button onClick={() => (typeof (course as any).id === "string" ? (window.location.href = `/course-player/${(course as any).id}`) : onNavigate?.("course-player"))} variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => typeof (course as any).id === "string" && editCourse((course as any).id)} variant="ghost" size="sm" className="gap-2">
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
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        course.status === "Active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: `${course.completion}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Course Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Student Engagement */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Student Engagement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="var(--secondary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Assessment Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Assessment Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assessmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="score" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Recent Student Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color}`}
                >
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{activity.student}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

const teacherStats = [
  { label: "Total Students", value: "248", icon: Users, color: "bg-primary/10 text-primary", change: "+12 this month" },
  {
    label: "Active Courses",
    value: "5",
    icon: BookOpen,
    color: "bg-secondary/10 text-secondary",
    change: "2 new this semester",
  },
  {
    label: "Avg. Engagement",
    value: "78%",
    icon: TrendingUp,
    color: "bg-accent/10 text-accent",
    change: "+5% last week",
  },
  { label: "Messages", value: "42", icon: MessageSquare, color: "bg-primary/10 text-primary", change: "12 unanswered" },
]

const courses = [
  {
    title: "Web Development Masterclass",
    students: 156,
    completion: 65,
    status: "Active",
  },
  {
    title: "Python for Data Science",
    students: 89,
    completion: 42,
    status: "Active",
  },
  {
    title: "Digital Marketing Basics",
    students: 203,
    completion: 88,
    status: "Active",
  },
]

const courseDistribution = [
  { name: "Web Development", value: 156, color: "var(--primary)" },
  { name: "Data Science", value: 89, color: "var(--secondary)" },
  { name: "Marketing", value: 203, color: "var(--accent)" },
]

const engagementData = [
  { day: "Mon", active: 156, completed: 42 },
  { day: "Tue", active: 178, completed: 55 },
  { day: "Wed", active: 142, completed: 38 },
  { day: "Thu", active: 189, completed: 62 },
  { day: "Fri", active: 201, completed: 71 },
  { day: "Sat", active: 98, completed: 28 },
  { day: "Sun", active: 76, completed: 15 },
]

const assessmentData = [
  { name: "Quiz 1", score: 82 },
  { name: "Quiz 2", score: 78 },
  { name: "Assignment 1", score: 85 },
  { name: "Midterm", score: 79 },
  { name: "Final Project", score: 88 },
]

const activities = [
  {
    student: "Alex Johnson",
    action: "Completed Web Development Module 3",
    time: "2 hours ago",
    icon: Award,
    color: "bg-secondary/10 text-secondary",
  },
  {
    student: "Sarah Chen",
    action: "Asked question on Discussion Forum",
    time: "4 hours ago",
    icon: MessageSquare,
    color: "bg-primary/10 text-primary",
  },
  {
    student: "Mike Davis",
    action: "Submitted Assignment 2",
    time: "6 hours ago",
    icon: BookOpen,
    color: "bg-accent/10 text-accent",
  },
  {
    student: "Emma Wilson",
    action: "Completed Practice Problems (8/10)",
    time: "1 day ago",
    icon: Clock,
    color: "bg-primary/10 text-primary",
  },
]
