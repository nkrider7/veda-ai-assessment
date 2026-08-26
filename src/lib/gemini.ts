import { GoogleGenerativeAI, SchemaType, type ObjectSchema } from "@google/generative-ai";
import type {
  AnswerMapping,
  AssessmentResult,
  BoundingBox,
  Question,
  UnmatchedAnswer,
} from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY / API_KEY");
  return new GoogleGenerativeAI(key);
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    // assume jpeg base64 raw
    return { mimeType: "image/jpeg", data: dataUrl };
  }
  return { mimeType: match[1], data: match[2] };
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

function clampBox(box: number[]): [number, number, number, number] {
  const [ymin, xmin, ymax, xmax] = box.map((n) =>
    Math.max(0, Math.min(1000, Number(n) || 0))
  );
  return [
    Math.min(ymin, ymax),
    Math.min(xmin, xmax),
    Math.max(ymin, ymax),
    Math.max(xmin, xmax),
  ];
}

const questionSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          number: {
            type: SchemaType.STRING,
            description: "Original number e.g. '1', '11(a)', '4 (b)'",
          },
          text: { type: SchemaType.STRING },
          maxMarks: { type: SchemaType.NUMBER },
        },
        required: ["number", "text", "maxMarks"],
      },
    },
  },
  required: ["questions"],
};

const answerSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    answers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: {
            type: SchemaType.STRING,
            description: "Matched question number, or empty if unmatched",
          },
          transcribedText: { type: SchemaType.STRING },
          page: {
            type: SchemaType.NUMBER,
            description: "1-based page index of the primary region",
          },
          box_2d: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
            description: "[ymin, xmin, ymax, xmax] normalized 0-1000",
          },
          extraRegions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                page: { type: SchemaType.NUMBER },
                box_2d: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.NUMBER },
                },
              },
              required: ["page", "box_2d"],
            },
          },
          unmatched: {
            type: SchemaType.BOOLEAN,
            description: "True if this writing does not map to any question",
          },
        },
        required: ["transcribedText", "page", "box_2d", "unmatched"],
      },
    },
  },
  required: ["answers"],
};

const gradeSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    grades: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
          maxMarks: { type: SchemaType.NUMBER },
          isCorrect: { type: SchemaType.BOOLEAN },
          feedback: { type: SchemaType.STRING },
        },
        required: ["questionNumber", "score", "maxMarks", "isCorrect", "feedback"],
      },
    },
    overallFeedback: { type: SchemaType.STRING },
  },
  required: ["grades", "overallFeedback"],
};

export async function extractQuestions(
  questionPaperPages: string[]
): Promise<Question[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: questionSchema,
    },
  });

  const parts = [
    {
      text: `You are an expert exam paper parser for teachers.

Extract EVERY question from the question paper images in printed order.

Rules:
- Preserve original numbering exactly (e.g. "1", "2", "11(a)", "11(b)", "4 (a)").
- Treat labelled sub-parts as SEPARATE questions (11(a) and 11(b) are two entries).
- Include the full question text (and any MCQ options if present).
- Infer maxMarks from marks shown like [2], (3 marks), etc. Default to 2 if unknown.
- Do not invent questions that are not on the paper.
- Ignore headers, instructions, and footers that are not questions.

Return JSON matching the schema.`,
    },
    ...questionPaperPages.map((p) => {
      const { mimeType, data } = parseDataUrl(p);
      return { inlineData: { mimeType, data } };
    }),
  ];

  const result = await model.generateContent(parts);
  const raw = extractJson(result.response.text()) as {
    questions: { number: string; text: string; maxMarks: number }[];
  };

  return (raw.questions || []).map((q, i) => {
    const number = displayNumber(String(q.number).trim());
    return {
      id: `q-${i}-${normalizeNum(number) || i}`,
      number,
      text: String(q.text).trim(),
      maxMarks: Number(q.maxMarks) > 0 ? Number(q.maxMarks) : 2,
    };
  });
}

export async function extractAndMapAnswers(
  answerSheetPages: string[],
  questions: Question[]
): Promise<{
  mappings: Omit<
    AnswerMapping,
    "score" | "isCorrect" | "feedback" | "maxMarks"
  >[];
  unmatchedAnswers: UnmatchedAnswer[];
}> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: answerSchema,
    },
  });

  const questionList = questions
    .map((q) => `- Q${q.number}: ${q.text}`)
    .join("\n");

  const parts = [
    {
      text: `You are an expert at reading handwritten student answer sheets and mapping answers to questions.

Known questions (preserve these numbers):
${questionList}

For EACH distinct answer region on the answer sheet images:
1. Transcribe the handwritten text (and briefly note diagrams/equations).
2. Map it to the best matching questionNumber when possible (handle out-of-order answers).
3. Provide a tight bounding box box_2d as [ymin, xmin, ymax, xmax] normalized to 0-1000 for that page image.
4. page is 1-based index matching the image order provided.
5. If an answer spans multiple pages/regions, put the primary box in box_2d and others in extraRegions.
6. If the handwriting is labelled Q1 / 1. / 4(a) etc., ALWAYS set questionNumber to that label (without inventing new questions) and unmatched=false.
7. Only set unmatched=true when the writing truly cannot be linked to any known question.
8. Do NOT invent answers for unanswered questions — simply omit them.
9. questionNumber must match one of the known question numbers above when possible (e.g. "1", "2", "4 (a)").

Important for bounding boxes:
- Origin is top-left.
- Cover the full answer for that question including diagrams and equations.
- Be as tight as reasonable around the ink.

Return JSON matching the schema.`,
    },
    ...answerSheetPages.map((p, idx) => {
      const { mimeType, data } = parseDataUrl(p);
      return {
        inlineData: { mimeType, data },
        // annotate via preceding text
      };
    }),
  ];

  // Annotate page numbers in text before each image
  const annotatedParts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: (parts[0] as { text: string }).text }];
  answerSheetPages.forEach((p, idx) => {
    annotatedParts.push({ text: `\n[Answer sheet page ${idx + 1}]` });
    const { mimeType, data } = parseDataUrl(p);
    annotatedParts.push({ inlineData: { mimeType, data } });
  });

  const result = await model.generateContent(annotatedParts);
  const raw = extractJson(result.response.text()) as {
    answers: Array<{
      questionNumber?: string;
      transcribedText: string;
      page: number;
      box_2d: number[];
      extraRegions?: { page: number; box_2d: number[] }[];
      unmatched: boolean;
    }>;
  };

  const byNumber = new Map(questions.map((q) => [normalizeNum(q.number), q]));
  const used = new Set<string>();
  const mappings: Omit<
    AnswerMapping,
    "score" | "isCorrect" | "feedback" | "maxMarks"
  >[] = [];
  const unmatchedAnswers: UnmatchedAnswer[] = [];

  for (const ans of raw.answers || []) {
    const regions: BoundingBox[] = [
      {
        page: Math.max(1, Math.round(Number(ans.page) || 1)),
        box_2d: clampBox(ans.box_2d || [0, 0, 100, 100]),
      },
      ...(ans.extraRegions || []).map((r) => ({
        page: Math.max(1, Math.round(Number(r.page) || 1)),
        box_2d: clampBox(r.box_2d || [0, 0, 100, 100]),
      })),
    ];

    const inferred =
      normalizeNum(ans.questionNumber || "") ||
      inferNumberFromText(ans.transcribedText || "") ||
      "";
    const q = inferred ? byNumber.get(inferred) : undefined;

    // Even if the model marked unmatched, recover via label in the transcript
    if (!q) {
      unmatchedAnswers.push({
        id: `um-${unmatchedAnswers.length}`,
        transcribedText: ans.transcribedText,
        regions,
        note: "Could not match this writing to any extracted question.",
      });
      continue;
    }

    used.add(q.id);
    mappings.push({
      questionId: q.id,
      questionNumber: q.number,
      transcribedAnswer: ans.transcribedText,
      regions,
      status: "answered",
    });
  }

  // Unanswered questions
  for (const q of questions) {
    if (used.has(q.id)) continue;
    mappings.push({
      questionId: q.id,
      questionNumber: q.number,
      transcribedAnswer: "",
      regions: [],
      status: "unanswered",
    });
  }

  // Keep printed order
  mappings.sort((a, b) => {
    const ia = questions.findIndex((q) => q.id === a.questionId);
    const ib = questions.findIndex((q) => q.id === b.questionId);
    return ia - ib;
  });

  return { mappings, unmatchedAnswers };
}

function normalizeNum(n: string): string {
  return n
    .toLowerCase()
    .replace(/^q\.?\s*/i, "")
    .replace(/\s+/g, "")
    .replace(/[.]/g, "");
}

/** Pull a question number from labels like "Q1.", "1)", "4 (a)", "Q4(b)" */
function inferNumberFromText(text: string): string | null {
  const head = text.trim().slice(0, 40);
  const patterns = [
    /^q\s*([0-9]+)\s*[\(\[]\s*([a-z])\s*[\)\]]/i,
    /^([0-9]+)\s*[\(\[]\s*([a-z])\s*[\)\]]/i,
    /^q\s*\.?\s*([0-9]+)/i,
    /^([0-9]+)\s*[\.\)\-:]/,
  ];
  for (const re of patterns) {
    const m = head.match(re);
    if (!m) continue;
    if (m[2]) return normalizeNum(`${m[1]}(${m[2]})`);
    return normalizeNum(m[1]);
  }
  return null;
}

function displayNumber(n: string): string {
  // Prefer "1" / "4 (a)" over "Q1" for UI badges
  const cleaned = n.replace(/^q\.?\s*/i, "").trim();
  const m = cleaned.match(/^(\d+)\s*[\(\[]\s*([a-z])\s*[\)\]]/i);
  if (m) return `${m[1]} (${m[2].toLowerCase()})`;
  return cleaned;
}

export async function gradeAnswers(
  questions: Question[],
  mappings: Omit<
    AnswerMapping,
    "score" | "isCorrect" | "feedback" | "maxMarks"
  >[]
): Promise<{
  grades: Record<
    string,
    { score: number; maxMarks: number; isCorrect: boolean; feedback: string }
  >;
  overallFeedback: string;
}> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: gradeSchema,
    },
  });

  const payload = questions.map((q) => {
    const m = mappings.find((x) => x.questionId === q.id);
    return {
      questionNumber: q.number,
      question: q.text,
      maxMarks: q.maxMarks,
      studentAnswer:
        m?.status === "answered" ? m.transcribedAnswer : "(No answer provided)",
      answered: m?.status === "answered",
    };
  });

  const result = await model.generateContent([
    {
      text: `You are a fair school exam grader for Class 10 Science.

Grade each student answer against the question. Be constructive.
- score must be between 0 and maxMarks.
- isCorrect is true only for full marks (or near-full for subjective if essentially correct).
- For unanswered questions, score=0, isCorrect=false, brief feedback saying unanswered.
- feedback: 1-3 sentences of teacher-style AI feedback.

Items:
${JSON.stringify(payload, null, 2)}

Return JSON matching the schema.`,
    },
  ]);

  const raw = extractJson(result.response.text()) as {
    grades: Array<{
      questionNumber: string;
      score: number;
      maxMarks: number;
      isCorrect: boolean;
      feedback: string;
    }>;
    overallFeedback: string;
  };

  const grades: Record<
    string,
    { score: number; maxMarks: number; isCorrect: boolean; feedback: string }
  > = {};

  for (const g of raw.grades || []) {
    const key = normalizeNum(g.questionNumber);
    const q = questions.find((x) => normalizeNum(x.number) === key);
    const max = q?.maxMarks ?? g.maxMarks ?? 2;
    const score = Math.max(0, Math.min(max, Number(g.score) || 0));
    grades[key] = {
      score,
      maxMarks: max,
      isCorrect: Boolean(g.isCorrect) && score >= max,
      feedback: g.feedback || "",
    };
  }

  return {
    grades,
    overallFeedback: raw.overallFeedback || "Assessment complete.",
  };
}

export async function runFullAssessment(input: {
  questionPaperPages: string[];
  answerSheetPages: string[];
  onProgress?: (stage: string, message: string, percent: number) => void;
}): Promise<AssessmentResult> {
  const { questionPaperPages, answerSheetPages, onProgress } = input;

  onProgress?.("extracting_questions", "Extracting questions from question paper…", 15);
  const questions = await extractQuestions(questionPaperPages);
  if (!questions.length) {
    throw new Error("No questions could be extracted from the question paper.");
  }

  onProgress?.("extracting_answers", "Locating answers on the answer sheet…", 45);
  const { mappings: rawMappings, unmatchedAnswers } = await extractAndMapAnswers(
    answerSheetPages,
    questions
  );

  onProgress?.("grading", "Grading answers and generating feedback…", 75);
  const { grades, overallFeedback } = await gradeAnswers(questions, rawMappings);

  const mappings: AnswerMapping[] = rawMappings.map((m) => {
    const g = grades[normalizeNum(m.questionNumber)];
    const maxMarks =
      questions.find((q) => q.id === m.questionId)?.maxMarks ?? g?.maxMarks ?? 2;
    if (m.status === "unanswered") {
      return {
        ...m,
        maxMarks,
        score: 0,
        isCorrect: false,
        feedback: g?.feedback || "This question was not answered.",
      };
    }
    return {
      ...m,
      maxMarks,
      score: g?.score ?? 0,
      isCorrect: g?.isCorrect ?? false,
      feedback: g?.feedback || "",
    };
  });

  const answered = mappings.filter((m) => m.status === "answered").length;
  const unanswered = mappings.filter((m) => m.status === "unanswered").length;
  const totalScore = mappings.reduce((s, m) => s + (m.score ?? 0), 0);
  const maxScore = mappings.reduce((s, m) => s + m.maxMarks, 0);

  onProgress?.("done", "Assessment ready", 100);

  return {
    id: `assess-${Date.now()}`,
    createdAt: new Date().toISOString(),
    questions,
    mappings,
    unmatchedAnswers,
    summary: {
      totalQuestions: questions.length,
      answered,
      unanswered,
      unmatched: unmatchedAnswers.length,
      totalScore,
      maxScore,
      overallFeedback,
    },
    answerSheetPages,
    questionPaperPages,
  };
}
