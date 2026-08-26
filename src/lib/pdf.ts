"use client";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export function validateFile(file: File): string | null {
  if (
    !ACCEPTED.includes(file.type) &&
    !file.name.match(/\.(pdf|png|jpe?g|webp)$/i)
  ) {
    return "Only PDF or image files (PNG, JPG, WEBP) are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "File must be 10MB or smaller.";
  }
  return null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function pdfToImages(file: File, maxPages = 12): Promise<string[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const count = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    pages.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  return pages;
}

export async function fileToPages(file: File): Promise<{
  name: string;
  size: number;
  type: string;
  pageCount: number;
  pages: string[];
}> {
  const err = validateFile(file);
  if (err) throw new Error(err);

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const pages = isPdf ? await pdfToImages(file) : [await fileToDataUrl(file)];

  return {
    name: file.name,
    size: file.size,
    type: file.type || (isPdf ? "application/pdf" : "image/*"),
    pageCount: pages.length,
    pages,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
}

export async function compressDataUrl(
  dataUrl: string,
  maxWidth = 1100,
  quality = 0.72
): Promise<string> {
  if (!dataUrl.startsWith("data:image")) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
