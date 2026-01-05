"use client";

import Link from "next/link";

interface Card {
  id: string;
  sport: string;
  athleteName: string;
  athleteBlurb: string | null;
  rookieYear: number;
  event_label: string | null;
  league: string | null;
  source_url: string | null;
}

interface CardViewProps {
  card: Card;
  /** Optional: show the "Scan next athlete" button (useful in gameplay overlay). */
  showScanNext?: boolean;
}

/**
 * Display-only card view.
 * (No scanner logic in here — scanning is owned by /scan.)
 */
export default function CardView({ card, showScanNext = true }: CardViewProps) {
  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto", backgroundColor: "#fff", color: "#111827",}}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{card.athleteName}</h1>

      <p style={{ marginTop: 0, opacity: 0.8 }}>{card.sport}</p>

      {card.athleteBlurb ? (
        <p style={{ marginTop: "1rem", lineHeight: 1.5 }}>{card.athleteBlurb}</p>
      ) : null}

      {card.source_url ? (
        <p style={{ marginTop: "1.5rem", opacity: 0.8 }}>
          Source:{" "}
          <a href={card.source_url} target="_blank" rel="noreferrer">
            {card.source_url}
          </a>
        </p>
      ) : null}

      {showScanNext ? (
        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/scan"
            style={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              width: "100%",
              textDecoration: "none",
            }}
          >
            Scan next athlete
          </Link>
        </div>
      ) : null}

      <hr style={{ margin: "2rem 0" }} />

      <p style={{ opacity: 0.1 }}>
        Card ID: <code>{card.id}</code>
      </p>
    </main>
  );
}
