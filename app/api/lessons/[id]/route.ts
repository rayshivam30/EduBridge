import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const lessonUpdateInput = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["video", "text", "link"]).optional(),
  content: z.string().optional(),
  order: z.number().int().positive().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: { 
            createdById: true,
            enrollments: {
              where: { userId: session.user.id },
              select: { id: true }
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const isOwner = lesson.course.createdById === session.user.id
    const isEnrolled = lesson.course.enrollments.length > 0

    if (!isOwner && !isEnrolled) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(lesson)
  } catch (e) {
    console.error("Error fetching lesson:", e)
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    
    // Check if user owns the course
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: { select: { createdById: true } }
      }
    })

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    if (existingLesson.course.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const updateData = lessonUpdateInput.parse(body)
    
    // Map content to contentURL if provided
    const prismaUpdateData: any = { ...updateData }
    if (updateData.content !== undefined) {
      prismaUpdateData.contentURL = updateData.content
      delete prismaUpdateData.content
    }
    delete prismaUpdateData.type // Remove type as it's not in schema
    delete prismaUpdateData.description // Remove description as it's not in schema

    const lesson = await prisma.lesson.update({
      where: { id },
      data: prismaUpdateData,
    })

    // Clear cache
    await redis.del(`course:${existingLesson.courseId}:v1`)
    const userCacheKey = `courses:list:v1:${session.user.id}`
    await redis.del(userCacheKey)

    return NextResponse.json(lesson)
  } catch (e) {
    console.error("Error updating lesson:", e)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    
    // Check if user owns the course
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: { select: { createdById: true } }
      }
    })

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    if (existingLesson.course.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.lesson.delete({
      where: { id },
    })

    // Clear cache
    await redis.del(`course:${existingLesson.courseId}:v1`)
    const userCacheKey = `courses:list:v1:${session.user.id}`
    await redis.del(userCacheKey)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting lesson:", e)
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
  }
}