import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { RevisionInterface } from "@/components/revision/revision-interface"

export default async function RevisionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher")
  if (role !== "STUDENT") redirect("/onboarding")
  
  return <RevisionInterface />
}