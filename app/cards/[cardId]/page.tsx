// app/cards/[cardId]/page.tsx
import sql from "@/lib/db";
import CardView from "@/components/CardView";

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

  return <CardView card={card} />;
}
