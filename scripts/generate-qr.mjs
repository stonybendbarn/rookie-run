import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const BASE_URL = process.env.BASE_URL || "https://rookie-run.vercel.app";

const cardsPath = path.join(process.cwd(), "data", "cards.json");
const outDir = path.join(process.cwd(), "public", "qr");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

for (const card of cards) {
  const url = `${BASE_URL}/cards/${card.id}`;
  const outFile = path.join(outDir, `${card.id}.png`);

  await QRCode.toFile(outFile, url, {
    width: 512,
    margin: 1,
  });

  console.log(`✅ ${card.id} -> ${url}`);
}

console.log(`\nDone. QR codes saved to: public/qr/`);
