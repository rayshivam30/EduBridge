"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Search, Plus, TrendingUp } from "lucide-react"

interface CommunityForumProps {
  onNavigate: (page: string) => void
}

export function CommunityForum({ onNavigate }: CommunityForumProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [threadsData, setThreadsData] = useState<{ items: Thread[]; page: number; pages: number } | null>(null)
  const [threadDetail, setThreadDetail] = useState<Thread | null>(null)
  const [repliesData, setRepliesData] = useState<{ items: ThreadReply[]; page: number; pages: number } | null>(null)

  const refreshList = useCallback(async () => {
    setLoading(true)
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
    } catch (error) {
      console.error("Error fetching threads:", error)
      setThreadsData(null)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory])

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

  interface ThreadReply {
    id: string;
    body: string;
    author?: Author | null;
    createdAt?: string;
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
    solved: boolean;
    votes: number;
    replies: number;
    views: number;
    timeAgo: string;
    lastActive: string;
  }

  interface Reply {
    id: string;
    body: string;
    author?: {
      name?: string;
      image?: string;
    };
    createdAt?: string;
  }

  const openThread = useCallback(async (id: string) => {
    setSelectedThread(id)
    setLoading(true)
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`/api/forum/threads/${id}`, { cache: "no-store" }),
        fetch(`/api/forum/threads/${id}/replies?page=1`, { cache: "no-store" }),
      ])
      
      if (!tRes.ok || !rRes.ok) {
        throw new Error(`Failed to fetch thread data: ${tRes.status} ${rRes.status}`)
      }
      
      const thread = await tRes.json() as Thread
      const replies = await rRes.json() as { items: ThreadReply[] }
      
      setThreadDetail(thread)
      setRepliesData({
        items: replies.items || [],
        page: 1,
        pages: Math.ceil((replies.items?.length || 0) / 10) || 1
      })
    } catch (error) {
      console.error("Error opening thread:", error)
      alert("Failed to load thread. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const createNewThread = useCallback(async () => {
    const title = window.prompt("Thread title")
    if (!title) return
    const body = window.prompt("Describe your question or topic") || ""
    setLoading(true)
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          body, 
          courseId: selectedCategory === "all" ? undefined : selectedCategory 
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || `Failed to create thread: ${res.status}`)
      }
      
      const newThread = await res.json()
      await refreshList()
      
      // Navigate to the new thread
      if (newThread?.id) {
        setSelectedThread(newThread.id)
      }
    } catch (error) {
      console.error("Error creating thread:", error)
      alert(error instanceof Error ? error.message : "Failed to create thread. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [refreshList, selectedCategory])

  const postReply = useCallback(async (threadId: string) => {
    const body = window.prompt("Your reply")
    if (!body) return
    
    setLoading(true)
    try {
      const postRes = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      
      if (!postRes.ok) {
        const error = await postRes.json()
        throw new Error(error.message || `Failed to post reply: ${postRes.status}`)
      }
      
      // Refresh the replies after posting
      const rRes = await fetch(`/api/forum/threads/${threadId}/replies?page=1`, { cache: "no-store" })
      if (!rRes.ok) {
        throw new Error(`Failed to refresh replies: ${rRes.status}`)
      }
      
      const replies = await rRes.json()
      setRepliesData(replies)
      
      // Show success message
      alert("Reply posted successfully!")
    } catch (error) {
      console.error("Error posting reply:", error)
      alert(error instanceof Error ? error.message : "Failed to post reply. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  const uiThreads = useMemo<UIThread[]>(() => {
    const threadsFromApi = threadsData?.items ?? []
    return threadsFromApi.map((t) => {
      const updatedAt = t.updatedAt || t.createdAt;
      const lastActive = updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Recently';
      const timeAgo = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recently';
      
      return {
        id: t.id,
        title: t.title,
        excerpt: (t.body || '').slice(0, 140) + ((t.body?.length || 0) > 140 ? '…' : ''),
        author: t.author?.name || 'Anonymous',
        avatar: t.author?.image || '/placeholder.svg',
        categoryName: t.courseId ? 'Course' : 'General',
        category: t.courseId ? 'course' : 'general',
        solved: false,
        votes: 0,
        replies: t._count?.replies || 0,
        views: 0,
        timeAgo,
        lastActive,
      };
    });
  }, [threadsData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedThread ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Community Forum</h1>
              <p className="text-muted-foreground">Connect with learners and experts worldwide</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="space-y-4">
                {/* New Thread Button */}
                <Button onClick={createNewThread} disabled={loading} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10">
                  <Plus className="w-4 h-4" />
                  New Thread
                </Button>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") refreshList()
                    }}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Categories */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4 text-sm">Categories</h3>
                  <div className="space-y-2">
                    {[
                      { id: "all", name: "All Topics", count: 1243 },
                      { id: "web-dev", name: "Web Development", count: 456 },
                      { id: "data-science", name: "Data Science", count: 234 },
                      { id: "general", name: "General Discussion", count: 553 },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedCategory === cat.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cat.name}</span>
                          <span className="text-xs text-muted-foreground">{cat.count}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Trending */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <h3 className="font-semibold text-foreground text-sm">Trending</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Best React Hooks patterns", heat: "🔥🔥🔥" },
                      { title: "Python async/await explained", heat: "🔥🔥" },
                      { title: "CSS Grid vs Flexbox", heat: "🔥🔥🔥" },
                    ].map((item, idx) => (
                      <button key={idx} className="text-left hover:text-primary transition-colors group">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.heat} hot</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Threads List */}
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
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Vote/Stats Column */}
                        <div className="md:col-span-1 flex md:flex-col gap-2 md:gap-0 md:items-center md:justify-start">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{thread.votes}</p>
                            <p className="text-xs text-muted-foreground">votes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{thread.replies}</p>
                            <p className="text-xs text-muted-foreground">replies</p>
                          </div>
                        </div>

                        {/* Thread Content */}
                        <div className="md:col-span-7">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                thread.category === "web-dev"
                                  ? "bg-primary/10 text-primary"
                                  : thread.category === "data-science"
                                    ? "bg-secondary/10 text-secondary"
                                    : "bg-accent/10 text-accent"
                              }`}
                            >
                              {thread.categoryName}
                            </span>
                            {thread.solved && (
                              <span className="text-xs font-medium px-2 py-1 bg-secondary/10 text-secondary rounded">
                                ✓ Solved
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2">
                            {thread.title}
                          </h2>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2" aria-label="Thread excerpt">
                            {thread.excerpt}
                          </p>
                        </div>

                        {/* Views */}
                        <div className="md:col-span-4 flex md:flex-col md:items-end md:justify-start gap-4 md:gap-0">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{thread.views}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Last active</p>
                            <p className="text-xs font-medium text-foreground">{thread.lastActive}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Thread View */}
            <button
              onClick={() => setSelectedThread(null)}
              className="text-primary hover:text-primary/80 mb-6 flex items-center gap-1"
            >
              ← Back to Forum
            </button>

            {threadDetail && (
              <>
                <div className="mb-8">
                  <span className="text-sm text-muted-foreground mb-2 inline-block">
                    {threadDetail.courseId ? "Course" : "General"}
                  </span>
                  <h1 className="text-3xl font-bold text-foreground">
                    {threadDetail.title}
                  </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    {/* Original Post */}
                    <Card className="p-6 mb-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Image
                          src={threadDetail.author?.image || "/placeholder.svg"}
                          alt="User"
                          className="w-12 h-12 rounded-full"
                          width={48}
                          height={48}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {threadDetail.author?.name ?? "Anonymous"}
                            </h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Original Poster
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(threadDetail.createdAt ?? Date.now()).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-foreground leading-relaxed mb-4">{threadDetail.body}</p>
                      <div className="flex gap-4 pt-4 border-t border-border">
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                          <Heart className="w-4 h-4" />
                          <span>12</span>
                        </button>
                        <button
                          onClick={() => selectedThread && postReply(selectedThread)}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </Card>

                    {/* Replies */}
                    <div className="space-y-4">
                      {(repliesData?.items ?? []).map((reply: any, idx: number) => (
                        <Card key={reply.id ?? idx} className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Image
                              src={reply.author?.image || "/placeholder.svg"}
                              alt={reply.author?.name ?? "User"}
                              className="w-10 h-10 rounded-full"
                              width={40}
                              height={40}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground text-sm">{reply.author?.name ?? "User"}</h4>
                                {false && (
                                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                                    ✓ Helpful
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{new Date(reply.createdAt ?? Date.now()).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed">{reply.body}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <Card className="p-6">
                      <h3 className="font-semibold text-foreground mb-4">Thread Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Views</span>
                          <span className="font-semibold text-foreground">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Replies</span>
                          <span className="font-semibold text-foreground">{threadDetail?._count?.replies ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Votes</span>
                          <span className="font-semibold text-foreground">0</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-foreground mb-4">Related Topics</h3>
                      <div className="space-y-2">
                        {["Best practices for React", "How to optimize performance", "State management patterns"].map(
                          (topic, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left text-sm text-primary hover:text-primary/80 py-1"
                            >
                              → {topic}
                            </button>
                          ),
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const categories = [
  { id: "all", name: "All Topics", count: 1243 },
  { id: "web-dev", name: "Web Development", count: 456 },
  { id: "data-science", name: "Data Science", count: 234 },
  { id: "general", name: "General Discussion", count: 553 },
]

const trending = [
  { title: "Best React Hooks patterns", heat: "🔥🔥🔥" },
  { title: "Python async/await explained", heat: "🔥🔥" },
  { title: "CSS Grid vs Flexbox", heat: "🔥🔥🔥" },
]

const threads = [
  {
    id: 1,
    title: "How to implement lazy loading in React?",
    excerpt:
      "I'm trying to implement lazy loading for images in my React application but I'm not sure about the best approach...",
    fullContent:
      "I'm trying to implement lazy loading for images in my React application but I'm not sure about the best approach. Should I use a library like react-lazy-load-image-component or implement it manually using Intersection Observer API? Looking for best practices and performance considerations.",
    author: "Alex Johnson",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2300B4D8' width='100' height='100'/%3E%3Ctext x='50' y='50' fontSize='50' fill='white' textAnchor='middle' dy='.3em'%3EAJ%3C/text%3E%3C/svg%3E",
    categoryName: "Web Development",
    category: "web-dev",
    solved: false,
    votes: 24,
    replies: 8,
    views: 234,
    timeAgo: "2 hours ago",
    lastActive: "1 hour ago",
  },
  {
    id: 2,
    title: "Best practices for data visualization with Python",
    excerpt: "I want to improve my data visualization skills. What are the best libraries and practices to follow?...",
    fullContent:
      "I want to improve my data visualization skills. What are the best libraries and practices to follow for creating professional data visualizations?",
    author: "Sarah Chen",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2338B000' width='100' height='100'/%3E%3Ctext x='50' y='50' fontSize='50' fill='white' textAnchor='middle' dy='.3em'%3ESC%3C/text%3E%3C/svg%3E",
    categoryName: "Data Science",
    category: "data-science",
    solved: true,
    votes: 18,
    replies: 5,
    views: 156,
    timeAgo: "5 hours ago",
    lastActive: "2 hours ago",
  },
  {
    id: 3,
    title: "CSS Grid layout tips and tricks",
    excerpt: "Share your favorite CSS Grid techniques and how they've improved your workflow...",
    fullContent: "Share your favorite CSS Grid techniques and how they've improved your workflow.",
    author: "Mike Davis",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23FF6B6B' width='100' height='100'/%3E%3Ctext x='50' y='50' fontSize='50' fill='white' textAnchor='middle' dy='.3em'%3EMD%3C/text%3E%3C/svg%3E",
    categoryName: "Web Development",
    category: "web-dev",
    solved: false,
    votes: 42,
    replies: 12,
    views: 489,
    timeAgo: "1 day ago",
    lastActive: "3 hours ago",
  },
]

const replies = [
  {
    author: "Emma Wilson",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23FFB700' width='100' height='100'/%3E%3Ctext x='50' y='50' fontSize='50' fill='white' textAnchor='middle' dy='.3em'%3EEW%3C/text%3E%3C/svg%3E",
    content:
      "I'd recommend using the Intersection Observer API for better control and performance. It's now well-supported across modern browsers. You can wrap it in a custom hook for reusability!",
    timeAgo: "1 hour ago",
    helpful: true,
  },
  {
    author: "Prof. Kumar",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%236C5CE7' width='100' height='100'/%3E%3Ctext x='50' y='50' fontSize='50' fill='white' textAnchor='middle' dy='.3em'%3EPK%3C/text%3E%3C/svg%3E",
    content:
      "Great question! Both approaches work, but Intersection Observer is definitely the modern way. Libraries like react-lazy-load-image-component are good if you want something out-of-the-box, but understanding the underlying API is valuable.",
    timeAgo: "45 minutes ago",
    helpful: true,
  },
]
