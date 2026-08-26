# VedaAI — AI Assessment Extraction & Answer Mapping

Full-stack teacher tool that extracts questions from a question paper, maps handwritten answers on a student answer sheet, highlights exact answer regions, and generates per-question grading + AI feedback.

## Live demo

- **GitHub:** https://github.com/nkrider7/veda-ai-assessment
- **One-click deploy:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nkrider7/veda-ai-assessment&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20key%20from%20https://aistudio.google.com/apikey&project-name=veda-ai-assessment&repository-name=veda-ai-assessment)

After deploying, set `GEMINI_API_KEY` in the Vercel project environment variables (same key as in `.env`).

**Live URL:** add your Vercel URL here after deploy (e.g. `https://veda-ai-assessment.vercel.app`).

## Features

- Upload question paper + answer sheet (PDF or images, max 10MB)
- Processing progress UI
- Question extraction with original numbering and sub-parts (e.g. `4 (a)`, `4 (b)`)
- Answer extraction with bounding-box highlights (multi-page capable)
- Out-of-order answers, unanswered questions, and unmatched writing
- Marks, correct/incorrect evaluation, AI feedback, and grading summary
- UI closely following the provided Figma designs
- Demo mode (no API call) + sample files for quick walkthrough

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand + sessionStorage |
| PDF → images | `pdfjs-dist` (client-side) |
| AI | Google Gemini (`gemini-3.6-flash`) via `@google/generative-ai` |
| Storage | In-memory / client session (no DB, no auth) |

## Approach

1. **Upload** — Client validates files and converts PDF pages to JPEG data URLs.
2. **Question extraction** — Gemini vision reads the question paper and returns ordered questions with numbers + max marks. Sub-parts become separate entries.
3. **Answer mapping** — Gemini locates each handwritten answer region as `[ymin, xmin, ymax, xmax]` normalized to 0–1000, maps it to a question (even if out of order), and flags unmatched writing.
4. **Grading** — Gemini scores each answer and writes teacher-style feedback.
5. **Review UI** — Selecting a question highlights its region(s) on the answer sheet viewer (zoom + page navigation).

## Setup

```bash
npm install
cp .env.example .env
# paste your Gemini API key into .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick try without uploading your own files

1. Click **Load sample files**, then **Start Mapping** (uses Gemini), or
2. Click **View demo mapping (no API)** for a local walkthrough of the mapping UI.

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
# set GEMINI_API_KEY in Vercel project env vars
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard and add `GEMINI_API_KEY`.

## Assumptions & limitations

- Designed for a **single student** answer sheet per run (as specified).
- Best results with clear scans/photos and readable handwriting.
- Bounding boxes come from Gemini vision and may be slightly loose/tight on messy pages.
- Free-tier Gemini rate limits apply; large multi-page PDFs are capped at 12 pages each.
- No authentication or persistent database — results live in the browser session after processing.
- Sample question paper is synthetic and paired with the included handwritten sample answer sheet (photosynthesis Q1–Q2).

## Project structure

```
src/
  app/                  # routes + API
  components/layout/    # sidebar, top bar, icon rail
  components/upload/    # upload UX + progress modal
  components/assessment/# question list + answer highlighter
  lib/gemini.ts         # extraction / mapping / grading pipeline
  lib/pdf.ts            # client PDF/image helpers
  lib/demo-data.ts      # offline demo assessment
```

## Submission notes

- **AI model/API:** Google Gemini `gemini-3.6-flash` (free tier) via `@google/generative-ai`
- **GitHub:** https://github.com/nkrider7/veda-ai-assessment
- **Live URL:** Deploy with the Vercel button above, then paste the `.vercel.app` URL into the form
- **Approach:** Client converts PDF/images → Gemini extracts ordered questions (sub-parts split) → Gemini finds answer boxes `[ymin,xmin,ymax,xmax]` (0–1000) and maps out-of-order answers → Gemini grades + feedback → side-by-side review with green highlights
