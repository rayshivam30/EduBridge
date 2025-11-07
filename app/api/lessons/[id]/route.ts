import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const lessonUpdateInput = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  contentTypes: z.array(z.string()).optional(),
  textContent: z.string().optional(),
  externalLinks: z.array(z.string()).optional(),
  videoType: z.enum(["upload", "youtube"]).optional(),
  videoUrl: z.string().optional(),
  videoPublicId: z.string().optional(),
  youtubeUrl: z.string().optional(),
  order: z.number().int().positive().optional(),
  // Keep old fields for backward compatibility
  type: z.enum(["video", "text", "link"]).optional(),
  content: z.string().optional(),
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
    
    // Prepare data for Prisma update
    const prismaUpdateData: any = {}
    
    // Handle new fields
    if (updateData.title !== undefined) prismaUpdateData.title = updateData.title
    if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
    if (updateData.contentTypes !== undefined) prismaUpdateData.contentTypes = updateData.contentTypes
    if (updateData.textContent !== undefined) prismaUpdateData.textContent = updateData.textContent
    if (updateData.externalLinks !== undefined) prismaUpdateData.externalLinks = updateData.externalLinks
    if (updateData.videoType !== undefined) prismaUpdateData.videoType = updateData.videoType
    if (updateData.videoUrl !== undefined) prismaUpdateData.videoUrl = updateData.videoUrl
    if (updateData.videoPublicId !== undefined) prismaUpdateData.videoPublicId = updateData.videoPublicId
    if (updateData.youtubeUrl !== undefined) prismaUpdateData.youtubeUrl = updateData.youtubeUrl
    if (updateData.order !== undefined) prismaUpdateData.order = updateData.order
    
    // Handle backward compatibility
    if (updateData.content !== undefined) {
      prismaUpdateData.contentURL = updateData.content
    }
    
    // Set contentURL for backward compatibility if new content exists
    if (!prismaUpdateData.contentURL && (updateData.textContent || updateData.videoUrl || updateData.youtubeUrl)) {
      prismaUpdateData.contentURL = updateData.textContent || updateData.videoUrl || updateData.youtubeUrl
    }

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