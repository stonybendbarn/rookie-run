import fs from "fs";
import path from "path";

type Card = {
  id: string;
};

export default function PrintQrPage() {
  const filePath = path.join(process.cwd(), "data", "cards.json");
  const cards: Card[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return (
    <html>
      <head>
        <style>{`
          @page {
            size: letter;
            margin: 0.5in;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 2.5in;
            gap: 0.25in;
          }

          .cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
          }

          img {
            width: 2in;
            height: 2in;
