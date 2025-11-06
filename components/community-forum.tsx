"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Search, Plus, TrendingUp } from "lucide-react"

interface CommunityForumProps {
  onNavigate: (page: string) => void
}

export function CommunityForum({ onNavigate }: CommunityForumProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedThread, setSelectedThread] = useState<number | null>(null)

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
                <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10">
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
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Categories */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-4 text-sm">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
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
                    {trending.map((item, idx) => (
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
                  {threads.map((thread) => (
                    <Card
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className="p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
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
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2">
                            {thread.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{thread.excerpt}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <img
                                src={thread.avatar || "/placeholder.svg"}
                                alt={thread.author}
                                className="w-5 h-5 rounded-full"
                              />
                              <span>{thread.author}</span>
                            </div>
                            <span>{thread.timeAgo}</span>
                          </div>
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

            {threads.find((t) => t.id === selectedThread) && (
              <>
                <div className="mb-8">
                  <span className="text-sm text-muted-foreground mb-2 inline-block">
                    {threads.find((t) => t.id === selectedThread)?.categoryName}
                  </span>
                  <h1 className="text-3xl font-bold text-foreground">
                    {threads.find((t) => t.id === selectedThread)?.title}
                  </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    {/* Original Post */}
                    <Card className="p-6 mb-6">
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={threads.find((t) => t.id === selectedThread)?.avatar || "/placeholder.svg"}
                          alt="User"
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {threads.find((t) => t.id === selectedThread)?.author}
                            </h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Original Poster
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {threads.find((t) => t.id === selectedThread)?.timeAgo}
                          </p>
                        </div>
                      </div>
                      <p className="text-foreground leading-relaxed mb-4">
                        {threads.find((t) => t.id === selectedThread)?.fullContent}
                      </p>
                      <div className="flex gap-4 pt-4 border-t border-border">
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                          <Heart className="w-4 h-4" />
                          <span>12</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
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
                      {replies.map((reply, idx) => (
                        <Card key={idx} className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <img
                              src={reply.avatar || "/placeholder.svg"}
                              alt={reply.author}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground text-sm">{reply.author}</h4>
                                {reply.helpful && (
                                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                                    ✓ Helpful
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{reply.timeAgo}</p>
                            </div>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed">{reply.content}</p>
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
                          <span className="font-semibold text-foreground">
                            {threads.find((t) => t.id === selectedThread)?.views}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Replies</span>
                          <span className="font-semibold text-foreground">
                            {threads.find((t) => t.id === selectedThread)?.replies}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Votes</span>
                          <span className="font-semibold text-foreground">
                            {threads.find((t) => t.id === selectedThread)?.votes}
                          </span>
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
