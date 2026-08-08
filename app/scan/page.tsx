"use client";

import { useEffect, useRef, useState } from "react";
import QRScanner from "@/components/QRScanner";
import CardView from "@/components/CardView";

type Card = Parameters<typeof CardView>[0]["card"];

function audioUrlForCard(cardId: string): string {
  return `/audio/cards/${encodeURIComponent(cardId.toUpperCase())}.mp3`;
}

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

  // ---- Audio / TTS ----
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const lastSpokenIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playGenRef = useRef(0);

  function stopAllAudio() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    u.volume = 1.0;

    const voices = synth.getVoices();
    const preferred =
      voices.find((v) => /en-US/i.test(v.lang) && /Google|Siri|Microsoft|Natural/i.test(v.name)) ||
      voices.find((v) => /en-US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));

    if (preferred) u.voice = preferred;

    synth.speak(u);
  }

  async function playCardAudio(cardId: string, fallbackText: string) {
    stopAllAudio();

    const gen = ++playGenRef.current;
    const audio = new Audio(audioUrlForCard(cardId));
    audioRef.current = audio;

    const mp3Ready = await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      audio.oncanplaythrough = () => finish(true);
      audio.onerror = () => finish(false);
      audio.load();

      window.setTimeout(() => finish(false), 8000);
    });

    if (gen !== playGenRef.current) return;

    if (mp3Ready && audioRef.current === audio) {
      try {
        await audio.play();
        return;
      } catch {
        // Fall through to browser TTS.
      }
    }

    if (gen !== playGenRef.current) return;

    const text = fallbackText.trim();
    if (text) speak(text);
  }

  const endGame = () => {
    stopAllAudio();
    playGenRef.current += 1;
    lastSpokenIdRef.current = null;

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

  useEffect(() => {
    return () => {
      stopAllAudio();
      playGenRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play pre-generated audio (or fall back to browser TTS) after the card loads.
  useEffect(() => {
    if (!ttsEnabled) return;
    if (!scannedCardId) return;
    if (!card) return;

    // Prevent double-play due to re-renders
    if (lastSpokenIdRef.current === scannedCardId) return;

    const text = ((card as any)?.spoken_intro ?? "").trim();
    lastSpokenIdRef.current = scannedCardId;
    void playCardAudio(card.id, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsEnabled, scannedCardId, card]);

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Rookie Run</h1>
      <p style={{ marginBottom: "1.0rem", opacity: 0.8 }}>
        Open this page once while playing. It keeps the camera running and lets you scan card after card.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", opacity: 0.9 }}>
        <input
          type="checkbox"
          checked={ttsEnabled}
          onChange={(e) => setTtsEnabled(e.target.checked)}
        />
        Speak athlete aloud
      </label>

      {!scannerStarted ? (
        <button
		  onClick={() => {
			  setScannerStarted(true);

			  // Prime audio playback for iOS Safari / Chrome / DuckDuckGo
			  if (typeof window !== "undefined") {
				if (window.speechSynthesis) {
				  const synth = window.speechSynthesis;
				  synth.getVoices();

				  try {
					const u = new SpeechSynthesisUtterance(" ");
					u.volume = 0;
					synth.speak(u);
					synth.cancel();
				  } catch {
					// no-op
				  }
				}

				try {
				  const prime = new Audio();
				  prime.volume = 0;
				  prime.src =
					"data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQAAAAAAA==";
				  void prime.play().then(() => prime.pause()).catch(() => {});
				} catch {
				  // no-op
				}
			  }
			}}
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
          onScanSuccess={(id) => {
            // allow speaking when the new card loads
            lastSpokenIdRef.current = null;
            setScannedCardId(id);
          }}
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
                onClick={() => {
                  stopAllAudio();
                  playGenRef.current += 1;
                  lastSpokenIdRef.current = null;

                  setScannedCardId(null);
                }}
                style={{
                  flex: 1,
                  minWidth: 120,
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
                Scan Next Athlete
              </button>

              <button
                onClick={() => {
                  if (!card) return;
                  lastSpokenIdRef.current = null;
                  const text = ((card as any)?.spoken_intro ?? "").trim();
                  void playCardAudio(card.id, text);
                }}
                disabled={!card}
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
                  opacity: card ? 1 : 0.5,
                }}
              >
                Replay
              </button>

              <button
                onClick={endGame}
                style={{
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
