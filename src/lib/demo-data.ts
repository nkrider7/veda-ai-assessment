import type { AssessmentResult } from "./types";

/** Offline demo matching samplequestionans.png + sample-question-paper.png */
export function buildDemoResult(): AssessmentResult {
  const answerSheetPages = ["/samplequestionans.png"];
  const questionPaperPages = ["/sample-question-paper.png"];

  const questions = [
    {
      id: "q-0-1",
      number: "1",
      text: "Define photosynthesis. Write the balanced chemical equation for photosynthesis and draw a neat labelled diagram showing the process.",
      maxMarks: 2,
    },
    {
      id: "q-1-2",
      number: "2",
      text: "In which organelle of the plant cell does photosynthesis mainly occur? Briefly describe its two main stages.",
      maxMarks: 2,
    },
    {
      id: "q-2-3",
      number: "3",
      text: "Explain why chlorophyll is essential for photosynthesis.",
      maxMarks: 3,
    },
    {
      id: "q-3-4a",
      number: "4 (a)",
      text: "What are the raw materials required for photosynthesis?",
      maxMarks: 2,
    },
    {
      id: "q-4-4b",
      number: "4 (b)",
      text: "How do stomata help in the process of photosynthesis?",
      maxMarks: 3,
    },
    {
      id: "q-5-5",
      number: "5",
      text: "Differentiate between light reaction and dark reaction.",
      maxMarks: 3,
    },
    {
      id: "q-6-6",
      number: "6",
      text: "Draw a neat labelled diagram of a cross-section of a leaf showing the sites of photosynthesis.",
      maxMarks: 5,
    },
  ];

  return {
    id: "demo-assessment",
    createdAt: new Date().toISOString(),
    questions,
    questionPaperPages,
    answerSheetPages,
    unmatchedAnswers: [],
    mappings: [
      {
        questionId: "q-0-1",
        questionNumber: "1",
        transcribedAnswer:
          "Photosynthesis is the process used by green plants and some other organisms to convert light energy into chemical energy. Equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (with light/chlorophyll). Includes labelled diagram of plant with sunlight, CO₂, O₂, and water.",
        regions: [{ page: 1, box_2d: [40, 50, 620, 920] }],
        status: "answered",
        score: 2,
        maxMarks: 2,
        isCorrect: true,
        feedback:
          "Excellent work! Clear definition, correct balanced equation, and a neat labelled diagram covering sunlight, CO₂, water, and oxygen.",
      },
      {
        questionId: "q-1-2",
        questionNumber: "2",
        transcribedAnswer:
          "The process mainly occurs in the chloroplast of the plant cell. It has two main stages: 1. Light reaction – Captures light energy. 2. Dark reaction – Uses energy to make glucose.",
        regions: [{ page: 1, box_2d: [640, 50, 920, 920] }],
        status: "answered",
        score: 2,
        maxMarks: 2,
        isCorrect: true,
        feedback:
          "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis and named both stages. Keep it up!",
      },
      {
        questionId: "q-2-3",
        questionNumber: "3",
        transcribedAnswer: "",
        regions: [],
        status: "unanswered",
        score: 0,
        maxMarks: 3,
        isCorrect: false,
        feedback: "This question was left unanswered.",
      },
      {
        questionId: "q-3-4a",
        questionNumber: "4 (a)",
        transcribedAnswer: "",
        regions: [],
        status: "unanswered",
        score: 0,
        maxMarks: 2,
        isCorrect: false,
        feedback: "This question was left unanswered.",
      },
      {
        questionId: "q-4-4b",
        questionNumber: "4 (b)",
        transcribedAnswer: "",
        regions: [],
        status: "unanswered",
        score: 0,
        maxMarks: 3,
        isCorrect: false,
        feedback: "This question was left unanswered.",
      },
      {
        questionId: "q-5-5",
        questionNumber: "5",
        transcribedAnswer: "",
        regions: [],
        status: "unanswered",
        score: 0,
        maxMarks: 3,
        isCorrect: false,
        feedback: "This question was left unanswered.",
      },
      {
        questionId: "q-6-6",
        questionNumber: "6",
        transcribedAnswer: "",
        regions: [],
        status: "unanswered",
        score: 0,
        maxMarks: 5,
        isCorrect: false,
        feedback: "This question was left unanswered.",
      },
    ],
    summary: {
      totalQuestions: 7,
      answered: 2,
      unanswered: 5,
      unmatched: 0,
      totalScore: 4,
      maxScore: 20,
      overallFeedback:
        "Strong start on Q1 and Q2 with accurate science and clear presentation. Several later questions remain unanswered — completing those would significantly improve the overall score.",
    },
  };
}
