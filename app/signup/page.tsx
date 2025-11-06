"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errorMessage = data?.error || `Registration failed (${res.status})`
        setError(errorMessage)
        setLoading(false)
        return
      }
      // Automatically sign in after successful registration
      const login = await signIn("credentials", { 
        redirect: false, 
        email, 
        password, 
        callbackUrl: "/onboarding" 
      })
      
      if (login?.ok) {
        window.location.href = login.url || "/onboarding"
      } else {
        // Registration succeeded but login failed - redirect to login page
        setError("Account created successfully! Please sign in.")
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      }
    } catch (_) {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold text-center">Create your account</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="w-full border rounded-md p-2 bg-background"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border rounded-md p-2 bg-background"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border rounded-md p-2 bg-background"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account? <a className="underline" href="/login">Sign in</a>
        </p>
      </form>
    </div>
  )
}
