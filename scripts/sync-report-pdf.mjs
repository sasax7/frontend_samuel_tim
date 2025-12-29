import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE_URLS = (
  process.env.THESIS_PDF_SOURCE_URLS ??
  process.env.THESIS_PDF_SOURCE_URL ??
  "https://cdn.jsdelivr.net/gh/sasax7/htwg-latex@master/report.pdf,https://raw.githubusercontent.com/sasax7/htwg-latex/master/report.pdf"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TIMEOUT_MS = Number(process.env.THESIS_PDF_TIMEOUT_MS ?? 30_000);
const RETRIES = Number(process.env.THESIS_PDF_RETRIES ?? 3);

const OUT_PATH = resolve("public", "report.pdf");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readIfExists(path) {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadPdf() {
  let lastError;

  for (const url of SOURCE_URLS) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const response = await fetchWithTimeout(url, TIMEOUT_MS);
        if (!response.ok) {
          throw new Error(
            `Failed to download PDF from ${url}: ${response.status} ${response.statusText}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        return { url, buffer: Buffer.from(arrayBuffer) };
      } catch (err) {
        lastError = err;
        const isLastAttempt = attempt === RETRIES;
        const delay = Math.min(10_000, 500 * 2 ** (attempt - 1));

        if (!isLastAttempt) {
          console.warn(
            `Download failed (attempt ${attempt}/${RETRIES}) from ${url}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
        } else {
          console.warn(
            `Download failed from ${url} after ${RETRIES} attempts.`
          );
        }
      }
    }
  }

  throw lastError ?? new Error("Failed to download PDF from all sources");
}

async function main() {
  await mkdir(dirname(OUT_PATH), { recursive: true });

  const existing = await readIfExists(OUT_PATH);
  const existingHash = existing ? sha256(existing) : null;

  let next;
  try {
    const result = await downloadPdf();
    next = result.buffer;
  } catch (err) {
    if (existing) {
      console.warn(
        "Warning: could not download latest PDF; using existing public/report.pdf"
      );
      return;
    }

    throw err;
  }

  const nextHash = sha256(next);

  if (existingHash === nextHash) {
    console.log("report.pdf unchanged");
    return;
  }

  await writeFile(OUT_PATH, next);
  console.log(`Updated public/report.pdf (sha256 ${nextHash})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
