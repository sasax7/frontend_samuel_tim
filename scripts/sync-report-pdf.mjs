import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE_URL =
  process.env.THESIS_PDF_SOURCE_URL ??
  "https://cdn.jsdelivr.net/gh/sasax7/htwg-latex@master/report.pdf";

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

async function main() {
  await mkdir(dirname(OUT_PATH), { recursive: true });

  const existing = await readIfExists(OUT_PATH);
  const existingHash = existing ? sha256(existing) : null;

  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download PDF: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const next = Buffer.from(arrayBuffer);
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
