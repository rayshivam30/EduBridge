import Dexie, { Table } from 'dexie';

// Database interfaces
export interface OfflineCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  lessons: OfflineLesson[];
  quizzes: OfflineQuiz[];
  lastSynced: Date;
  isDownloaded: boolean;
}

export interface OfflineLesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  duration?: number;
  lastSynced: Date;
}

export interface OfflineQuiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  lastSynced: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface StudentProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  completed: boolean;
  progress: number;
  timeSpent: number;
  lastAccessed: Date;
  synced: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, number>;
  score: number;
  completedAt: Date;
  synced: boolean;
}

export interface ForumPost {
  id: string;
  userId: string;
  courseId?: string;
  title: string;
  content: string;
  replies: ForumReply[];
  createdAt: Date;
  synced: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  synced: boolean;
}

export interface AITutorCache {
  id: string;
  query: string;
  response: string;
  courseId?: string;
  lessonId?: string;
  createdAt: Date;
}

export interface PendingSync {
  id: string;
  type: 'progress' | 'quiz' | 'forum' | 'ai-query';
  data: any;
  createdAt: Date;
  retryCount: number;
}

// Dexie database class
export class EduBridgeDB extends Dexie {
  courses!: Table<OfflineCourse>;
  lessons!: Table<OfflineLesson>;
  quizzes!: Table<OfflineQuiz>;
  studentProgress!: Table<StudentProgress>;
  quizAttempts!: Table<QuizAttempt>;
  forumPosts!: Table<ForumPost>;
  forumReplies!: Table<ForumReply>;
  aiTutorCache!: Table<AITutorCache>;
  pendingSync!: Table<PendingSync>;

  constructor() {
    super('EduBridgeOffline');
    
    this.version(1).stores({
      courses: 'id, title, isDownloaded, lastSynced',
      lessons: 'id, courseId, title, order, lastSynced',
      quizzes: 'id, courseId, lessonId, title, lastSynced',
      studentProgress: 'id, userId, courseId, lessonId, completed, synced',
      quizAttempts: 'id, userId, quizId, completedAt, synced',
      forumPosts: 'id, userId, courseId, createdAt, synced',
      forumReplies: 'id, postId, userId, createdAt, synced',
      aiTutorCache: 'id, query, courseId, lessonId, createdAt',
      pendingSync: 'id, type, createdAt, retryCount'
    });
  }
}

// Initialize database with error handling
let dbInstance: EduBridgeDB | null = null;

export const db = (() => {
  if (typeof window !== 'undefined' && !dbInstance) {
    try {
      dbInstance = new EduBridgeDB();
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      // Return a mock database for SSR or when IndexedDB is not available
      dbInstance = new EduBridgeDB();
    }
  }
  return dbInstance || new EduBridgeDB();
})();