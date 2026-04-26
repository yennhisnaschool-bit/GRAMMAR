
export enum AppState {
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  VIEWING_QUIZ = 'VIEWING_QUIZ',
  ERROR = 'ERROR',
}

export enum QuizType {
  MULTIPLE_CHOICE = 'Multiple Choice',
  SENTENCE_TRANSFORMATION = 'Sentence Transformation',
}

export enum FocusArea {
  VOCABULARY = 'Vocabulary',
  GRAMMAR = 'Grammar',
  READING_COMPREHENSION = 'Reading Comprehension',
  MIXED = 'Mixed',
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string; // Base64 for images, text content for documents
}

export interface QuizQuestion {
  question: string;
  options?: string[]; // Optional for sentence transformation
  correctAnswerIndex?: number; // Optional for sentence transformation
  modelAnswer?: string; // For sentence transformation
  explanation?: string;
}

export interface QuizConfig {
  numQuestions: number;
  focusArea: FocusArea;
  quizType: QuizType;
}
