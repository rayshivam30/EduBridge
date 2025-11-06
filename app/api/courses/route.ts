import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const COURSE_LIST_KEY = "courses:list:v1"

const courseInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
})

export async function GET() {
  try {
    const cached = await redis.get(COURSE_LIST_KEY)
    if (cached) return NextResponse.json(cached)

    const data = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        createdBy: { select: { id: true, name: true, image: true } },
      },
    })
    await redis.set(COURSE_LIST_KEY, data, { ex: 60 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { title, description, price, status } = courseInput.parse(body)
    const course = await prisma.course.create({
      data: { title, description, price, status, createdById: session.user.id },
    })
    await redis.del(COURSE_LIST_KEY)
    return NextResponse.json(course, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
