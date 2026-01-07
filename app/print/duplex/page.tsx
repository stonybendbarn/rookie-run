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

// Card size (poker)
const CARD_W = 2.5; // inches
const CARD_H = 3.5; // inches

// Gutters between cards (cut-safe)
const GUTTER = 0.125; // 1/8 inch

// Outer margins (computed for Letter portrait)
// Letter width = 8.5, height = 11
const PAGE_W = 8.5;
const PAGE_H = 11;

const USED_W = COLS * CARD_W + (COLS - 1) * GUTTER; // 3*2.5 + 2*0.125 = 7.75
const USED_H = COLS * CARD_H + (COLS - 1) * GUTTER; // 3*3.5 + 2*0.125 = 10.75

const MARGIN_X = (PAGE_W - USED_W) / 2; // 0.375
const MARGIN_Y = (PAGE_H - USED_H) / 2; // 0.125

const QR_SIZE = 180;

// Optional: keep color strip mapping (backs)
function sportToColor(sport: string) {
  const s = sport.trim().toUpperCase();
  switch (s) {
    case "BASEBALL":
      return "#C62828"; // red
    case "BASKETBALL":
      return "#EF6C00"; // orange
    case "FOOTBALL":
      return "#6D4C41"; // brown
    case "HOCKEY":
      return "#000000"; // black
    case "OLYMPICS":
      return "#C9A227"; // gold
    case "TENNIS":
      return "#FBC02D"; // yellow
    case "GOLF":
      return "#2E7D32"; // green
    default:
      return "#999999";
  }
}

function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Duplex printers typically mirror the back side horizontally.
 * For a grid, reverse each ROW.
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

  // Pad to full 9 slots
  const padded: (BackCard | null)[] = [
    ...rows,
    ...Array.from({ length: Math.max(0, LIMIT - rows.length) }, () => null),
  ];

  // Duplex-safe ordering for backs
  const backs = mirrorForDuplex(padded, COLS);

  const baseUrl = getBaseUrl();

  const fronts = await Promise.all(
    padded.map(async (r) => {
      if (!r) return null;
      const url = `${baseUrl}/cards/${r.id}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        width: QR_SIZE,
      });
      return { id: r.id, svg };
    })
  );

  // Cut line positions: centered in gutters
  // After col 1 and col 2:
  // x = margin + cardW + gutter/2
  // x = margin + 2*cardW + 1*gutter + gutter/2
  const cutV1 = MARGIN_X + CARD_W + GUTTER / 2;
  const cutV2 = MARGIN_X + 2 * CARD_W + 1 * GUTTER + GUTTER / 2;

  // After row 1 and row 2:
  const cutH1 = MARGIN_Y + CARD_H + GUTTER / 2;
  const cutH2 = MARGIN_Y + 2 * CARD_H + 1 * GUTTER + GUTTER / 2;

  return (
    <div className="page">
      <style>{`
        @page { size: Letter portrait; margin: 0; }
        @media print {
          .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .page {
          width: ${PAGE_W}in;
          height: ${PAGE_H}in;
          font-family: Arial, sans-serif;
          background: #fff;
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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* FRONT: QR only (NO ID) */
        .frontCard {
          padding: 0.15in;
        }

        .qr {
          width: ${QR_SIZE}px;
          height: ${QR_SIZE}px;
        }

        /* BACK: portrait layout */
        .backCard {
          padding: 0.15in;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .strip {
          width: 100%;
          height: 0.25in;
          border-radius: 0.09in;
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
          margin: 0.05in 0 0 0;
          color: #111;
        }

        .id {
          margin-top: 0.05in;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          display: inline-block;
        }

        /* Cut lines */
        .cut {
          position: absolute;
          background: rgba(0,0,0,0.25);
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
                <div className="qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
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
                <div className="strip" style={{ background: sportToColor(c.sport) }} />
                <div className="year">{c.eventYear}</div>
                <div className="name">{c.playerName}</div>
                <div className="id">{c.id}</div>
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
