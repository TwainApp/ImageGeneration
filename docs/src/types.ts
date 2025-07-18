export interface QuestionGroup {
  id: string;
  title: string;
  questions: string[];
  theme: string;
  difficulty: string;
  createdAt: Date;
  order: number;
  isActive: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  githubUsername: string;
}

export interface VideoGenerationRequest {
  questionGroupId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  videoUrl?: string;
  caption?: string;
} 