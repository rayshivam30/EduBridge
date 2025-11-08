"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Plus, Lightbulb, BookOpen, HelpCircle, MessageCircle, Zap, Loader2 } from "lucide-react"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AITutorProps {
  onNavigate: (page: string) => void
}

export function AITutor({ onNavigate }: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [selectedMode, setSelectedMode] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<Array<{title: string, date: string, messages: Message[]}>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize messages based on selected mode
  useEffect(() => {
    setMessages(getInitialMessages(selectedMode))
  }, [selectedMode])

  // Load recent chats from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-tutor-chats')
      if (saved) {
        try {
          setRecentChats(JSON.parse(saved))
        } catch (error) {
          console.error('Error loading saved chats:', error)
        }
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: inputValue.trim(),
        timestamp: new Date(),
      }
      
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setInputValue("")
      setIsLoading(true)

      try {
        // Prepare messages for API (convert to the format expected by the API)
        const apiMessages = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))

        const response = await fetch('/api/ai-tutor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            mode: selectedMode
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        const data = await response.json()
        
        const aiResponse: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }
        
        setMessages(prev => [...prev, aiResponse])
      } catch (error) {
        console.error('Error getting AI response:', error)
        let errorContent = "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorContent = "It looks like the AI service isn't configured properly. Please contact your administrator."
          } else if (error.message.includes('Failed to fetch')) {
            errorContent = "I'm having trouble connecting to the AI service. Please check your internet connection and try again."
          }
        }
        
        const errorMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: errorContent,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleNewChat = () => {
    // Save current chat if it has user messages
    if (messages.some(msg => msg.role === 'user')) {
      const chatTitle = messages.find(msg => msg.role === 'user')?.content.substring(0, 30) + '...' || 'New Chat'
      const newChat = {
        title: chatTitle,
        date: new Date().toLocaleDateString(),
        messages: messages
      }
      
      const updatedChats = [newChat, ...recentChats.slice(0, 4)] // Keep only 5 recent chats
      setRecentChats(updatedChats)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai-tutor-chats', JSON.stringify(updatedChats))
      }
    }
    
    setMessages(getInitialMessages(selectedMode))
    setInputValue("")
  }

  const loadChat = (chatMessages: Message[]) => {
    setMessages(chatMessages)
  }



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* New Chat */}
            <Button 
              onClick={handleNewChat}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
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
                {recentChats.length > 0 ? (
                  recentChats.map((chat, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => loadChat(chat.messages)}
                      className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">{chat.date}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No recent conversations</p>
                )}
              </div>
            </Card>


          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 p-6 flex flex-col bg-gradient-to-b from-background to-muted/20">
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
                    {(() => {
                      const currentMode = tutorModes.find((m) => m.id === selectedMode)
                      const IconComponent = currentMode?.icon || Zap
                      return <IconComponent className="w-6 h-6 text-primary" />
                    })()}
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                    placeholder={isLoading ? "AI is thinking..." : "Ask me anything..."}
                    disabled={isLoading}
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI Tutor is here to help! Ask questions about any topic from your courses.
                </p>
              </div>
            </Card>


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

function getInitialMessages(mode: string): Message[] {
  const baseMessage = {
    id: 1,
    role: "assistant" as const,
    timestamp: new Date(Date.now() - 5 * 60000),
  }

  const secondMessage = {
    id: 2,
    role: "assistant" as const,
    timestamp: new Date(Date.now() - 4 * 60000),
  }

  switch (mode) {
    case 'general':
      return [
        {
          ...baseMessage,
          content: "Hello! I'm your AI Tutor in General Q&A mode. I'm here to answer any questions you have with detailed, easy-to-understand explanations. Whether it's programming, science, math, or any other topic - just ask!"
        },
        {
          ...secondMessage,
          content: "I'll break down complex topics into simpler parts and use examples to help you understand. What would you like to learn about today?"
        }
      ]
    
    case 'concept':
      return [
        {
          ...baseMessage,
          content: "Welcome to Concept Deep Dive mode! I'm here to help you build deep understanding of any topic through comprehensive, step-by-step explanations."
        },
        {
          ...secondMessage,
          content: "I'll start with fundamentals and gradually introduce more complex aspects, using analogies and real-world examples. What concept would you like to explore in depth?"
        }
      ]
    
    case 'practice':
      return [
        {
          ...baseMessage,
          content: "Hi! I'm your AI Tutor in Practice Problems mode. I'm here to guide you through problem-solving by helping you think through the process step by step."
        },
        {
          ...secondMessage,
          content: "Instead of giving direct answers, I'll ask leading questions and provide hints to help you discover solutions yourself. What problem would you like to work on?"
        }
      ]
    
    case 'debate':
      return [
        {
          ...baseMessage,
          content: "Welcome to Debate Mode! I'm here to help you explore multiple perspectives on topics and develop critical thinking skills."
        },
        {
          ...secondMessage,
          content: "I'll present different viewpoints, challenge assumptions constructively, and help you analyze arguments. What topic would you like to discuss and explore from different angles?"
        }
      ]
    
    default:
      return [
        {
          ...baseMessage,
          content: "Hello! I'm your AI Tutor powered by advanced AI technology. I'm here to help you understand any concept, solve problems, and deepen your knowledge."
        },
        {
          ...secondMessage,
          content: "I can adapt my teaching style based on the mode you select. What would you like to learn about today?"
        }
      ]
  }
}




