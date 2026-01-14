export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topicId: string;
  difficulty: "easy" | "medium" | "hard";
}

export type QuestionSource = "ATPL" | "Indigo" | "Oxford" | "Keith Williams" | "Previous Papers";

export type SectionType = "dgca_questions" | "books" | "aircrafts" | "airlines";

export interface Section {
  type: SectionType;
  name: string;
  icon?: string;
}

export interface Subtype {
  id: string;
  sectionType: SectionType;
  name: string;
  slug: string;
  description?: string;
  questionCount?: number;
}

export interface Category {
  id: string;
  sectionType?: SectionType; // Only set if category is directly under section
  subtypeId?: string; // Only set if category is under a subtype
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  questionCount?: number;
}

export interface Topic {
  id: string;
  categoryId: string | null; // Nullable - topics can exist without categories
  name: string;
  slug: string;
  description?: string;
  questionCount?: number;
}

export interface TestConfig {
  categoryId: string;
  questionCount: number;
  timeLimit: number; // in minutes
  source?: QuestionSource;
}

export interface TestResult {
  id: string;
  date: Date;
  topicId?: string;
  categoryId?: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  answers: UserAnswer[];
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTaken: number; // in seconds
}

export interface UserProgress {
  userId: string;
  totalTestsTaken: number;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  categoryProgress: CategoryProgress[];
  recentTests: TestResult[];
  bookmarkedQuestions: string[];
  streak: number;
  lastActiveDate: Date;
}

export interface CategoryProgress {
  categoryId: string;
  questionsAttempted: number;
  correctAnswers: number;
  averageScore: number;
  lastAttempted: Date;
}

export interface TopicProgress {
  topicId: string;
  questionsAttempted: number;
  correctAnswers: number;
  averageScore: number;
  lastAttempted: Date;
}
