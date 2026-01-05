// app/cards/[cardId]/page.tsx
import sql from "@/lib/db";
import CardView from "@/components/CardView";

type Card = {
  id: string;
  sport: string;
  athleteName: string;
  athleteBlurb: string | null;
  rookieYear: number;
  event_label: string | null;
  league: string | null;
  source_url: string | null;
};

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

  const card = rows[0] as Card | undefined;
  if (!card) return <div>Card not found</div>;

  return <CardView card={card} />;
}
