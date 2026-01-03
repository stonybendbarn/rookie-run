import sql from "@/lib/db";
import QRCode from "qrcode";

function getBaseUrl() {
  // Prefer an explicit env var if you set it
  if (process.env.BASE_URL) return process.env.BASE_URL;

  // Vercel provides VERCEL_URL like: "rookie-run.vercel.app"
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Local dev fallback
  return "http://localhost:3000";
}

export default async function PrintQrPage({
  searchParams,
}: {
  // Next can treat these as async in some builds
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;

  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const limit = 12;
  const offset = (page - 1) * limit;

  const rows = await sql`
    select id
    from cards
    where deck = 'Rookie Run'
    order by id asc
    limit ${limit} offset ${offset}
  `;

  const baseUrl = getBaseUrl();

  // Generate QR SVGs in parallel
  const cards = await Promise.all(
    rows.map(async (r: { id: string }) => {
      const url = `${baseUrl}/cards/${r.id}`;

      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0, // keep tight; we control padding in layout
        width: 220, // size inside each cell; tweak if needed
      });

      return { id: r.id, url, svg };
    })
  );

  return (
    <main style={{ padding: "0.25in" }}>
      <header style={{ marginBottom: "0.15in", fontFamily: "Arial, sans-serif" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Rookie Run — QR Fronts</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Page {page} (cards {offset + 1}–{offset + cards.length})
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.15in",
        }}
      >
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "0.12in",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "2.45in",
            }}
          >
            {/* Inline SVG (print-crisp) */}
            <div
              aria-label={`QR ${c.id}`}
              style={{ width: 220, height: 220 }}
              dangerouslySetInnerHTML={{ __html: c.svg }}
            />
            <div
              style={{
                marginTop: 8,
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
                letterSpacing: 0.3,
              }}
            >
              {c.id}
            </div>
          </div>
        ))}

        {/* If fewer than 12 cards returned (end of deck), keep grid stable */}
        {Array.from({ length: Math.max(0, 12 - cards.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              border: "1px dashed #eee",
              borderRadius: 8,
              minHeight: "2.45in",
            }}
          />
        ))}
      </section>

      {/* Print-friendly: hide header if you want truly blank cards */}
      <style>{`
        @page { size: Letter; margin: 0.25in; }
        @media print {
          header { display: none; }
          main { padding: 0; }
        }
      `}</style>
    </main>
  );
}
