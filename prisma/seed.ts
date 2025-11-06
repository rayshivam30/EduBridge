import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  // Minimal seed: a sample course with two lessons
  const user = await prisma.user.upsert({
    where: { email: "demo@edubridge.dev" },
    update: {},
    create: { email: "demo@edubridge.dev", name: "Demo User" },
  })

  const course = await prisma.course.create({
    data: {
      title: "Getting Started with EduBridge",
      description: "Welcome course",
      price: 0,
      status: "published",
      createdById: user.id,
      lessons: {
        create: [
          { title: "Intro", order: 1 },
          { title: "Next Steps", order: 2 },
        ],
      },
    },
  })

  await prisma.enrollment.create({
    data: { userId: user.id, courseId: course.id, status: "active" },
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
