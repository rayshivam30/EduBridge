import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const COURSE_LIST_KEY = "courses:list:v1"
const COURSE_KEY = (id: string) => `courses:${id}:v1`

const updateInput = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().nonnegative().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params
  const cached = await redis.get(COURSE_KEY(id))
  if (cached) return NextResponse.json(cached)
  const data = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" } }, createdBy: true, _count: { select: { enrollments: true } } },
  })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await redis.set(COURSE_KEY(id), data, { ex: 60 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = context.params
  const body = await request.json().catch(() => ({}))
  const parsed = updateInput.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.createdById !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const updated = await prisma.course.update({ where: { id }, data: parsed.data })
  await redis.del(COURSE_LIST_KEY)
  await redis.del(COURSE_KEY(id))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = params.id
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.createdById !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.course.delete({ where: { id } })
  await redis.del(COURSE_LIST_KEY)
  await redis.del(COURSE_KEY(id))
  return NextResponse.json({ ok: true })
}
