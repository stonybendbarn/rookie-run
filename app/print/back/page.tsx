import sql from "@/lib/db";

type Card = {
  id: string;
  sport: string;
  eventYear: number;
  playerName: string;
};

const LIMIT = 12;

// Built-in scale so you can print at 100% and still fit.
// If you want to keep using printer scaling at 90%, set this to 1.
const PRINT_SCALE = 0.9;

function sportToIconPath(sport: string) {
  const s = sport.trim().toUpperCase();
  switch (s) {
    case "BASEBALL":
      return "/icons/baseball.svg";
    case "FOOTBALL":
      return "/icons/football.svg";
    case "BASKETBALL":
      return "/icons/basketball.svg";
    case "HOCKEY":
      return "/icons/hockey.svg";
    case "OLYMPICS":
      return "/icons/olympics.svg";
    case "TENNIS":
      return "/icons/tennis.svg";
    case "GOLF":
      return "/icons/golf.svg";
    default:
      return "/icons/sports.svg";
  }
}

export default async function PrintBacksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;

  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const offset = (page - 1) * LIMIT;

  const rows = await sql`
    select
      id,
      sport,
      event_year as "eventYear",
      athlete_name as "playerName"
    from cards
    where deck = 'Rookie Run'
    order by id asc
    limit ${LIMIT} offset ${offset}
  `;

  const cards = rows as Card[];

  return (
    <div className="page">
      <style>{`
        @page { size: Letter; margin: 0.25in; }
        @media print {
          .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .page { font-family: Arial, sans-serif; }

        .scale {
          transform: scale(${PRINT_SCALE});
          transform-origin: top left;
          width: calc(100% / ${PRINT_SCALE});
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 2.45in;
          gap: 0.15in;
        }

        .card {
          box-sizing: border-box;
          border: 1px solid #ddd; /* cut guide for now; remove later */
          border-radius: 8px;
          padding: 0.10in;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          overflow: hidden;
        }

        .year {
          font-size: 40px;
          font-weight: 700;
          line-height: 1;
          margin-top: 0.05in;
          color: rgba(0, 0, 0, 0.20);
        }

        .name {
          font-size: 20px;
          font-weight: 500;
          text-align: center;
          margin: 0.08in 0 0.02in 0;
          color: #111;
        }

        .id {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #000;
          line-height: 1;
          padding: 3px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          margin-bottom: 0.06in;
        }

        .icon {
          width: 1.15in;
          height: 1.15in;
          margin-bottom: 0.12in;
          flex-shrink: 0;
        }
      `}</style>

      <div className="scale">
        <div className="grid">
          {cards.map((card) => (
            <div key={card.id} className="card">
              <div className="year">{card.eventYear}</div>
              <div className="name">{card.playerName}</div>
              <div className="id">{card.id}</div>
              <img className="icon" src={sportToIconPath(card.sport)} alt={card.sport} />
            </div>
          ))}

          {Array.from({ length: Math.max(0, 12 - cards.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="card"
              style={{ borderStyle: "dashed", opacity: 0.25 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
