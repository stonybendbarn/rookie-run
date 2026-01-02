import fs from "fs";
import path from "path";

type Card = { id: string };

export default function PrintQrPage() {
  const filePath = path.join(process.cwd(), "data", "cards.json");
  const cards: Card[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return (
    <div className="page">
      <style>{`
        @page { size: letter; margin: 0.5in; }
        .page { font-family: Arial, sans-serif; }
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
        .qr {
          width: 2in;
          height: 2in;
        }
        .id {
          margin-top: 6px;
          font-size: 12px;
        }
      `}</style>

      <div className="grid">
        {cards.map((card) => (
          <div key={card.id} className="cell">
            <img className="qr" src={`/qr/${card.id}.svg`} alt={card.id} />
            <div className="id">{card.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
