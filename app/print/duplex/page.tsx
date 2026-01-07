import sql from "@/lib/db";
import QRCode from "qrcode";

export const runtime = "nodejs";

type BackCard = {
  id: string;
  sport: string;
  eventYear: number;
  playerName: string;
};

const LIMIT = 9; // 3x3
const COLS = 3;

// Poker card size
const CARD_W = 2.5; // inches (width)
const CARD_H = 3.5; // inches (height)

// Gutters for cutting
const GUTTER = 0.125; // 1/8 inch

// Letter portrait
const PAGE_W = 8.5;
const PAGE_H = 11;

const USED_W = COLS * CARD_W + (COLS - 1) * GUTTER; // 7.75
const USED_H = COLS * CARD_H + (COLS - 1) * GUTTER; // 10.75

const MARGIN_X = (PAGE_W - USED_W) / 2; // 0.375
const MARGIN_Y = (PAGE_H - USED_H) / 2; // 0.125

const QR_SIZE = 180;

function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Normalize sport label for display */
function sportLabel(sport: string) {
  const s = sport.trim().toUpperCase();
  switch (s) {
    case "BASEBALL":
      return "BASEBALL";
    case "BASKETBALL":
      return "BASKETBALL";
    case "FOOTBALL":
      return "FOOTBALL";
    case "HOCKEY":
      return "HOCKEY";
    case "OLYMPICS":
      return "OLYMPICS";
    case "TENNIS":
      return "TENNIS";
    case "GOLF":
      return "GOLF";
    default:
      return s || "SPORT";
  }
}

/** Your existing icon set (sport-specific). Update paths if yours differ. */
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

/**
 * Duplex-safe mirroring:
 * Most duplex printers mirror the back horizontally (long-edge flip).
 * Reverse each ROW so backs align after cutting.
 */
function mirrorForDuplex<T>(items: (T | null)[], columns: number): (T | null)[] {
  const out: (T | null)[] = [];
  for (let i = 0; i < items.length; i += columns) {
    out.push(...items.slice(i, i + columns).reverse());
  }
  return out;
}

export default async function PrintDuplexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; ids?: string }>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * LIMIT;

  const requestedIds =
    sp.ids
      ?.split(",")
      .map((x) => x.trim())
      .filter(Boolean) ?? null;

  let rows: BackCard[] = [];

  if (requestedIds && requestedIds.length) {
    const sliceIds = requestedIds.slice(offset, offset + LIMIT);

    if (sliceIds.length) {
      const dbRows = (await sql`
        select
          id,
          sport,
          event_year as "eventYear",
          athlete_name as "playerName"
        from cards
        where id = ANY(${sliceIds})
      `) as BackCard[];

      // Preserve requested order
      const byId = new Map(dbRows.map((r) => [r.id, r]));
      rows = sliceIds.map((id) => byId.get(id)).filter(Boolean) as BackCard[];
    }
  } else {
    rows = (await sql`
      select
        id,
        sport,
        event_year as "eventYear",
        athlete_name as "playerName"
      from cards
      where deck = 'Rookie Run'
      order by id asc
      limit ${LIMIT} offset ${offset}
    `) as BackCard[];
  }

  // Pad to full 9 slots so duplex mirroring stays aligned
  const padded: (BackCard | null)[] = [
    ...rows,
    ...Array.from({ length: Math.max(0, LIMIT - rows.length) }, () => null),
  ];

  const backs = mirrorForDuplex(padded, COLS);

  const baseUrl = getBaseUrl();

  // Fronts need sport label + QR (no ID)
  const fronts = await Promise.all(
    padded.map(async (r) => {
      if (!r) return null;
      const url = `${baseUrl}/cards/${r.id}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        width: QR_SIZE,
      });
      return { id: r.id, sport: r.sport, svg };
    })
  );

  // Cut line positions (centered in gutters)
  const cutV1 = MARGIN_X + CARD_W + GUTTER / 2;
  const cutV2 = MARGIN_X + 2 * CARD_W + 1 * GUTTER + GUTTER / 2;

  const cutH1 = MARGIN_Y + CARD_H + GUTTER / 2;
  const cutH2 = MARGIN_Y + 2 * CARD_H + 1 * GUTTER + GUTTER / 2;

  return (
    <div className="page">
      <style>{`
        @page { size: Letter portrait; margin: 0; }
        @media print {
          .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { margin: 0; }
        }

        /* Use real inches so print preview matches reality */
        .page {
          width: ${PAGE_W}in;
          height: ${PAGE_H}in;
          background: #fff;
          font-family: Arial, sans-serif;
          /* On-screen centering only (print overrides above) */
          margin: 0 auto;
        }

        .wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          padding-left: ${MARGIN_X}in;
          padding-right: ${MARGIN_X}in;
          padding-top: ${MARGIN_Y}in;
          padding-bottom: ${MARGIN_Y}in;
          box-sizing: border-box;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(${COLS}, ${CARD_W}in);
          grid-template-rows: repeat(${COLS}, ${CARD_H}in);
          column-gap: ${GUTTER}in;
          row-gap: ${GUTTER}in;
        }

        .card {
          box-sizing: border-box;
          border-radius: 0.125in;
          background: #fff;
          overflow: hidden;
        }

        /* FRONT (QR side) */
        .frontCard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0.12in;
          gap: 0.10in;
        }

        .sportHeader {
          width: 100%;
          text-align: center;
          font-weight: 800;
          letter-spacing: 0.10em;
          font-size: 14px;
          padding: 0.06in 0.04in;
          border: 1px solid #ddd;
          border-radius: 0.10in;
        }

        .qrWrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          width: 100%;
        }

        .qr {
          width: ${QR_SIZE}px;
          height: ${QR_SIZE}px;
        }

        /* BACK (answer side) */
        .backCard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 0.15in;
        }

        .year {
          font-size: 40px;
          font-weight: 700;
          line-height: 1;
          margin-top: 0.05in;
          color: rgba(0, 0, 0, 0.20);
        }

        .name {
          font-size: 18px;
          font-weight: 500;
          text-align: center;
          margin: 0.04in 0 0.02in 0;
          color: #111;
        }

        .id {
          margin-top: 0.02in;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          display: inline-block;
          color: #111;
        }

        .icon {
          width: 1.10in;
          height: 1.10in;
          margin-bottom: 0.02in;
          flex-shrink: 0;
        }

        /* Cut lines */
        .cut {
          position: absolute;
          background: rgba(0,0,0,0.22);
          pointer-events: none;
        }
        .cutV {
          top: ${MARGIN_Y}in;
          bottom: ${MARGIN_Y}in;
          width: 1px;
        }
        .cutH {
          left: ${MARGIN_X}in;
          right: ${MARGIN_X}in;
          height: 1px;
        }

        .sheetBreak {
          page-break-after: always;
          break-after: page;
        }
      `}</style>

      {/* PAGE 1: FRONTS */}
      <div className="wrapper sheetBreak">
        <div className="grid">
          {fronts.map((c, i) =>
            c ? (
              <div key={`f-${i}`} className="card frontCard">
                <div className="sportHeader">{sportLabel(c.sport)}</div>
                <div className="qrWrap">
                  <div className="qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
                </div>
                {/* NO ID on front */}
              </div>
            ) : (
              <div key={`f-${i}`} className="card" />
            )
          )}
        </div>

        {/* 2 vertical + 2 horizontal cut lines */}
        <div className="cut cutV" style={{ left: `${cutV1}in` }} />
        <div className="cut cutV" style={{ left: `${cutV2}in` }} />
        <div className="cut cutH" style={{ top: `${cutH1}in` }} />
        <div className="cut cutH" style={{ top: `${cutH2}in` }} />
      </div>

      {/* PAGE 2: BACKS */}
      <div className="wrapper">
        <div className="grid">
          {backs.map((c, i) =>
            c ? (
              <div key={`b-${i}`} className="card backCard">
                <div className="year">{c.eventYear}</div>
                <div className="name">{c.playerName}</div>

                {/* Keep or remove ID on back (helpful during build/playtest) */}
                <div className="id">{c.id}</div>

                {/* Sport logo back (100% legit, as you said) */}
                <img className="icon" src={sportToIconPath(c.sport)} alt={c.sport} />
              </div>
            ) : (
              <div key={`b-${i}`} className="card" />
            )
          )}
        </div>

        {/* 2 vertical + 2 horizontal cut lines */}
        <div className="cut cutV" style={{ left: `${cutV1}in` }} />
        <div className="cut cutV" style={{ left: `${cutV2}in` }} />
        <div className="cut cutH" style={{ top: `${cutH1}in` }} />
        <div className="cut cutH" style={{ top: `${cutH2}in` }} />
      </div>
    </div>
  );
}
