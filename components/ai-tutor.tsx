"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Plus, Settings, Lightbulb, BookOpen, HelpCircle, MessageCircle, Zap } from "lucide-react"

interface AITutorProps {
  onNavigate: (page: string) => void
}

export function AITutor({ onNavigate }: AITutorProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [selectedMode, setSelectedMode] = useState("general")

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        role: "user",
        content: inputValue,
        timestamp: new Date(),
      }
      setMessages([...messages, newMessage])

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          role: "assistant",
          content:
            "That's a great question! Let me help you understand this better. " +
            inputValue.substring(0, 20) +
            "... is related to the core concepts we've been learning. Would you like me to explain it in more detail?",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
      }, 500)

      setInputValue("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* New Chat */}
            <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              New Chat
            </Button>

            {/* Tutoring Modes */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Tutoring Modes</h3>
              <div className="space-y-2">
                {tutorModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                      selectedMode === mode.id
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-foreground hover:bg-muted border border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <mode.icon className="w-4 h-4" />
                      <span className="font-medium">{mode.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Recent Chats */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Recent Conversations</h3>
              <div className="space-y-2">
                {recentChats.map((chat, idx) => (
                  <button key={idx} className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors">
                    <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">{chat.date}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Settings */}
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 p-6 flex flex-col mb-4 bg-gradient-to-b from-background to-muted/20">
              {/* Mode Info */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {tutorModes.find((m) => m.id === selectedMode)?.name || "AI Tutor"}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {tutorModes.find((m) => m.id === selectedMode)?.description}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="border-t border-border pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI Tutor is here to help! Ask questions about any topic from your courses.
                </p>
              </div>
            </Card>

            {/* Quick Tips */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickTips.map((tip, idx) => (
                <Card
                  key={idx}
                  className="p-4 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50"
                >
                  <tip.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tip.example}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const tutorModes = [
  {
    id: "general",
    name: "General Q&A",
    description: "Ask any question and get detailed explanations",
    icon: HelpCircle,
  },
  {
    id: "concept",
    name: "Concept Deep Dive",
    description: "Understand complex topics step by step",
    icon: BookOpen,
  },
  {
    id: "practice",
    name: "Practice Problems",
    description: "Solve problems with guided help",
    icon: Lightbulb,
  },
  {
    id: "debate",
    name: "Debate Mode",
    description: "Discuss multiple perspectives on topics",
    icon: MessageCircle,
  },
]

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm your AI Tutor. I'm here to help you understand any concept from your courses. Whether you have questions about web development, data science, or anything else, feel free to ask!",
    timestamp: new Date(Date.now() - 5 * 60000),
  },
  {
    id: 2,
    role: "assistant",
    content:
      "You can ask me to explain complex topics, help you solve problems, or dive deep into specific concepts. What would you like to learn about today?",
    timestamp: new Date(Date.now() - 4 * 60000),
  },
]

const recentChats = [
  { title: "Understanding React Hooks", date: "Today" },
  { title: "CSS Flexbox Explained", date: "Yesterday" },
  { title: "JavaScript Async/Await", date: "2 days ago" },
  { title: "Python List Comprehensions", date: "3 days ago" },
]

const quickTips = [
  {
    icon: HelpCircle,
    title: "Ask Questions",
    example: "How does recursion work?",
  },
  {
    icon: BookOpen,
    title: "Learn Concepts",
    example: "Explain the event loop",
  },
  {
    icon: Lightbulb,
    title: "Get Help",
    example: "How do I debug this?",
  },
  {
    icon: Zap,
    title: "Quick Tips",
    example: "Best practices for...",
  },
]
