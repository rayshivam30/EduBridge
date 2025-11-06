import { getCourseById } from "@/app/actions/courses"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import CourseProgress from "@/components/course-progress"

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  order: number;
  duration: number | null;
  isPreview: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  lessons: Lesson[];
  _count: {
    enrollments: number;
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const course = await getCourseById(params.id) as Course | null
  if (!course) return notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground mt-2">{course.description}</p>
        </div>

        <CourseProgress courseId={params.id} lessons={course.lessons} />
      </div>
    </div>
  )
}