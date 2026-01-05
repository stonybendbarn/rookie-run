// app/api/cards/[cardId]/route.ts
import { NextResponse } from "next/server";
import sql from "@/lib/db";

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

export async function GET(
  _req: Request,
  { params }: { params: { cardId: string } }
) {
  const cardId = params.cardId;

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

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}
