/**
 * On-device OCR fallback with Tesseract.js (Apache-2.0). Used when no model is
 * connected or the model can't read the image. The screenshot never leaves the
 * phone; only the extracted text is sent for checking. Loaded on demand, so the
 * ~3 MB of OCR code and English data is only downloaded when someone uploads a screenshot.
 */
export async function readTextOnDevice(image: string, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return unwrap(data.text);
  } finally {
    await worker.terminate();
  }
}

/**
 * Chat bubbles wrap mid-sentence, and OCR keeps those line breaks, which can split
 * a link ("bvn-" / "update.com"). Rejoin lines that clearly continue.
 */
export function unwrap(raw: string): string {
  return raw
    .replace(/[ \t]+\n/g, "\n")
    .replace(/([\w/])-\n(?=\w)/g, "$1-")
    .replace(/([^\n.!?:])\n(?=[a-z0-9(])/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
