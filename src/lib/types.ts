export type QuestionType =
  | "single_choice"
  | "true_false"
  | "fill_blank"
  | "scenario";

export type Difficulty = "easy" | "medium" | "hard";

export type DocumentEntity = {
  id: string;
  title: string;
  sourceFileName: string;
  rawText: string;
  createdAt: string;
};

export type ChapterEntity = {
  id: string;
  documentId: string;
  title: string;
  order: number;
  content: string;
  coreConcepts: string[];
  keyCommands: { command: string; desc: string }[];
  steps: string[];
  commonMistakes: string[];
  feynmanExplanation: string;
};

export type QuizQuestion = {
  id: string;
  chapterId: string;
  type: QuestionType;
  stem: string;
  options?: string[];
  answer: string | string[];
  analysis: string;
  difficulty: Difficulty;
};

export type QuizSet = {
  id: string;
  documentId: string;
  chapterId: string;
  questions: QuizQuestion[];
  createdAt: string;
};

export type DocumentSnapshot = {
  document: DocumentEntity;
  chapters: ChapterEntity[];
  quizSet?: QuizSet;
};
