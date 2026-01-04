import sql from "@/lib/db";
import QRCode from "qrcode";

export const runtime = "nodejs";

const LIMIT = 12;

// Built-in scale so you can print at 100% and still fit.
// If you want to keep using printer scaling at 90%, set this to 1.
const PRINT_SCALE = 0.9;

// Slightly smaller QR so we always have room for the ID footer
const QR_SIZE = 200;

function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function PrintQrPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;

  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const offset = (page - 1) * LIMIT;

  const rows = (await sql`
    select id
    from cards
    where deck = 'Rookie Run'
    order by id asc
    limit ${LIMIT} offset ${offset}
  `) as Array<{ id: string }>;

  const baseUrl = getBaseUrl();

  const cards = await Promise.all(
    rows.map(async (r) => {
      const url = `${baseUrl}/cards/${r.id}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        width: QR_SIZE,
      });
      return { id: r.id, url, svg };
    })
  );

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

          /* Reserve a footer row so the ID never gets clipped */
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
        }
      `}</style>

      <div className="scale">
        <div className="grid">
          {cards.map((c) => (
            <div key={c.id} className="card">
              <div
                className="qr"
                aria-label={`QR ${c.id}`}
                dangerouslySetInnerHTML={{ __html: c.svg }}
              />
              <div className="id">{c.id}</div>
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
