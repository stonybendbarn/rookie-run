import sql from "@/lib/db";
import QRCode from "qrcode";

export const runtime = "nodejs";

type BackCard = {
  id: string;
  sport: string;
  eventYear: number;
  playerName: string;
};

const LIMIT = 12;

// Built-in scale so you can print at 100% and still fit.
// If you want to keep using printer scaling at 90%, set this to 1.
const PRINT_SCALE = 0.9;

const QR_SIZE = 200;
const COLS = 3;

function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

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
 * Duplex printers typically mirror the back side horizontally.
 * For a grid, that means each ROW on the back must be reversed so that
 * the physical print lines up with the front after flipping.
 *
 * IMPORTANT: this must be applied to the FULL GRID (including empty slots),
 * otherwise partial rows shift columns.
 */
function mirrorForDuplex<T>(items: T[], columns: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < items.length; i += columns) {
    const row = items.slice(i, i + columns);
    out.push(...row.reverse());
  }
  return out;
}

/** Pads to exactly `size` slots so empties participate in duplex mirroring. */
function padToSize<T>(items: T[], size: number, fill: T): T[] {
  if (items.length >= size) return items.slice(0, size);
  return items.concat(Array.from({ length: size - items.length }, () => fill));
}

function parseIdsParam(idsRaw?: string): string[] | null {
  if (!idsRaw) return null;
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : null;
}

export default async function PrintDuplexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; ids?: string }>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * LIMIT;

  const requestedIds = parseIdsParam(sp.ids);

  let backRows: BackCard[] = [];

  if (requestedIds) {
    // Take the 12-card slice for this page from the requested list
    const sliceIds = requestedIds.slice(offset, offset + LIMIT);

    if (sliceIds.length > 0) {
      // Query only those IDs
      const rows = (await sql`
        select
          id,
          sport,
          event_year as "eventYear",
          athlete_name as "playerName"
        from cards
        where id = ANY(${sliceIds})
      `) as BackCard[];

      // Preserve the exact slice order (SQL doesn't guarantee order for ANY())
      const byId = new Map(rows.map((r) => [r.id, r]));
      backRows = sliceIds.map((id) => byId.get(id)).filter(Boolean) as BackCard[];
    } else {
      backRows = [];
    }
  } else {
    // Original behavior: 12 cards per page in id order
    backRows = (await sql`
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

  const baseUrl = getBaseUrl();

  const fronts = await Promise.all(
    backRows.map(async (r) => {
      const url = `${baseUrl}/cards/${r.id}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        width: QR_SIZE,
      });
      return { id: r.id, svg };
    })
  );

  // Build a full 12-slot grid INCLUDING empties, then mirror rows.
  const backGridPadded = padToSize<BackCard | null>(backRows, LIMIT, null);
  const backGridDuplexSafe = mirrorForDuplex(backGridPadded, COLS);

  return (
    <div className="page">
      <style>{`
        @page { size: Letter; margin: 0.25in; }
        @media print {
          .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .page { font-family: Arial, sans-serif; }

        /* scale wrapper so you can print at 100% */
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
          background: #fff;
          overflow: hidden;
        }

        /* FRONT card layout: reserve footer for ID */
        .frontCard {
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: center;
          justify-items: center;
        }

        .qr {
          width: ${QR_SIZE}px;
          height: ${QR_SIZE}px;
        }

        .id {
          margin-top: 6px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #000;
          line-height: 1;
          padding: 3px 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          display: inline-block;
        }

        /* BACK card layout */
        .backCard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
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

        .icon {
          width: 1.15in;
          height: 1.15in;
          margin-bottom: 0.12in;
          flex-shrink: 0;
        }

        /* Force a page break between FRONT sheet and BACK sheet */
        .sheetBreak {
          page-break-after: always;
          break-after: page;
        }
      `}</style>

      <div className="scale">
        {/* PAGE 1: FRONTS */}
        <div className="grid sheetBreak">
          {fronts.map((c) => (
            <div key={c.id} className="card frontCard">
              <div
                className="qr"
                aria-label={`QR ${c.id}`}
                dangerouslySetInnerHTML={{ __html: c.svg }}
              />
              <div className="id">{c.id}</div>
            </div>
          ))}

          {Array.from({ length: Math.max(0, 12 - fronts.length) }).map((_, i) => (
            <div
              key={`front-empty-${i}`}
              className="card"
              style={{ borderStyle: "dashed", opacity: 0.25 }}
            />
          ))}
        </div>

        {/* PAGE 2: BACKS (duplex-safe ordering INCLUDING empties) */}
        <div className="grid">
          {backGridDuplexSafe.map((card, i) =>
            card ? (
              <div key={card.id} className="card backCard">
                <div className="year">{card.eventYear}</div>
                <div className="name">{card.playerName}</div>
                <div className="id">{card.id}</div>
                <img className="icon" src={sportToIconPath(card.sport)} alt={card.sport} />
              </div>
            ) : (
              <div
                key={`back-empty-${i}`}
                className="card"
                style={{ borderStyle: "dashed", opacity: 0.25 }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
