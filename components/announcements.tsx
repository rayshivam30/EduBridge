"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Plus, Edit, Trash2, Globe, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CreateAnnouncementDialog } from "./create-announcement-dialog"
import { toast } from "sonner"

interface Announcement {
  id: string
  title: string
  content: string
  isPublic: boolean
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  course: {
    id: string
    title: string
  } | null
  isLiked: boolean
  likesCount: number
}

interface AnnouncementsProps {
  courseId?: string
  autoOpenCreate?: boolean
}

export function Announcements({ courseId, autoOpenCreate }: AnnouncementsProps) {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    id: string
    title: string
    content: string
    isPublic: boolean
    courseId?: string
  } | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchAnnouncements = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10"
      })

      if (courseId) {
        params.append("courseId", courseId)
      }

      const response = await fetch(`/api/announcements?${params}`)
      if (!response.ok) throw new Error("Failed to fetch announcements")

      const data = await response.json()

      if (reset) {
        setAnnouncements(data.announcements)
      } else {
        setAnnouncements(prev => [...prev, ...data.announcements])
      }

      setHasMore(data.pagination.page < data.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchAnnouncements(1, true)
  }, [fetchAnnouncements])

  useEffect(() => {
    if (autoOpenCreate && session?.user?.role === "TEACHER") {
      setShowCreateDialog(true)
    }
  }, [autoOpenCreate, session])

  const handleLike = async (announcementId: string, isCurrentlyLiked: boolean) => {
    try {
      const method = isCurrentlyLiked ? "DELETE" : "POST"
      const response = await fetch(`/api/announcements/${announcementId}/like`, {
        method
      })

      if (!response.ok) throw new Error("Failed to update like")

      const data = await response.json()

      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement.id === announcementId
            ? {
              ...announcement,
              isLiked: data.isLiked,
              likesCount: data.likesCount
            }
            : announcement
        )
      )
    } catch (error) {
      console.error("Error updating like:", error)
      toast.error("Failed to update like")
    }
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete announcement")

      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
      toast.success("Announcement deleted successfully")
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement")
    }
  }

  const handleAnnouncementCreated = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev])
    setShowCreateDialog(false)
    toast.success("Announcement created successfully")
  }

  const handleAnnouncementUpdated = (updatedAnnouncement: Announcement) => {
    setAnnouncements(prev =>
      prev.map(announcement =>
        announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
      )
    )
    setEditingAnnouncement(null)
    toast.success("Announcement updated successfully")
  }

  const handleEdit = (announcement: Announcement) => {
    // Transform the announcement to match the dialog's expected format
    const editingData = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublic: announcement.isPublic,
      courseId: announcement.course?.id || undefined
    }
    setEditingAnnouncement(editingData)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true)
      fetchAnnouncements(page + 1, false)
    }
  }

  if (loading && announcements.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Announcements</h2>
        {session?.user?.role === "TEACHER" && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements yet.
              {session?.user?.role === "TEACHER" && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create your first announcement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={announcement.author.image || ""} />
                      <AvatarFallback>
                        {announcement.author.name?.[0] || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{announcement.author.name}</p>
                        <Badge variant={announcement.isPublic ? "default" : "secondary"}>
                          {announcement.isPublic ? (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Course Only
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                        {announcement.course && (
                          <span className="ml-2">• {announcement.course.title}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {session?.user?.id === announcement.author.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{announcement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                  {announcement.content}
                </p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(announcement.id, announcement.isLiked)}
                    className={announcement.isLiked ? "text-red-500" : ""}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${announcement.isLiked ? "fill-current" : ""
                        }`}
                    />
                    {announcement.likesCount}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAnnouncementCreated={handleAnnouncementCreated}
        courseId={courseId}
      />

      {editingAnnouncement && (
        <CreateAnnouncementDialog
          open={!!editingAnnouncement}
          onOpenChange={(open) => !open && setEditingAnnouncement(null)}
          onAnnouncementCreated={handleAnnouncementUpdated}
          courseId={courseId}
          editingAnnouncement={editingAnnouncement}
        />
      )}
    </div>
  )
}