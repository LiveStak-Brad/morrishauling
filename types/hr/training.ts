export type TrainingCourseType = "video" | "quiz" | "document" | "in_person";
export type TrainingCourseStatus = "not_started" | "in_progress" | "overdue" | "completed" | "expired";

export interface TrainingCourse {
  id: string;
  companyId?: string;
  name: string;
  description?: string;
  courseType: TrainingCourseType;
  category?: string;
  contentUrl?: string;
  contentHtml?: string;
  expirationMonths?: number;
  isRequired: boolean;
  isActive: boolean;
  sortOrder?: number;
  passingScorePercent: number;
  maxQuizAttempts: number;
  requiresLessonCompletion: boolean;
  certificateTemplateHtml?: string;
}

export interface TrainingLesson {
  id: string;
  courseId: string;
  title: string;
  overview?: string;
  objectives: string[];
  contentHtml: string;
  imagePaths: string[];
  sortOrder: number;
  minReadSeconds: number;
  completed?: boolean;
  completedAt?: string;
}

export interface TrainingQuizQuestion {
  id: string;
  courseId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  sortOrder: number;
}

export interface TrainingQuizQuestionPublic {
  id: string;
  question: string;
  options: string[];
  sortOrder: number;
}

export interface TrainingCompletion {
  id: string;
  employeeId: string;
  courseId: string;
  completedAt: string;
  expiresAt?: string;
  score?: number;
  passed: boolean;
  certificatePath?: string;
  course?: TrainingCourse;
}

export interface TrainingQuizAttempt {
  id: string;
  employeeId: string;
  courseId: string;
  score: number;
  passed: boolean;
  answers?: Record<string, number>;
  attemptedAt: string;
}

export interface TrainingCourseAssignment {
  id: string;
  courseId: string;
  employeeId?: string;
  employmentType?: string;
  employeeRole?: string;
  positionId?: string;
  isRequired: boolean;
  dueDate?: string;
  renewalMonths?: number;
}

export interface TrainingAcknowledgment {
  id: string;
  completionId: string;
  employeeId: string;
  courseId: string;
  signerName: string;
  acknowledgmentText: string;
  signedAt: string;
}

export interface AssignedCourseSummary {
  course: TrainingCourse;
  status: TrainingCourseStatus;
  lessonsTotal: number;
  lessonsCompleted: number;
  quizAttempts: number;
  bestScore?: number;
  completion?: TrainingCompletion;
  dueDate?: string;
  isOverdue: boolean;
}

export interface TrainingCourseDetail {
  course: TrainingCourse;
  lessons: TrainingLesson[];
  quizQuestionCount: number;
  status: TrainingCourseStatus;
  lessonsCompleted: number;
  quizPassed: boolean;
  bestScore?: number;
  attemptsRemaining: number;
  completion?: TrainingCompletion;
  acknowledgmentRequired: boolean;
}

export interface TrainingMatrixRow {
  employeeId: string;
  employeeName: string;
  courses: Array<{
    courseId: string;
    courseName: string;
    status: TrainingCourseStatus;
    score?: number;
    completedAt?: string;
    expiresAt?: string;
  }>;
}
