"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Mic, 
  MicOff, 
  Send, 
  BookOpen, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  ArrowLeft,
  Volume2,
  VolumeX
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface RevisionFeedback {
  overallScore: number
  correctConcepts: string[]
  missingConcepts: string[]
  incorrectConcepts: string[]
  suggestions: string[]
  encouragement: string
}

export function RevisionInterface() {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState("")
  const [explanation, setExplanation] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<RevisionFeedback | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [microphoneSupported, setMicrophoneSupported] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    loadEnrolledCourses()
    checkMicrophoneSupport()
  }, [])

  const checkMicrophoneSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophoneSupported(false)
    }
  }

  const loadEnrolledCourses = async () => {
    try {
      const response = await fetch("/api/enrollments")
      if (response.ok) {
        const data = await response.json()
        setEnrolledCourses(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const startRecording = async () => {
    try {
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Your browser doesn&apos;t support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.")
        return
      }

      // Check microphone permission first
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (permission.state === 'denied') {
          toast.error("Microphone access denied. Please enable microphone permissions in your browser settings and refresh the page.")
          return
        }
      } catch (permError) {
        // Permission API not supported in all browsers, continue with getUserMedia
        console.log("Permission API not supported, proceeding with getUserMedia")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        // Check if we have audio data
        if (audioBlob.size === 0) {
          toast.error("No audio recorded. Please try again.")
          return
        }
        
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        toast.error("Recording error occurred. Please try again.")
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      toast.success("🎤 Recording started! Speak clearly about your topic.")
      
    } catch (error: any) {
      console.error("Error starting recording:", error)
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please click the microphone icon in your browser's address bar and allow access, then try again.")
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone and try again.")
      } else if (error.name === 'NotReadableError') {
        toast.error("Microphone is being used by another application. Please close other apps using the microphone and try again.")
      } else if (error.name === 'OverconstrainedError') {
        toast.error("Microphone doesn&apos;t meet the required specifications. Please try with a different microphone.")
      } else {
        toast.error("Could not access microphone. Please check your browser settings and try again.")
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        toast.info("🔄 Processing your recording...")
      } catch (error) {
        console.error("Error stopping recording:", error)
        setIsRecording(false)
        toast.error("Error stopping recording. Please try again.")
      }
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      
      const response = await fetch("/api/revision/transcribe", {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setExplanation(data.transcript)
        toast.success("Audio transcribed successfully!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to transcribe audio")
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      toast.error("Error processing audio. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitRevision = async () => {
    if (!selectedTopic || !explanation.trim()) {
      toast.error("Please select a topic and provide your explanation")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/revision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          explanation: explanation.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback)
        toast.success("AI analysis complete!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to analyze your explanation")
      }
    } catch (error) {
      console.error("Error submitting revision:", error)
      toast.error("Error analyzing explanation")
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error("Text-to-speech not supported in your browser")
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const resetRevision = () => {
    setSelectedTopic("")
    setExplanation("")
    setFeedback(null)
    setIsRecording(false)
    if (isSpeaking) stopSpeaking()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/student")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Revision Session</h1>
              <p className="text-muted-foreground">Explain what you learned and get AI feedback</p>
            </div>
          </div>
        </div>

        {!feedback ? (
          <div className="space-y-6">
            {/* Topic Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Select a Topic to Revise
              </h3>
              <div className="grid gap-3">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTopic === enrollment.course?.title
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTopic(enrollment.course?.title || "")}
                    >
                      <h4 className="font-medium">{enrollment.course?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {enrollment.course?.createdBy?.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No enrolled courses found. Enroll in a course first!</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/courses")}
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Explanation Input */}
            {selectedTopic && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Explain What You Learned
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tell us about &ldquo;{selectedTopic}&rdquo; - what are the key concepts, how does it work, 
                  and what did you find most interesting?
                </p>
                
                {!microphoneSupported && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded">
                        <Mic className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                          Voice Recording Not Available
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                          Your browser doesn&apos;t support voice recording. You can still type your explanation below.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          For voice recording, try using Chrome, Firefox, or Safari.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder={isRecording ? "🎤 Recording... Speak clearly about your topic" : "Start typing your explanation here, or use the microphone to record..."}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className={`min-h-[200px] resize-none ${isRecording ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                      disabled={isRecording}
                    />
                    {isRecording && (
                      <div className="absolute top-3 right-3 flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Recording</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!microphoneSupported || isLoading}
                      className="gap-2"
                      title={!microphoneSupported ? "Microphone not supported in this browser" : ""}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          {microphoneSupported ? "Record Audio" : "Microphone Not Available"}
                        </>
                      )}
                    </Button>
                    
                    {!microphoneSupported && (
                      <p className="text-sm text-muted-foreground">
                        Voice recording requires a modern browser. You can still type your explanation.
                      </p>
                    )}
                    
                    <Button
                      onClick={submitRevision}
                      disabled={!explanation.trim() || isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Get Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Feedback Display */
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Your Understanding Score
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isSpeaking ? stopSpeaking : () => speakText(feedback.encouragement)}
                    className="gap-2"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isSpeaking ? "Stop" : "Listen"}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Progress value={feedback.overallScore} className="h-3" />
                </div>
                <span className="text-2xl font-bold text-primary">
                  {feedback.overallScore}%
                </span>
              </div>
              
              <p className="text-muted-foreground">{feedback.encouragement}</p>
            </Card>

            {/* Detailed Feedback */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Correct Concepts */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  What You Got Right ({feedback.correctConcepts.length})
                </h4>
                <div className="space-y-2">
                  {feedback.correctConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Missing Concepts */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
                  <Lightbulb className="w-5 h-5" />
                  Areas to Explore More ({feedback.missingConcepts.length})
                </h4>
                <div className="space-y-2">
                  {feedback.missingConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Incorrect Concepts */}
            {feedback.incorrectConcepts.length > 0 && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  Concepts to Review ({feedback.incorrectConcepts.length})
                </h4>
                <div className="space-y-2">
                  {feedback.incorrectConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggestions */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Suggestions for Improvement
              </h4>
              <ul className="space-y-2">
                {feedback.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={resetRevision} variant="outline" className="gap-2">
                <Brain className="w-4 h-4" />
                Try Another Topic
              </Button>
              <Button onClick={() => router.push("/student")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}