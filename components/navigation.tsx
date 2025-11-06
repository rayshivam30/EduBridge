"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Home, LogOut } from "lucide-react"

interface NavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground hidden sm:inline">EduBridge</span>
          </button>

          <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("landing")}
            aria-label="Home"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === "landing" ? "bg-primary/10 text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <Home className="w-4 h-4" />
            </button>
            <Button
              variant="ghost"
              onClick={() => onNavigate("landing")}
              aria-label="Exit to landing"
              className="text-foreground hover:text-primary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
