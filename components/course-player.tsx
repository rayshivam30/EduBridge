"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  MessageSquare,
  Download,
  ChevronDown,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react"

interface CoursePlayerProps {
  onNavigate: (page: string) => void
}

export function CoursePlayer({ onNavigate }: CoursePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(0)
  const [expandedModule, setExpandedModule] = useState(0)

  const course = lessons[currentLesson]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Player Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative group">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center transition-colors group-hover:scale-110 duration-200"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-primary-foreground ml-1" />
                  ) : (
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  )}
                </button>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-full bg-muted/30 h-1 rounded-full mb-3">
                    <div className="bg-primary h-1 rounded-full w-1/3" />
                  </div>
                  <div className="flex items-center justify-between text-white text-xs">
                    <div>5:32 / 15:00</div>
                    <div className="flex gap-2">
                      <button className="hover:text-primary">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button className="hover:text-primary">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Info */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Module {course.module} • Lesson {currentLesson + 1}
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">{course.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button size="sm" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <MessageSquare className="w-4 h-4" />
                    Notes
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground">{course.description}</p>

              {/* Learning Objectives */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">Learning Objectives</h4>
                <ul className="space-y-2">
                  {course.objectives.map((obj, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Course Resources */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <div className="space-y-2">
                {course.resources.map((resource, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="flex-1 font-medium text-foreground text-sm">{resource}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-6">
            {/* Course Overview */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Web Development Masterclass</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Course Progress</span>
                    <span className="font-medium text-foreground">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-2/3" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Est. 45 hrs remaining</span>
                </div>
              </div>
            </Card>

            {/* Lessons List */}
            <div className="space-y-3">
              {courseModules.map((module, modIdx) => (
                <div key={modIdx} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedModule(expandedModule === modIdx ? -1 : modIdx)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-sm">{module.title}</p>
                      <p className="text-xs text-muted-foreground">{module.lessons.length} lessons</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedModule === modIdx ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedModule === modIdx && (
                    <div className="border-t border-border">
                      {module.lessons.map((lesson, lesIdx) => (
                        <button
                          key={lesIdx}
                          onClick={() => setCurrentLesson(modIdx * 4 + lesIdx)}
                          className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-b-0 transition-colors ${
                            currentLesson === modIdx * 4 + lesIdx
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {lesson.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-muted rounded-full flex-shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Continue Learning
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => onNavigate("ai-tutor")}>
                Ask AI Tutor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const lessons = [
  {
    module: 1,
    title: "Introduction to HTML",
    description: "Learn the fundamentals of HTML, the markup language that forms the foundation of every web page.",
    duration: "15:00",
    objectives: [
      "Understand the structure of HTML documents",
      "Learn about HTML tags and attributes",
      "Create your first HTML page",
      "Understand semantic HTML",
    ],
    resources: ["HTML Cheat Sheet.pdf", "Starter Code.zip", "MDN HTML Reference"],
  },
  {
    module: 1,
    title: "CSS Basics and Styling",
    description: "Master the basics of CSS to style your HTML elements beautifully.",
    duration: "18:30",
    objectives: [
      "Understand CSS selectors",
      "Learn about the box model",
      "Master flexbox and grid",
      "Create responsive layouts",
    ],
    resources: ["CSS Cheat Sheet.pdf", "Layout Examples.zip", "CSS Tricks Guide"],
  },
  {
    module: 2,
    title: "JavaScript Fundamentals",
    description: "Learn JavaScript to make your web pages interactive and dynamic.",
    duration: "22:15",
    objectives: ["Variables and data types", "Control flow and loops", "Functions and scope", "DOM manipulation"],
    resources: ["JavaScript Handbook.pdf", "Code Examples.zip"],
  },
  {
    module: 2,
    title: "Working with APIs",
    description: "Learn how to fetch and work with data from APIs.",
    duration: "20:00",
    objectives: ["Understanding REST APIs", "Fetch API basics", "Handling JSON data", "Error handling"],
    resources: ["API Guide.pdf", "Sample API Project.zip"],
  },
]

const courseModules = [
  {
    title: "Module 1: Web Fundamentals",
    lessons: [
      { title: "Introduction to HTML", completed: true },
      { title: "CSS Basics and Styling", completed: true },
      { title: "Responsive Design", completed: false },
      { title: "Web Accessibility", completed: false },
    ],
  },
  {
    title: "Module 2: JavaScript & Interactivity",
    lessons: [
      { title: "JavaScript Fundamentals", completed: false },
      { title: "DOM Manipulation", completed: false },
      { title: "Working with APIs", completed: false },
      { title: "Async Programming", completed: false },
    ],
  },
  {
    title: "Module 3: Frontend Frameworks",
    lessons: [
      { title: "React Basics", completed: false },
      { title: "Components & Props", completed: false },
      { title: "State Management", completed: false },
      { title: "Advanced React", completed: false },
    ],
  },
]
