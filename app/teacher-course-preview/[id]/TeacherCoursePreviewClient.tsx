"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Eye, 
  BookOpen, 
  Users,
  FileText,
  Video,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  Settings,
  BarChart3,
  Play
} from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Lesson {
  id: string
  title: string
  description?: string
  contentURL: string | null // Keep for backward compatibility
  contentTypes: string[]
  textContent?: string
  externalLinks?: string[]
  videoType?: "upload" | "youtube"
  videoUrl?: string
  videoPublicId?: string
  youtubeUrl?: string
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  price: number | string
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

interface TeacherCoursePreviewClientProps {
  course: any
}

export function TeacherCoursePreviewClient({ course }: TeacherCoursePreviewClientProps) {
  const router = useRouter()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  const sortedLessons = useMemo(() => 
    [...course.lessons].sort((a, b) => a.order - b.order),
    [course.lessons]
  )

  const currentLesson = sortedLessons[currentLessonIndex]

  const handleNavigate = (page: string) => {
    switch (page) {
      case "teacher-dashboard":
        router.push("/teacher-dashboard")
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
    const hasContent = lesson.contentTypes?.length > 0 || lesson.videoType || lesson.videoUrl || lesson.contentURL
    
    if (!hasContent) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No content available</h3>
          <p className="text-muted-foreground mb-4">This lesson doesn&apos;t have any content yet.</p>
          <Button 
            onClick={() => router.push(`/manage-course/${course.id}`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Add Content
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Text Content */}
        {lesson.contentTypes?.includes("text") && lesson.textContent && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Text Content</h4>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-6">
                {lesson.textContent}
              </div>
            </div>
          </div>
        )}

        {/* External Links */}
        {lesson.contentTypes?.includes("links") && lesson.externalLinks && lesson.externalLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">External Links</h4>
            </div>
            <div className="space-y-2">
              {lesson.externalLinks.map((link, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{link}</span>
                    <Button asChild size="sm" variant="outline">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Content */}
        {lesson.videoType === "youtube" && lesson.youtubeUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Video Content</h4>
            </div>
            {lesson.youtubeUrl.includes('<iframe') && lesson.youtubeUrl.includes('</iframe>') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div 
                  dangerouslySetInnerHTML={{ __html: lesson.youtubeUrl }}
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                />
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.youtubeUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            )}
          </div>
        )}

        {lesson.videoType === "upload" && lesson.videoUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Uploaded Video</h4>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {lesson.videoType === "upload" && !lesson.videoUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Video Upload</h4>
            </div>
            <div className="border rounded-lg p-6 text-center">
              <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Video Uploaded</h3>
              <p className="text-muted-foreground">Video upload is selected but no video has been uploaded yet.</p>
            </div>
          </div>
        )}

        {/* Backward compatibility - show old contentURL if no new content */}
        {!lesson.contentTypes?.length && !lesson.videoType && lesson.contentURL && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Legacy Content</h4>
            </div>
            {lesson.contentURL.includes('<iframe') && lesson.contentURL.includes('</iframe>') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div 
                  dangerouslySetInnerHTML={{ __html: lesson.contentURL }}
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                />
              </div>
            ) : lesson.contentURL.includes('youtube.com') || lesson.contentURL.includes('youtu.be') || lesson.contentURL.includes('vimeo.com') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.contentURL}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : lesson.contentURL.startsWith('http') ? (
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
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-6">
                  {lesson.contentURL}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Teacher Note:</strong> This is how students will see the lesson content.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="teacher-dashboard" onNavigate={handleNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="w-3 h-3" />
                  Teacher Preview
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {sortedLessons.length} lessons
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course._count.enrollments} students enrolled
                </div>
                <Badge variant={course.status === "published" ? "default" : "outline"}>
                  {course.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/manage-course/${course.id}`)}
              variant="outline"
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Course
            </Button>
            <Button
              onClick={() => router.push(`/course-player/${course.id}`)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Student View
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Course Overview</TabsTrigger>
            <TabsTrigger value="content">Content Preview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <h3 className="text-lg font-semibold mb-4">Course Description</h3>
                <p className="text-muted-foreground mb-6">{course.description}</p>
                
                <h3 className="text-lg font-semibold mb-4">Course Structure</h3>
                <div className="space-y-3">
                  {sortedLessons.length > 0 ? sortedLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setCurrentLessonIndex(index)
                        setActiveTab("content")
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {(lesson.contentTypes?.length > 0 || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content yet"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No lessons yet</h3>
                      <p className="text-muted-foreground mb-4">Start building your course by adding lessons</p>
                      <Button 
                        onClick={() => router.push(`/manage-course/${course.id}`)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Add Lessons
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Course Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={course.status === "published" ? "default" : "outline"}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{sortedLessons.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-medium">{course._count.enrollments}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => router.push(`/manage-course/${course.id}`)}
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Course
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("analytics")}
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Preview Tab */}
          <TabsContent value="content" className="space-y-6">
            {sortedLessons.length > 0 ? (
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Lesson {currentLesson?.order}: {currentLesson?.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Preview how this lesson appears to students
                        </p>
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

                    {currentLesson && renderLessonContent(currentLesson)}
                    
                    <div className="flex justify-between items-center pt-6 border-t mt-6">
                      <div className="text-sm text-muted-foreground">
                        Lesson {currentLessonIndex + 1} of {sortedLessons.length}
                      </div>
                      <Button 
                        onClick={() => router.push(`/manage-course/${course.id}`)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit This Lesson
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">All Lessons</h3>
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
                          <div className="text-sm font-medium text-foreground truncate">
                            {lesson.order}. {lesson.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(lesson.contentTypes?.length > 0 || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No lessons to preview</h3>
                <p className="text-muted-foreground mb-6">Add lessons to your course to see how they&apos;ll appear to students</p>
                <Button 
                  onClick={() => router.push(`/manage-course/${course.id}`)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Add Lessons
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Course Analytics</h3>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics about student engagement, progress, and performance will be available here.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}