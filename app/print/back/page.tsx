import sql from "@/lib/db";

type Card = {
  id: string;
  sport: string; // BASEBALL | FOOTBALL | BASKETBALL | HOCKEY | OLYMPICS | TENNIS | GOLF
  eventYear: number; // year printed on the back
};

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
      // Fallback icon if something unexpected sneaks in
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
  const limit = 12;
  const offset = (page - 1) * limit;

  const rows = await sql`
    select
      id,
      sport,
      event_year as "eventYear"
    from cards
    where deck = 'Rookie Run'
    order by id asc
    limit ${limit} offset ${offset}
  `;

  const cards = rows as Card[];

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

        /* One “card back” cell */
        .card {
          border: 1px solid #000; /* helpful cut guide for dry run; remove later */
          display: flex;
          flex-direction: column;
          justify-content: space-between; /* pushes year top + icon bottom */
          align-items: center;
          padding: 0.2in 0.15in;
          page-break-inside: avoid;
          background: #fff;
        }

        .year {
		  font-size: 56px;
		  font-weight: 800;
		  line-height: 1;
		  margin-top: 0.05in;
		  color: #666; /* darker = prints better */
		}

        .icon {
          width: 1.35in;
          height: 1.35in;
          margin-bottom: 0.05in;
        }

        /* Optional tiny ID for sorting/debug; comment out if you don't want it */
        .id {
          font-size: 10px;
          opacity: 0.65;
          margin-top: 0.05in;
        }
      `}</style>

      <div className="grid">
        {cards.map((card) => (
          <div key={card.id} className="card">
            <div>
              <div className="year">{card.eventYear}</div>
              <div className="id">{card.id}</div>
            </div>

            <img
              className="icon"
              src={sportToIconPath(card.sport)}
              alt={card.sport}
            />
          </div>
        ))}

        {/* Keep the grid stable if the last page has < 12 cards */}
        {Array.from({ length: Math.max(0, 12 - cards.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="card" style={{ borderStyle: "dashed", opacity: 0.25 }} />
        ))}
      </div>
    </div>
  );
}
