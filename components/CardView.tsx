"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRScanner from "./QRScanner";

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
}

export default function CardView({ card }: CardViewProps) {
  const searchParams = useSearchParams();
  const [showScanner, setShowScanner] = useState(searchParams?.get("scan") === "true");
  const router = useRouter();

  // Auto-open scanner when scan parameter is present
  useEffect(() => {
    const shouldShow = searchParams?.get("scan") === "true";
    if (shouldShow && !showScanner) {
      console.log("Auto-opening scanner from URL parameter");
      setShowScanner(true);
    }
  }, [searchParams]);

  const handleScanSuccess = (cardId: string) => {
    try {
      console.log("CardView: handleScanSuccess called with cardId:", cardId);
      // Don't close scanner - keep it open for continuous scanning
      // Use router.push for smooth navigation without page reload
      router.push(`/cards/${cardId}?scan=true`);
    } catch (error: any) {
      console.error("Error in CardView handleScanSuccess:", error);
      // Fallback navigation
      router.push(`/cards/${cardId}?scan=true`);
    }
  };

  return (
    <>
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

        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={() => setShowScanner(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
          >
            Scan Next Athlete
          </button>
        </div>

        <hr style={{ margin: "2rem 0" }} />

        <p style={{ opacity: 0.1 }}>
          Card ID: <code>{card.id}</code>
        </p>
      </main>

      {showScanner && (
        <QRScanner
          key={`scanner-${card.id}-${searchParams?.get("scan")}`} // Force remount to ensure clean state
          onScanSuccess={handleScanSuccess}
          onClose={() => {
            setShowScanner(false);
            // Remove scan param from URL when closing
            router.replace(`/cards/${card.id}`);
          }}
          autoStart={searchParams?.get("scan") === "true"}
        />
      )}
    </>
  );
}
