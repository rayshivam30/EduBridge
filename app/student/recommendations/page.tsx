import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { RecommendationClient } from "./RecommendationClient"

export default async function RecommendationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher-dashboard")
  if (role !== "STUDENT") redirect("/onboarding")

  return <RecommendationClient />
}