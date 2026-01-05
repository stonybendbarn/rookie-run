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
  const endGame = () => {
	  setScannedCardId(null);
	  setCard(null);
	  setLoadError(null);
	  setLoading(false);
	  setScannerStarted(false); // unmounts <QRScanner /> -> camera stops
  };

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
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Rookie Run Scanner</h1>
      <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
        Open this page once while playing. It keeps the camera running and lets you scan card after card.
      </p>

      {!scannerStarted ? (
        <button
          onClick={() => setScannerStarted(true)}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "1rem 2rem",
            borderRadius: "0.5rem",
            border: "none",
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
			  background: "rgba(0,0,0,0.85)",
			  backdropFilter: "blur(2px)",
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
				background: "#0b0f17",
				color: "#ffffff",
				borderRadius: 16,
				overflow: "hidden",
				border: "1px solid rgba(255,255,255,0.08)",
				boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
			  }}
			>
			  {/* Content */}
			  <div style={{ padding: 16 }}>
				{loading ? (
				  <div style={{ padding: 24, opacity: 0.9 }}>Loading…</div>
				) : loadError ? (
				  <div style={{ padding: 24 }}>
					<div style={{ fontWeight: 800, marginBottom: 8 }}>Couldn’t load that card</div>
					<div style={{ opacity: 0.85, marginBottom: 16 }}>{loadError}</div>
				  </div>
				) : card ? (
				  <div style={{ color: "#ffffff" }}>
					<CardView card={card} showScanNext={false} theme="dark" />
				  </div>
				) : (
				  <div style={{ padding: 24, opacity: 0.9 }}>No card found.</div>
				)}
			  </div>

			  {/* Bottom actions */}
			  <div
				style={{
				  borderTop: "1px solid rgba(255,255,255,0.10)",
				  padding: 16,
				  display: "flex",
				  gap: 12,
				  background: "rgba(255,255,255,0.02)",
				}}
			  >
				<button
				  onClick={() => setScannedCardId(null)}
				  style={{
					flex: 1,
					minHeight: 48,
					backgroundColor: "#2563eb",
					color: "white",
					padding: "12px 14px",
					borderRadius: 12,
					border: "none",
					fontWeight: 800,
					cursor: "pointer",
				  }}
				>
				  Scan next athlete
				</button>

				<button
				  onClick={endGame}
				  style={{
					minWidth: 120,
					minHeight: 48,
					backgroundColor: "rgba(255,255,255,0.08)",
					color: "white",
					padding: "12px 14px",
					borderRadius: 12,
					border: "1px solid rgba(255,255,255,0.12)",
					fontWeight: 800,
					cursor: "pointer",
				  }}
				>
				  End game
				</button>
			  </div>
			</div>
		  </div>
		) : null}
    </div>
  );
}
