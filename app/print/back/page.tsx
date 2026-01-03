import sql from "@/lib/db";

type Card = {
  id: string;
  sport: string;
  eventYear: number; // rookie year (must be subtle)
  playerName: string;
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
      event_year as "eventYear",
      athlete_name as "playerName"
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

        .card {
          border: 1px solid #000; /* remove for final print */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 0.2in 0.15in;
          page-break-inside: avoid;
          background: #fff;
        }

        /* Rookie year – must NOT show through */
        .year {
		  font-size: 40px;
		  font-weight: 700;
		  line-height: 1;
		  margin-top: 0.05in;
		  color: rgba(0, 0, 0, 0.68); /* key change */
		}

        /* Player name – primary readable element */
        .name {
          font-size: 20px;
          font-weight: 500; /* medium */
          text-align: center;
          margin: 0.15in 0;
          color: #111;
        }

        .icon {
          width: 1.15in;
          height: 1.15in;
          margin-bottom: 0.15in;
        }
      `}</style>

      <div className="grid">
        {cards.map((card) => (
          <div key={card.id} className="card">
            <div className="year">{card.eventYear}</div>

            <div className="name">{card.playerName}</div>

            <img
              className="icon"
              src={sportToIconPath(card.sport)}
              alt={card.sport}
            />
          </div>
        ))}

        {/* pad grid to keep layout stable */}
        {Array.from({ length: Math.max(0, 12 - cards.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="card"
            style={{ borderStyle: "dashed", opacity: 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}

