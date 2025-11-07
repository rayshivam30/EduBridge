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
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Create a user-specific cache key
    const userCacheKey = `${COURSE_LIST_KEY}:${session.user.id}`
    const cached = await redis.get(userCacheKey)
    if (cached) return NextResponse.json(cached)

    // Only fetch courses created by the authenticated user
    const data = await prisma.course.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        createdBy: { select: { id: true, name: true, image: true } },
      },
    })
    await redis.set(userCacheKey, data, { ex: 60 })
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
      data: { 
        title, 
        description, 
        price: price, // Prisma will handle the Decimal conversion
        status, 
        createdById: session.user.id 
      },
    })
    // Clear user-specific cache and public cache if published
    const userCacheKey = `${COURSE_LIST_KEY}:${session.user.id}`
    await redis.del(userCacheKey)
    if (status === "published") {
      await redis.del("courses:public:v1")
    }
    return NextResponse.json(course, { status: 201 })
  } catch (e) {
    console.error("Course creation error:", e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
