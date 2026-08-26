import { create } from "zustand";
import type {
  AssessmentResult,
  ProcessProgress,
  UploadedFileMeta,
} from "./types";

type AppState = {
  questionPaper: UploadedFileMeta | null;
  answerSheet: UploadedFileMeta | null;
  result: AssessmentResult | null;
  progress: ProcessProgress;
  selectedQuestionId: string | null;
  setQuestionPaper: (file: UploadedFileMeta | null) => void;
  setAnswerSheet: (file: UploadedFileMeta | null) => void;
  setResult: (result: AssessmentResult | null) => void;
  setProgress: (progress: ProcessProgress) => void;
  setSelectedQuestionId: (id: string | null) => void;
  reset: () => void;
};

const idleProgress: ProcessProgress = {
  stage: "idle",
  message: "",
  percent: 0,
};

export const useAppStore = create<AppState>((set) => ({
  questionPaper: null,
  answerSheet: null,
  result: null,
  progress: idleProgress,
  selectedQuestionId: null,
  setQuestionPaper: (file) => set({ questionPaper: file }),
  setAnswerSheet: (file) => set({ answerSheet: file }),
  setResult: (result) => set({ result }),
  setProgress: (progress) => set({ progress }),
  setSelectedQuestionId: (id) => set({ selectedQuestionId: id }),
  reset: () =>
    set({
      questionPaper: null,
      answerSheet: null,
      result: null,
      progress: idleProgress,
      selectedQuestionId: null,
    }),
}));
