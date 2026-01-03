import sql from "@/lib/db";

export const runtime = "nodejs"; // keep it simple for now

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  // If env isn't present, don't even try querying
  if (!hasDatabaseUrl) {
    return Response.json(
      { ok: false, hasDatabaseUrl, error: "Missing DATABASE_URL" },
      { status: 500 }
    );
  }

  // Non-sensitive identifiers + counts (safe to expose temporarily)
  const dbInfo = await sql`
    select
      current_database() as database,
      current_user as user,
      inet_server_addr()::text as server_addr
  `;

  const countRows = await sql`select count(*)::int as count from cards`;

  return Response.json({
    ok: true,
    hasDatabaseUrl,
    db: dbInfo[0],
    cardsCount: countRows[0]?.count ?? null,
  });
}
