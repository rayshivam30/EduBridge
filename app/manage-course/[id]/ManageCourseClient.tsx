"use client"

import { useState, useEffect, useCallback } from "react"
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
  BookOpen,
  Upload,
  Youtube,
  ExternalLink,
  StickyNote
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { VideoUpload } from "@/components/video-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Lesson {
  id: string
  title: string
  description?: string
  contentURL: string | null // Keep for backward compatibility
  contentTypes?: string[] // Array to store multiple selected content types
  videoType?: "upload" | "youtube" // For video content type
  textContent?: string // For text/notes content
  externalLinks?: string[] // For external links
  videoUrl?: string // For uploaded video URL from Cloudinary
  videoPublicId?: string // Cloudinary public ID for video
  youtubeUrl?: string // For YouTube URL or embed code
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

  const loadCourse = useCallback(async () => {
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
  }, [courseId, router])

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId, loadCourse])

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
      description: "",
      contentURL: "",
      contentTypes: [],
      textContent: "",
      externalLinks: [],
      videoUrl: "",
      videoPublicId: "",
      youtubeUrl: "",
      order: (course?.lessons.length || 0) + 1
    }
    setEditingLesson(newLesson)
    setShowLessonForm(true)
  }

  const saveLesson = async (lesson: Lesson) => {
    try {
      const lessonData = {
        title: lesson.title,
        description: lesson.description,
        contentTypes: lesson.contentTypes,
        textContent: lesson.textContent,
        externalLinks: lesson.externalLinks,
        videoType: lesson.videoType,
        videoUrl: lesson.videoUrl,
        videoPublicId: lesson.videoPublicId,
        youtubeUrl: lesson.youtubeUrl,
        order: lesson.order,
        // Keep old field for backward compatibility
        content: lesson.textContent || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL
      }

      if (lesson.id) {
        // Update existing lesson
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lessonData)
        })
        if (!res.ok) throw new Error("Failed to update lesson")
      } else {
        // Create new lesson
        const res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            ...lessonData
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
    // Ensure all new fields are initialized for backward compatibility
    const normalizedLesson: Lesson = {
      ...lesson,
      description: lesson.description || "",
      contentTypes: lesson.contentTypes || [],
      textContent: lesson.textContent || "",
      externalLinks: lesson.externalLinks || [],
      videoUrl: lesson.videoUrl || "",
      videoPublicId: lesson.videoPublicId || "",
      youtubeUrl: lesson.youtubeUrl || "",
      videoType: lesson.videoType || undefined,
    }
    
    setEditingLesson(normalizedLesson)
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
          <p className="text-muted-foreground mb-4">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.</p>
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
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground">{lesson.title || "Untitled Lesson"}</h4>
                                <div className="flex gap-1">
                                  {lesson.contentTypes?.includes("text") && (
                                    <Badge variant="outline" className="text-xs">
                                      <StickyNote className="w-3 h-3 mr-1" />
                                      Text
                                    </Badge>
                                  )}
                                  {lesson.contentTypes?.includes("links") && (
                                    <Badge variant="outline" className="text-xs">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Links
                                    </Badge>
                                  )}
                                  {lesson.videoType === "upload" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Upload className="w-3 h-3 mr-1" />
                                      Video
                                    </Badge>
                                  )}
                                  {lesson.videoType === "youtube" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Youtube className="w-3 h-3 mr-1" />
                                      YouTube
                                    </Badge>
                                  )}
                                  {/* Show old content type for backward compatibility */}
                                  {(!lesson.contentTypes || lesson.contentTypes.length === 0) && !lesson.videoType && lesson.contentURL && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Legacy
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {((lesson.contentTypes && lesson.contentTypes.length > 0) || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content"}
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
  const [newExternalLink, setNewExternalLink] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Please enter a lesson title")
      return
    }
    if ((!formData.contentTypes || formData.contentTypes.length === 0) && !formData.videoType && !formData.contentURL) {
      alert("Please select at least one content type or add content")
      return
    }
    onSave(formData)
  }

  const handleChange = (field: keyof Lesson, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      contentTypes: (prev.contentTypes || []).includes(type)
        ? (prev.contentTypes || []).filter(t => t !== type)
        : [...(prev.contentTypes || []), type]
    }))
  }

  const addExternalLink = () => {
    if (newExternalLink.trim()) {
      setFormData(prev => ({
        ...prev,
        externalLinks: [...(prev.externalLinks || []), newExternalLink.trim()]
      }))
      setNewExternalLink("")
    }
  }

  const removeExternalLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      externalLinks: prev.externalLinks?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {lesson.id ? "Edit Lesson" : "Add New Lesson"}
            </h3>
            <Button type="button" variant="ghost" onClick={onCancel}>
              ×
            </Button>
          </div>

          <div className="grid gap-6">
            {/* Basic Information */}
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
                <Label htmlFor="lesson-description">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe what this lesson covers"
                  rows={3}
                />
              </div>
            </div>

            {/* Content Type Selection - First Dropdown */}
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label>Content Types (Select multiple)</Label>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="text-notes"
                      checked={(formData.contentTypes || []).includes("text")}
                      onCheckedChange={() => toggleContentType("text")}
                    />
                    <Label htmlFor="text-notes" className="flex items-center gap-2 cursor-pointer">
                      <StickyNote className="w-4 h-4" />
                      Text/Notes
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="external-links"
                      checked={(formData.contentTypes || []).includes("links")}
                      onCheckedChange={() => toggleContentType("links")}
                    />
                    <Label htmlFor="external-links" className="flex items-center gap-2 cursor-pointer">
                      <ExternalLink className="w-4 h-4" />
                      External Links
                    </Label>
                  </div>
                </div>
              </div>

              {/* Video Content - Second Dropdown */}
              <div className="grid gap-3">
                <Label>Video Content (Optional)</Label>
                <RadioGroup
                  value={formData.videoType || ""}
                  onValueChange={(value: "upload" | "youtube") => handleChange("videoType", value)}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="upload" id="video-upload" />
                    <Label htmlFor="video-upload" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload Video File
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="youtube" id="youtube-link" />
                    <Label htmlFor="youtube-link" className="flex items-center gap-2 cursor-pointer">
                      <Youtube className="w-4 h-4" />
                      YouTube Link/Embed Code
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Dynamic Content Sections */}
            <div className="space-y-6">
              {/* Text/Notes Content */}
              {(formData.contentTypes || []).includes("text") && (
                <div className="grid gap-2">
                  <Label htmlFor="text-content">Text/Notes Content</Label>
                  <Textarea
                    id="text-content"
                    value={formData.textContent || ""}
                    onChange={(e) => handleChange("textContent", e.target.value)}
                    placeholder="Enter lesson content, notes, or materials"
                    rows={6}
                  />
                </div>
              )}

              {/* External Links */}
              {(formData.contentTypes || []).includes("links") && (
                <div className="grid gap-3">
                  <Label>External Links</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newExternalLink}
                      onChange={(e) => setNewExternalLink(e.target.value)}
                      placeholder="Enter external link URL"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExternalLink())}
                    />
                    <Button type="button" onClick={addExternalLink} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.externalLinks && formData.externalLinks.length > 0 && (
                    <div className="space-y-2">
                      {formData.externalLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1 text-sm">{link}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExternalLink(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Video Upload */}
              {formData.videoType === "upload" && (
                <div className="grid gap-2">
                  <Label>Upload Video File</Label>
                  <VideoUpload
                    currentVideoUrl={formData.videoUrl}
                    onUploadComplete={(videoUrl, publicId) => {
                      setFormData(prev => ({
                        ...prev,
                        videoUrl,
                        videoPublicId: publicId
                      }))
                    }}
                    onUploadError={(error) => {
                      alert(error)
                    }}
                  />
                </div>
              )}

              {/* YouTube Link/Embed */}
              {formData.videoType === "youtube" && (
                <div className="grid gap-2">
                  <Label htmlFor="youtube-url">YouTube URL or Embed Code</Label>
                  <Textarea
                    id="youtube-url"
                    value={formData.youtubeUrl || ""}
                    onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                    placeholder="Enter YouTube URL or embed code"
                    rows={4}
                  />
                </div>
              )}

              {/* Legacy Content (for backward compatibility) */}
              {(!formData.contentTypes || formData.contentTypes.length === 0) && !formData.videoType && (
                <div className="grid gap-2">
                  <Label htmlFor="legacy-content">Legacy Content</Label>
                  <Textarea
                    id="legacy-content"
                    value={formData.contentURL || ""}
                    onChange={(e) => handleChange("contentURL", e.target.value)}
                    placeholder="Enter lesson content, video URL, or materials"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the old content format. Consider using the new content types above for better organization.
                  </p>
                </div>
              )}
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