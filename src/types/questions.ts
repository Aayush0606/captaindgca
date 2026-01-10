export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  subcategory?: string;
  difficulty: "easy" | "medium" | "hard";
  source: QuestionSource;
  aircraft?: string;
}

export type QuestionSource = "ATPL" | "Indigo" | "Oxford" | "Keith Williams" | "Previous Papers";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  questionCount: number;
  subcategories?: string[];
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
  categoryId: string;
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
