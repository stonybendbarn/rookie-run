import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "nova";
const TTS_INSTRUCTIONS =
  "Speak naturally in a polished U.S. sports-announcer style. Pronounce athlete names the way they are commonly pronounced in U.S. sports broadcasts. Keep the delivery smooth and conversational. Do not over-enunciate or pause unnaturally between syllables.";
const OUT_DIR = path.join(process.cwd(), "public", "audio", "cards");
const REQUEST_DELAY_MS = 200;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const force = argv.includes("--force");
  const selectedIds = [];

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] !== "--id") continue;

    const value = (argv[i + 1] ?? "").trim();
    if (!value) {
      throw new Error("Missing value for --id (example: --id RR-OLY-027)");
    }

    for (const part of value.split(",")) {
      const id = part.trim().toUpperCase();
      if (id && !selectedIds.includes(id)) selectedIds.push(id);
    }

    i += 1;
  }

  return { force, selectedIds: selectedIds.length ? selectedIds : null };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeMp3(text, apiKey) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      instructions: TTS_INSTRUCTIONS,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI TTS ${response.status}: ${detail.slice(0, 300)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function synthesizeWithRetry(text, apiKey, maxAttempts = 4) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await synthesizeMp3(text, apiKey);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /(?:429|500|502|503|504)/.test(message);

      if (!retryable || attempt === maxAttempts) break;
      await sleep(500 * attempt);
    }
  }

  throw lastError;
}

async function fetchCards(sql, selectedIds) {
  if (selectedIds?.length) {
    const rows = await sql`
      select id, spoken_intro
      from cards
      where deck = 'Rookie Run'
        and id = ANY(${selectedIds})
        and spoken_intro is not null
        and trim(spoken_intro) <> ''
    `;

    const byId = new Map(rows.map((row) => [row.id, row]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }

  return sql`
    select id, spoken_intro
    from cards
    where deck = 'Rookie Run'
      and spoken_intro is not null
      and trim(spoken_intro) <> ''
    order by id
  `;
}

loadEnvLocal();

const { force, selectedIds } = parseArgs(process.argv.slice(2));
const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.OPENAI_API_KEY;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sql = neon(databaseUrl);
const rows = await fetchCards(sql, selectedIds);

if (selectedIds?.length) {
  const foundIds = new Set(rows.map((row) => row.id));
  const missingIds = selectedIds.filter((id) => !foundIds.has(id));

  if (missingIds.length) {
    console.warn(`No matching cards with spoken_intro: ${missingIds.join(", ")}`);
  }

  if (rows.length === 0) {
    console.error("No selected cards could be generated.");
    process.exit(1);
  }
}

const totals = { generated: 0, skipped: 0, failed: 0 };

console.log(
  `Generating audio with ${TTS_MODEL} / ${TTS_VOICE} -> ${path.relative(process.cwd(), OUT_DIR)}`
);
const selectionLabel = selectedIds ? ` (ids=${selectedIds.join(", ")})` : "";
console.log(`Cards to process: ${rows.length}${force ? " (force)" : ""}${selectionLabel}\n`);

for (const row of rows) {
  const cardId = row.id;
  const text = String(row.spoken_intro ?? "").trim();
  const outFile = path.join(OUT_DIR, `${cardId}.mp3`);

  if (!text) {
    totals.failed += 1;
    console.log(`failed  ${cardId} (empty spoken_intro)`);
    continue;
  }

  if (!force && fs.existsSync(outFile)) {
    totals.skipped += 1;
    console.log(`skipped ${cardId} (exists)`);
    continue;
  }

  try {
    const mp3 = await synthesizeWithRetry(text, apiKey);
    fs.writeFileSync(outFile, mp3);
    totals.generated += 1;
    console.log(`generated ${cardId}`);
  } catch (error) {
    totals.failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`failed  ${cardId} (${message})`);
  }

  await sleep(REQUEST_DELAY_MS);
}

console.log("\nDone.");
console.log(`generated: ${totals.generated}`);
console.log(`skipped:   ${totals.skipped}`);
console.log(`failed:    ${totals.failed}`);
console.log(`total:     ${rows.length}`);

if (totals.failed > 0) {
  process.exit(1);
}
