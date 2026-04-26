
import { FocusArea, QuizType } from './types';

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

export const FOCUS_AREAS: FocusArea[] = [
  FocusArea.MIXED,
  FocusArea.READING_COMPREHENSION,
  FocusArea.VOCABULARY,
  FocusArea.GRAMMAR,
];

export const QUIZ_TYPES: QuizType[] = [
  QuizType.MULTIPLE_CHOICE,
  QuizType.SENTENCE_TRANSFORMATION,
];

export const MOCK_EXTRACTED_TEXT = `This is a sample text extracted from your document. Grammar - Quiz - Maker will use this content to generate your quiz. For documents like PDFs, Word files, and text files, we parse the content directly. For images, we use advanced OCR to recognize and extract the text. You can review and edit this text before proceeding to generate the questions.`;
