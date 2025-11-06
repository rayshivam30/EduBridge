"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Users, BookOpen, Zap, Globe, Award } from "lucide-react"

interface LandingPageProps {
  onNavigate: (page: string) => void
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">EduBridge</h1>
            </div>
            <nav className="hidden md:flex gap-8">
              <button
                onClick={() => onNavigate("student-dashboard")}
                className="text-foreground hover:text-primary transition-colors"
              >
                For Students
              </button>
              <button
                onClick={() => onNavigate("teacher-dashboard")}
                className="text-foreground hover:text-primary transition-colors"
              >
                For Teachers
              </button>
              <button
                onClick={() => onNavigate("community-forum")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Community
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
              Learn Anywhere. Anytime. Together.
            </h2>
            <p className="text-xl text-muted-foreground text-balance">
              Connecting rural and urban students with equal access to quality learning resources, expert tutors, and a
              vibrant community.
            </p>
            <div className="flex gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => onNavigate("student-dashboard")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate("community-forum")}>
                Learn More
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-20 h-20 text-primary mx-auto mb-4" />
              <p className="text-foreground font-semibold">Global Learning Platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/5 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose EduBridge?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-gradient-to-r from-primary to-secondary/50 text-primary-foreground p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Learning Journey?</h3>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of students and educators already using EduBridge to connect, learn, and grow together.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => onNavigate("student-dashboard")}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Start Learning Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("teacher-dashboard")}
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              Become a Teacher
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">EduBridge</h4>
              <p className="text-muted-foreground text-sm">Connecting learners globally</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => onNavigate("student-dashboard")} className="hover:text-primary">
                    Students
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate("teacher-dashboard")} className="hover:text-primary">
                    Teachers
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => onNavigate("community-forum")} className="hover:text-primary">
                    Forum
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">© 2025 EduBridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Users,
    title: "Connect Globally",
    description: "Learn from peers and teachers around the world in a supportive community.",
  },
  {
    icon: BookOpen,
    title: "Rich Content Library",
    description: "Access thousands of courses, tutorials, and learning materials.",
  },
  {
    icon: Zap,
    title: "AI-Powered Tutoring",
    description: "Get personalized help from our AI tutor available 24/7.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Complete courses and earn recognized credentials.",
  },
  {
    icon: Globe,
    title: "Equal Access",
    description: "Quality education for rural and urban students alike.",
  },
]
