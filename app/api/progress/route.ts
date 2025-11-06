import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const PROGRESS_LIST = (userId: string, courseId: string) => `progress:${userId}:${courseId}:v1`

const upsertSchema = z.object({
  lessonId: z.string(),
  percent: z.number().min(0).max(100),
  completedAt: z.string().datetime().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 })

  const key = PROGRESS_LIST(session.user.id, courseId)
  const cached = await redis.get(key)
  if (cached) return NextResponse.json(cached)

  const lessons = await prisma.lesson.findMany({ where: { courseId }, select: { id: true, order: true } })
  const progresses = await prisma.progress.findMany({
    where: { userId: session.user.id, lessonId: { in: lessons.map((l: { id: string; order: number }) => l.id) } },
  })
  const byLesson = new Map<string, typeof progresses[number]>(
    progresses.map((p: typeof progresses[number]) => [p.lessonId, p])
  )
  const ordered = lessons
    .sort((a: { id: string; order: number }, b: { id: string; order: number }) => a.order - b.order)
    .map((l: { id: string; order: number }) => ({ lessonId: l.id, order: l.order, progress: byLesson.get(l.id) ?? null }))

  await redis.set(key, ordered, { ex: 60 })
  return NextResponse.json(ordered)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = upsertSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const { lessonId, percent, completedAt } = parsed.data
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true } })
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

  const progress = await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { percent, completedAt: completedAt ? new Date(completedAt) : null },
    create: { userId: session.user.id, lessonId, percent, completedAt: completedAt ? new Date(completedAt) : null },
  })

  await redis.del(PROGRESS_LIST(session.user.id, lesson.courseId))
  return NextResponse.json(progress)
}
