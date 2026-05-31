export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  year?: number;
  examType?: ExaminationType;
}

export interface Concept {
  title: string;
  explanation: string;
}

export interface Example {
  title: string;
  problem: string;
  solution: string;
}

export interface Practical {
  title: string;
  objective: string;
  apparatus: string[];
  procedure: string[];
  observations: string;
  conclusion: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  syllabus: string[];
  concepts: Concept[];
  advancedConcepts?: Concept[];
  questions: Question[];
  advancedQuestions?: Question[];
  examples?: Example[];
  practicals?: Practical[];
}

export interface UserProgress {
  subjectId: string;
  completedQuestions: string[];
  score: number;
  totalAttempts: number;
  lastAttemptDate?: string;
  history: { date: string; score: number }[];
}

export type ExaminationType = 'BECE' | 'WASSCE';

export interface MockExamResult {
  id: string;
  candidateName: string;
  indexNumber: string;
  subjectName: string;
  subjectId: string;
  level: ExaminationType;
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  gradeRemark: string;
  date: string;
  year: number;
}

export interface ExamDate {
  subjectId: string;
  date: string;
}

export interface AIExplanationResponse {
  explanation: string;
  didYouKnow?: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export type AppState = 'home' | 'subject-detail' | 'quiz' | 'ai-vs-human' | 'past-questions' | 'progress' | 'study-guide' | 'study-planner' | 'notifications' | 'settings' | 'account' | 'privacy' | 'terms' | 'help';
