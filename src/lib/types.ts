export type BoundingBox = {
  /** Normalized 0–1000: [ymin, xmin, ymax, xmax] (Gemini format) */
  box_2d: [number, number, number, number];
  page: number;
};

export type Question = {
  id: string;
  number: string;
  text: string;
  maxMarks: number;
};

export type AnswerMapping = {
  questionId: string;
  questionNumber: string;
  transcribedAnswer: string;
  regions: BoundingBox[];
  status: "answered" | "unanswered" | "unmatched";
  score: number | null;
  maxMarks: number;
  isCorrect: boolean | null;
  feedback: string;
};

export type UnmatchedAnswer = {
  id: string;
  transcribedText: string;
  regions: BoundingBox[];
  note: string;
};

export type AssessmentResult = {
  id: string;
  createdAt: string;
  questions: Question[];
  mappings: AnswerMapping[];
  unmatchedAnswers: UnmatchedAnswer[];
  summary: {
    totalQuestions: number;
    answered: number;
    unanswered: number;
    unmatched: number;
    totalScore: number;
    maxScore: number;
    overallFeedback: string;
  };
  answerSheetPages: string[]; // data URLs or public paths
  questionPaperPages: string[];
};

export type UploadedFileMeta = {
  name: string;
  size: number;
  type: string;
  pageCount: number;
  pages: string[]; // data URLs
};

export type ProcessProgress = {
  stage:
    | "idle"
    | "converting"
    | "extracting_questions"
    | "extracting_answers"
    | "mapping"
    | "grading"
    | "done"
    | "error";
  message: string;
  percent: number;
};
