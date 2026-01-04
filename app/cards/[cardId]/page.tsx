// app/cards/[cardId]/page.tsx
import sql from "@/lib/db";

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;

  const rows = await sql`
    select
      id,
      sport,
      athlete_name as "athleteName",
      athlete_blurb as "athleteBlurb",
      event_year as "rookieYear",
      event_label,
      league,
      source_url
    from cards
    where id = ${cardId}
    limit 1
  `;

  const card = rows[0];
  if (!card) return <div>Card not found</div>;

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
        {card.athleteName}
      </h1>

      <p style={{ marginTop: 0, opacity: 0.8 }}>{card.sport}</p>

      {card.athleteBlurb ? (
        <p style={{ marginTop: "1rem", lineHeight: 1.5 }}>
          {card.athleteBlurb}
        </p>
      ) : null}

      <details style={{ marginTop: "1.5rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "1.1rem" }}>
          Reveal rookie year
        </summary>
        <p style={{ fontSize: "2.5rem", margin: "0.75rem 0 0" }}>
          {card.rookieYear}
        </p>
      </details>

      {card.source_url ? (
        <p style={{ marginTop: "1.5rem", opacity: 0.8 }}>
          Source:{" "}
          <a href={card.source_url} target="_blank" rel="noreferrer">
            {card.source_url}
          </a>
        </p>
      ) : null}

      <hr style={{ margin: "2rem 0" }} />

      <p style={{ opacity: 0.7 }}>
        Card ID: <code>{card.id}</code>
      </p>
    </main>
  );
}
