"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Plus, TrendingUp, Wifi, WifiOff, Clock, Send } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { offlineManager } from "@/lib/offline-manager"
import { toast } from "sonner"

interface CommunityForumProps {
  onNavigate: (page: string) => void
}

export function CommunityForum({ onNavigate }: CommunityForumProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [threadsData, setThreadsData] = useState<{ items: Thread[]; page: number; pages: number; total: number } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const { isOnline } = useOffline()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")

  // Get user info for offline functionality
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setUserId(session.user.id)
          setUserName(session.user.name || 'User')
        }
      })
      .catch(console.error)
  }, [])

  const refreshList = useCallback(async () => {
    setLoading(true)
    try {
      if (isOnline) {
        // If online, fetch fresh data first
        try {
          const params = new URLSearchParams()
          params.set("page", "1")
          if (searchQuery.trim()) params.set("q", searchQuery.trim())
          if (selectedCategory !== "all") params.set("courseId", selectedCategory)
          const res = await fetch(`/api/forum/threads?${params.toString()}`, { cache: "no-store" })
          if (!res.ok) {
            throw new Error(`Failed to fetch threads: ${res.status}`)
          }
          const json = await res.json()
          setThreadsData(json)
          
          // Cache the fresh data for offline use (but don't create duplicates)
          if (json.items && json.items.length > 0) {
            // Clear existing cached posts for this category to avoid duplicates
            try {
              await offlineManager.clearCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
            } catch (clearError) {
              console.warn('Failed to clear cached posts:', clearError)
            }
            
            // Cache the new posts
            for (const thread of json.items) {
              try {
                await offlineManager.createForumPost({
                  userId: thread.author?.id || 'unknown',
                  courseId: thread.course?.id || selectedCategory !== "all" ? selectedCategory : undefined,
                  title: thread.title,
                  content: thread.body || thread.content || '',
                  createdAt: new Date(thread.createdAt)
                })
              } catch (cacheError) {
                // Ignore cache errors for individual posts
                console.warn('Failed to cache forum post:', cacheError)
              }
            }
          }
        } catch (fetchError) {
          console.log('Failed to fetch fresh threads, falling back to cached data')
          // Fall back to cached data if online fetch fails
          const cachedPosts = await offlineManager.getCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
          
          if (cachedPosts.length > 0) {
            // Convert cached posts to thread format
            const cachedThreads = cachedPosts.map(post => ({
              id: post.id,
              title: post.title,
              body: post.content,
              createdAt: post.createdAt.toISOString(),
              author: { name: 'Cached User' }, // Simplified for cached posts
              course: selectedCategory !== "all" ? { title: 'Course' } : null,
              _count: { replies: post.replies?.length || 0 },
              synced: post.synced
            }))
            
            setThreadsData({
              items: cachedThreads,
              page: 1,
              pages: 1,
              total: cachedThreads.length
            })
          } else {
            throw fetchError
          }
        }
      } else {
        // Offline mode - load cached data only
        const cachedPosts = await offlineManager.getCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
        
        if (cachedPosts.length > 0) {
          // Convert cached posts to thread format
          const cachedThreads = cachedPosts.map(post => ({
            id: post.id,
            title: post.title,
            body: post.content,
            createdAt: post.createdAt.toISOString(),
            author: { name: 'Cached User' }, // Simplified for cached posts
            course: selectedCategory !== "all" ? { title: 'Course' } : null,
            _count: { replies: post.replies?.length || 0 },
            synced: post.synced
          }))
          
          setThreadsData({
            items: cachedThreads,
            page: 1,
            pages: 1,
            total: cachedThreads.length
          })
        } else {
          // No cached data available
          setThreadsData({
            items: [],
            page: 1,
            pages: 1,
            total: 0
          })
        }
      }
    } catch (error) {
      console.error("Error fetching threads:", error)
      setThreadsData(null)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, isOnline])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses/public", { cache: "no-store" })
      if (res.ok) {
        const coursesData = await res.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }, [])

  // Base API types
  interface Author {
    name?: string | null;
    image?: string | null;
  }

  interface Thread {
    id: string;
    title: string;
    body: string;
    author?: Author | null;
    courseId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    _count?: {
      replies: number;
    };
  }



  interface Course {
    id: string;
    title: string;
    description: string;
    _count?: {
      lessons: number;
      enrollments: number;
    };
  }

  // UI specific types
  interface UIThread {
    id: string;
    title: string;
    excerpt: string;
    author: string;
    avatar: string;
    categoryName: string;
    category: string;
    replies: number;
    timeAgo: string;
    lastActive: string;
    synced: boolean;
  }

  const openThread = useCallback((id: string) => {
    router.push(`/community-forum/thread/${id}`)
  }, [router])

  const navigateToCreateThread = useCallback(() => {
    router.push("/community-forum/create-thread")
  }, [router])

  useEffect(() => {
    refreshList()
    fetchCourses()
  }, [refreshList, fetchCourses])

  // Auto-search when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshList()
    }, 500) // Debounce search by 500ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, refreshList])

  const uiThreads = useMemo<UIThread[]>(() => {
    const threadsFromApi = threadsData?.items ?? []
    return threadsFromApi.map((t) => {
      const updatedAt = t.updatedAt || t.createdAt;
      const lastActive = updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Recently';
      const timeAgo = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recently';

      // Find course name if courseId exists
      const course = courses.find(c => c.id === t.courseId)
      const categoryName = course ? course.title : (t.courseId ? 'Course' : 'General Discussion')

      return {
        id: t.id,
        title: t.title,
        excerpt: (t.body || '').slice(0, 140) + ((t.body?.length || 0) > 140 ? '…' : ''),
        author: t.author?.name || 'Anonymous',
        avatar: t.author?.image || '/placeholder.svg',
        categoryName,
        category: t.courseId ? 'course' : 'general',
        replies: t._count?.replies || 0,
        timeAgo,
        lastActive,
        synced: (t as any).synced !== false, // Assume synced unless explicitly marked as false
      };
    });
  }, [threadsData, courses]);

  const categories = useMemo(() => {
    const threadCount = threadsData?.total || 0
    const courseCategories = courses.map(course => ({
      id: course.id,
      name: course.title,
      count: threadsData?.items.filter(t => t.courseId === course.id).length || 0
    }))

    const allCategories = [
      { id: "all", name: "All Topics", count: threadCount },
      { id: "general", name: "General Discussion", count: threadsData?.items.filter(t => !t.courseId).length || 0 },
      ...courseCategories.filter(c => c.count > 0)
    ]

    // Filter categories based on search
    if (categorySearch.trim()) {
      return allCategories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    }

    return allCategories
  }, [courses, threadsData, categorySearch])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">Community Forum</h1>
                <Badge variant={isOnline ? "secondary" : "outline"}>
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Connect with learners and experts worldwide
                {!isOnline && " (Viewing cached posts)"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* New Thread Button */}
            <Button
              onClick={navigateToCreateThread}
              disabled={loading}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Plus className="w-4 h-4" />
              New Thread
              {!isOnline && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Offline
                </Badge>
              )}
            </Button>

            {/* Thread Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Categories */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Categories</h3>

              {/* Category Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                {categories.length === 0 && categorySearch.trim() ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No categories found
                  </p>
                ) : (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedCategory === cat.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{cat.count}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {uiThreads.slice(0, 3).map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread.id)}
                    className="text-left hover:text-primary transition-colors group w-full"
                  >
                    <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                      {thread.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{thread.replies} replies • {thread.timeAgo}</p>
                  </button>
                ))}
                {uiThreads.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading && !threadsData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading threads...</p>
                </div>
              </div>
            ) : uiThreads.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No threads found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                </p>
                <Button onClick={navigateToCreateThread} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Thread
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {uiThreads.map((thread, index) => (
                  <Card
                    key={`${thread.id}-${index}`}
                    onClick={() => openThread(thread.id)}
                    className="p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openThread(thread.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Image
                        src={thread.avatar}
                        alt={thread.author}
                        className="w-10 h-10 rounded-full"
                        width={40}
                        height={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                            {thread.categoryName}
                          </span>
                          <span className="text-xs text-muted-foreground">by {thread.author}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{thread.timeAgo}</span>
                          {!thread.synced && (
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              <Clock className="h-2 w-2 mr-1" />
                              Pending sync
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2">
                          {thread.title}
                        </h2>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {thread.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {thread.replies} replies
                          </span>
                          <span>Last active: {thread.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}