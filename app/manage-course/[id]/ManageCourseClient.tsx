"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  FileText,
  Video,
  Link,
  GripVertical,
  Users,
  BookOpen
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
  price: number
  status: "draft" | "published" | "archived"
  lessons: Lesson[]
  _count: {
    lessons: number
    enrollments: number
  }
  createdBy: {
    id: string
    name: string | null
    image: string | null
  }
}

export function ManageCourseClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [course, setCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
      } else if (res.status === 403) {
        alert("You don't have permission to edit this course")
        router.push("/teacher-dashboard")
      } else {
        throw new Error("Failed to load course")
      }
    } catch (error) {
      console.error("Error loading course:", error)
      alert("Failed to load course")
      router.push("/teacher-dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (page: string) => {
    switch (page) {
      case "teacher-dashboard":
        router.push("/teacher-dashboard")
        break
      default:
        router.push(`/${page}`)
    }
  }

  const handleCourseChange = (field: keyof Course, value: any) => {
    if (!course) return
    setCourse(prev => prev ? { ...prev, [field]: value } : null)
  }

  const saveCourse = async (status?: "draft" | "published" | "archived") => {
    if (!course) return

    setSaving(true)
    try {
      const updateData: any = {
        title: course.title,
        description: course.description,
        price: course.price
      }
      
      if (status) {
        updateData.status = status
      }

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        const updatedCourse = await res.json()
        setCourse(prev => prev ? { ...prev, ...updatedCourse } : null)
        alert("Course updated successfully!")
      } else {
        throw new Error("Failed to update course")
      }
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Failed to update course")
    } finally {
      setSaving(false)
    }
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      id: "",
      title: "",
      contentURL: "",
      order: (course?.lessons.length || 0) + 1
    }
    setEditingLesson(newLesson)
    setShowLessonForm(true)
  }

  const saveLesson = async (lesson: Lesson) => {
    try {
      if (lesson.id) {
        // Update existing lesson
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lesson.title,
            content: lesson.contentURL,
            order: lesson.order
          })
        })
        if (!res.ok) throw new Error("Failed to update lesson")
      } else {
        // Create new lesson
        const res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: lesson.title,
            content: lesson.contentURL,
            order: lesson.order
          })
        })
        if (!res.ok) throw new Error("Failed to create lesson")
      }
      
      // Reload course data
      await loadCourse()
      setEditingLesson(null)
      setShowLessonForm(false)
    } catch (error) {
      console.error("Error saving lesson:", error)
      alert("Failed to save lesson")
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        await loadCourse()
      } else {
        throw new Error("Failed to delete lesson")
      }
    } catch (error) {
      console.error("Error deleting lesson:", error)
      alert("Failed to delete lesson")
    }
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowLessonForm(true)
  }

  const deleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        alert("Course deleted successfully")
        router.push("/teacher-dashboard")
      } else {
        throw new Error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist or you don't have permission to access it.</p>
          <Button onClick={() => router.push("/teacher-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="teacher-dashboard" onNavigate={handleNavigate} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/teacher-dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={course.status === "published" ? "default" : "secondary"}>
                  {course.status}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course._count.lessons} lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course._count.enrollments} students
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCourse}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Course
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="lessons">Lessons & Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => handleCourseChange("title", e.target.value)}
                    placeholder="Enter course title"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => handleCourseChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={course.price}
                      onChange={(e) => handleCourseChange("price", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => saveCourse()} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Course Lessons</h2>
                <Button onClick={addLesson} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Lesson
                </Button>
              </div>

              {course.lessons.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No lessons yet</h3>
                  <p className="text-muted-foreground mb-6">Start building your course by adding lessons</p>
                  <Button onClick={addLesson} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Lesson
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <div key={lesson.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GripVertical className="w-4 h-4" />
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1">{lesson.title || "Untitled Lesson"}</h4>
                              <p className="text-sm text-muted-foreground">
                                {lesson.contentURL ? "Has content" : "No content"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editLesson(lesson)}
                              className="gap-1"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLesson(lesson.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Course Settings</h2>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Course Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.status === "draft" && "Course is in draft mode and not visible to students"}
                        {course.status === "published" && "Course is live and available to students"}
                        {course.status === "archived" && "Course is archived and no longer available"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {course.status !== "published" && (
                        <Button onClick={() => saveCourse("published")} disabled={saving}>
                          Publish
                        </Button>
                      )}
                      {course.status !== "draft" && (
                        <Button onClick={() => saveCourse("draft")} disabled={saving} variant="outline">
                          Draft
                        </Button>
                      )}
                      {course.status !== "archived" && (
                        <Button onClick={() => saveCourse("archived")} disabled={saving} variant="outline">
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Lesson Form Modal */}
      {showLessonForm && editingLesson && (
        <LessonForm
          lesson={editingLesson}
          onSave={saveLesson}
          onCancel={() => {
            setEditingLesson(null)
            setShowLessonForm(false)
          }}
        />
      )}
    </div>
  )
}

interface LessonFormProps {
  lesson: Lesson
  onSave: (lesson: Lesson) => void
  onCancel: () => void
}

function LessonForm({ lesson, onSave, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState<Lesson>(lesson)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Please enter a lesson title")
      return
    }
    onSave(formData)
  }

  const handleChange = (field: keyof Lesson, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {lesson.id ? "Edit Lesson" : "Add New Lesson"}
            </h3>
            <Button type="button" variant="ghost" onClick={onCancel}>
              ×
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter lesson title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lesson-content">Content (URL, Notes, or Materials)</Label>
              <Textarea
                id="lesson-content"
                value={formData.contentURL || ""}
                onChange={(e) => handleChange("contentURL", e.target.value)}
                placeholder="Enter lesson content, video URL, or materials"
                rows={6}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Lesson
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}