export interface QuizOption {
  id: string;
  text: string;
}

export interface Quiz {
  question: string;
  options: string[]; // Simple array of strings for A, B, C, D
  correctAnswerIndex: number; // 0 for A, 1 for B, etc.
  explanation: string;
}

export interface Slide {
  id: string;
  title: string;
  contentPoints: string[];
  quiz?: Quiz;
}

export interface Presentation {
  topic: string;
  slides: Slide[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  GENERATING = 'GENERATING',
  PRESENTATION = 'PRESENTATION',
  ERROR = 'ERROR'
}

export interface AudioCache {
  [slideId: string]: AudioBuffer;
}