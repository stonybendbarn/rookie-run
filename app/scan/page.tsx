"use client";

import { useEffect, useRef, useState } from "react";
import QRScanner from "@/components/QRScanner";
import CardView from "@/components/CardView";

type Card = Parameters<typeof CardView>[0]["card"];

type AudioDiagnostic = {
  cardId: string;
  mp3Url: string;
  errorName: string;
  errorMessage: string;
};

function audioUrlForCard(cardId: string): string {
  return `/audio/cards/${encodeURIComponent(cardId.toUpperCase())}.mp3`;
}

const AUDIO_DEBUG = process.env.NODE_ENV === "development";

function audioDebug(event: string, details?: Record<string, unknown>) {
  if (!AUDIO_DEBUG) return;
  if (details) {
    console.log("[scan-audio]", event, details);
    return;
  }
  console.log("[scan-audio]", event);
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
  const [audioDiagnostic, setAudioDiagnostic] = useState<AudioDiagnostic | null>(null);

  // ---- Audio / TTS ----
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const lastSpokenIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playGenRef = useRef(0);

  function resetPersistentAudio(clearSource = false) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    if (clearSource) {
      audio.src = "";
    }
  }

  function stopAllAudio(options: { endSession?: boolean } = {}) {
    resetPersistentAudio(true);

    if (options.endSession) {
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function unlockPersistentAudio() {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audio.src =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQAAAAAAA==";

    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        audio.src = "";
        audioDebug("warmup-play-success", { stage: "start-scanner", persistent: true });
      })
      .catch((error: { name?: string; message?: string }) => {
        audio.volume = 1;
        audioDebug("warmup-play-rejected", {
          stage: "start-scanner",
          persistent: true,
          name: error?.name ?? "Error",
          message: error?.message ?? String(error),
        });
      });
  }

  function reportAudioFailure(cardId: string, mp3Url: string, error: unknown) {
    const err = error as { name?: string; message?: string };
    setAudioDiagnostic({
      cardId,
      mp3Url,
      errorName: err?.name ?? "Error",
      errorMessage: err?.message ?? String(error),
    });
  }

  async function playCardAudio(cardId: string) {
    setAudioDiagnostic(null);

    const gen = ++playGenRef.current;
    const mp3Path = audioUrlForCard(cardId);
    const mp3Url =
      typeof window !== "undefined" ? new URL(mp3Path, window.location.origin).href : mp3Path;

    audioDebug("play-requested", { cardId, mp3Path, mp3Url, generation: gen, persistent: true });

    const audio = audioRef.current;
    if (!audio) {
      audioDebug("play-aborted", {
        cardId,
        reason: "no-persistent-audio",
        generation: gen,
      });

      if (gen !== playGenRef.current) return;

      reportAudioFailure(cardId, mp3Url, {
        name: "NoPersistentAudio",
        message: "Persistent audio element was not initialized. Tap Start Scanner first.",
      });
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.src = mp3Path;

    let playPromise: Promise<void>;
    try {
      playPromise = audio.play();
    } catch (error) {
      audioDebug("persistent-mp3-play-rejected", {
        cardId,
        mp3Url,
        generation: gen,
        name: (error as { name?: string })?.name ?? "Error",
        message: (error as { message?: string })?.message ?? String(error),
      });

      if (gen !== playGenRef.current) return;

      reportAudioFailure(cardId, mp3Url, error);
      return;
    }

    try {
      await playPromise;

      if (gen !== playGenRef.current) {
        audioDebug("play-aborted", { cardId, reason: "superseded", generation: gen });
        return;
      }

      setAudioDiagnostic(null);
      audioDebug("persistent-mp3-play-success", { cardId, mp3Url, generation: gen });
    } catch (error) {
      audioDebug("persistent-mp3-play-rejected", {
        cardId,
        mp3Url,
        generation: gen,
        name: (error as { name?: string })?.name ?? "Error",
        message: (error as { message?: string })?.message ?? String(error),
      });

      if (gen !== playGenRef.current) return;

      reportAudioFailure(cardId, mp3Url, error);
    }
  }

  const endGame = () => {
    stopAllAudio({ endSession: true });
    playGenRef.current += 1;
    lastSpokenIdRef.current = null;
    setAudioDiagnostic(null);

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
      setAudioDiagnostic(null);
      return;
    }

    setAudioDiagnostic(null);
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
      stopAllAudio({ endSession: true });
      playGenRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play pre-generated audio after the card loads.
  useEffect(() => {
    if (!ttsEnabled) return;
    if (!scannedCardId) return;
    if (!card) return;

    // Prevent double-play due to re-renders
    if (lastSpokenIdRef.current === scannedCardId) return;

    lastSpokenIdRef.current = scannedCardId;
    void playCardAudio(card.id);
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

				unlockPersistentAudio();
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
            setAudioDiagnostic(null);
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
                  {audioDiagnostic ? (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 10,
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        fontSize: 13,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>
                        Audio failed: {audioDiagnostic.errorName} - {audioDiagnostic.errorMessage}
                      </div>
                      <div>Card ID: {audioDiagnostic.cardId}</div>
                      <div>MP3 URL: {audioDiagnostic.mp3Url}</div>
                    </div>
                  ) : null}
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
                  void playCardAudio(card.id);
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
