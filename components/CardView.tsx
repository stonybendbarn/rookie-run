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
  /** Theme for display context (cards page vs scan modal) */
  theme?: "light" | "dark";
}

/**
 * Display-only card view.
 * (No scanner logic in here — scanning is owned by /scan.)
 */
export default function CardView({ card, showScanNext = true, theme = "light" }: CardViewProps) {
  const isDark = theme === "dark";

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: 720,
        margin: "0 auto",
        // In scan modal we want the modal to own the background.
        backgroundColor: isDark ? "transparent" : "#fff",
        color: isDark ? "#ffffff" : "#111827",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{card.athleteName}</h1>

      <p style={{ marginTop: 0, opacity: isDark ? 0.8 : 0.8 }}>{card.sport}</p>

      {card.athleteBlurb ? (
        <p style={{ marginTop: "1rem", lineHeight: 1.5, opacity: isDark ? 0.95 : 1 }}>
          {card.athleteBlurb}
        </p>
      ) : null}

      {card.source_url ? (
        <p style={{ marginTop: "1.5rem", opacity: isDark ? 0.85 : 0.8 }}>
          Source:{" "}
          <a
            href={card.source_url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: isDark ? "#93c5fd" : "#2563eb",
              textDecoration: "underline",
            }}
          >
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
              fontWeight: 700,
              width: "100%",
              textDecoration: "none",
              minHeight: 44,
            }}
          >
            Scan next athlete
          </Link>
        </div>
      ) : null}

      {/* Card ID is useful on the /cards page, but it looks bad in the scan modal */}
      {!isDark ? (
        <>
          <hr style={{ margin: "2rem 0" }} />
          <p style={{ opacity: 0.25 }}>
            Card ID: <code>{card.id}</code>
          </p>
        </>
      ) : null}
    </main>
  );
}
