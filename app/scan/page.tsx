"use client";

import { useEffect, useState } from "react";
import QRScanner from "@/components/QRScanner";
import CardView from "@/components/CardView";

type Card = Parameters<typeof CardView>[0]["card"];

async function fetchCard(cardId: string, signal?: AbortSignal) {
  const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.card;
}

async function fetchCardOrig(cardId: string, signal?: AbortSignal): Promise<Card> {
  // Try a couple common API shapes. Adjust if your app uses a different endpoint.
  const candidates = [
    `/api/cards/${encodeURIComponent(cardId)}`,
    `/api/cards?id=${encodeURIComponent(cardId)}`,
  ];

  let lastError: any = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();

      // Accept either {card: {...}} or the card object directly.
      const card = (json?.card ?? json) as Card;
      if (!card?.id) throw new Error("Response did not include a card.");
      return card;
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError ?? new Error("Unable to load card.");
}

export default function ScanPage() {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannedCardId, setScannedCardId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // When we get a card id, fetch card details (so we don't navigate away and kill the camera)
  useEffect(() => {
    if (!scannedCardId) {
      setCard(null);
      setLoading(false);
      setLoadError(null);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setLoadError(null);

    fetchCard(scannedCardId, ac.signal)
      .then((c) => setCard(c))
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setLoadError(e?.message ?? "Failed to load card.");
        setCard(null);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [scannedCardId]);

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Rookie Run</h1>
      <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
        Open this page once while playing. It keeps the camera running and lets you scan card after card.
      </p>

      {!scannerStarted ? (
        <button
          onClick={() => setScannerStarted(true)}
          style={{
            background: "#0b0f17",
			color: "#ffffff",
			border: "1px solid rgba(255,255,255,0.08)",
            padding: "1rem 2rem",
            borderRadius: "0.5rem",            
            fontSize: "1.1rem",
            fontWeight: 500,
            cursor: "pointer",
            width: "100%",
            minHeight: "44px",
          }}
        >
          Start Scanner
        </button>
      ) : (
        <QRScanner
          onScanSuccess={(id) => setScannedCardId(id)}
          // Once the user clicked "Start Scanner", we can best-effort autoStart.
          // (Some iOS versions still require a tap; in that case the QRScanner shows Start Camera.)
          autoStart={true}
          // Pause decoding while the overlay is up (camera stays on).
          isPaused={!!scannedCardId}
        />
      )}

      {/* Result overlay (keeps scanner mounted + camera active) */}
      {scannedCardId ? (
		  <div
			style={{
			  position: "fixed",
			  inset: 0,
			  background: "rgba(0,0,0,0.6)",
			  display: "flex",
			  alignItems: "center",
			  justifyContent: "center",
			  padding: 16,
			  zIndex: 50,
			}}
		  >
			<div
			  style={{
				width: "100%",
				maxWidth: 760,
				background: "#fff",
				color: "#111827", // force readable text
				borderRadius: 12,
				overflow: "hidden",
				boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
			  }}
			>
			  {/* Content */}
			  <div style={{ padding: 16 }}>
				{loading ? (
				  <div style={{ padding: 24 }}>Loading…</div>
				) : loadError ? (
				  <div style={{ padding: 24 }}>
					<div style={{ fontWeight: 700, marginBottom: 8 }}>Couldn’t load that card</div>
					<div style={{ opacity: 0.85, marginBottom: 16 }}>{loadError}</div>
				  </div>
				) : card ? (
				  // Wrap to force text color even if CardView has light styles
				  <div style={{ color: "#111827" }}>
					<CardView card={card} showScanNext={false} />
				  </div>
				) : (
				  <div style={{ padding: 24 }}>No card found.</div>
				)}
			  </div>

			  {/* Bottom action */}
			  <div
				style={{
				  borderTop: "1px solid #eee",
				  padding: 16,
				  background: "#fff",
				}}
			  >
				<button
				  onClick={() => setScannedCardId(null)}
				  style={{
					width: "100%",
					minHeight: 44,
					backgroundColor: "#2563eb",
					color: "white",
					padding: "12px 14px",
					borderRadius: 10,
					border: "none",
					fontWeight: 700,
					cursor: "pointer",
				  }}
				>
				  Scan next athlete
				</button>
			  </div>
			</div>
		  </div>
		) : null}
    </div>
  );
}
