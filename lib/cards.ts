import fs from "fs";
import path from "path";

export type Card = {
  id: string;
  athleteName: string;
  sport: string;
  rookieYear: number;
  notes?: string;
};

function readCardsFile(): Card[] {
  const filePath = path.join(process.cwd(), "data", "cards.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Card[];
}

export function getAllCards(): Card[] {
  return readCardsFile();
}

export function getCardById(cardId: string): Card | undefined {
  return readCardsFile().find((c) => c.id === cardId);
}
