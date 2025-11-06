"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleProvider(provider: string) {
    try {
      setLoading(provider)
      await signIn(provider, { callbackUrl: "/onboarding" })
    } finally {
      setLoading(null)
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading("credentials")
    const res = await signIn("credentials", { redirect: false, email, password, callbackUrl: "/onboarding" })
    setLoading(null)
    if (res?.ok) window.location.href = res.url || "/onboarding"
    else setError("Invalid email or password")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in to EduBridge</h1>

        <form onSubmit={handleCredentials} className="space-y-3">
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
          <Button className="w-full" type="submit" disabled={loading!==null}>
            {loading === "credentials" ? "Signing in..." : "Sign in with Email"}
          </Button>
        </form>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <Button className="w-full" variant="default" onClick={() => handleProvider("github")} disabled={loading!==null}>
            {loading === "github" ? "Signing in..." : "Continue with GitHub"}
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => handleProvider("google")} disabled={loading!==null}>
            {loading === "google" ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account? <a className="underline" href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  )
}
