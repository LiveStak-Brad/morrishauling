import { CoursePlayer } from "@/components/employee/training/CoursePlayer";

export default async function TrainingCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CoursePlayer courseId={courseId} />;
}
