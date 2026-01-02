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
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 300,
  });

  const svgWithLabel = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="translate(10,10)">
    ${qrSvg}
  </g>
  <text
    x="160"
    y="345"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="14"
    fill="#000"
  >
    ${card.id}
  </text>
</svg>
`.trim();

  const outFile = path.join(outDir, `${card.id}.svg`);
  fs.writeFileSync(outFile, svgWithLabel);

  console.log(`✅ ${card.id} -> ${url}`);
}

console.log("\nDone. SVG QR codes with Card ID saved to public/qr/");
