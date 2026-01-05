"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  /** Called when we successfully extract a card id from a QR code. */
  onScanSuccess: (cardId: string) => void;
  /** Optional close handler (used if you want a dismiss button). */
  onClose?: () => void;
  /** If true, attempts to start the camera automatically. */
  autoStart?: boolean;
  /**
   * When true, the camera stays running but scan results are ignored.
   * (Perfect for showing a "card overlay" while keeping the stream alive.)
   */
  isPaused?: boolean;
}

function extractCardId(decodedText: string): string | null {
  // Supports:
  // 1) Full URL: https://rookie-run.vercel.app/cards/RR-MLB-002
  // 2) Path: /cards/RR-MLB-002
  // 3) Raw id: RR-MLB-002

  const raw = decodedText.trim();
  if (!raw) return null;

  // Full URL or relative path
  const pathMatch = raw.match(/\/cards\/([^\/?#]+)/i);
  if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

  // Raw id
  if (/^[A-Z]{2,5}-[A-Z]{2,5}-\d{3}$/i.test(raw)) return raw.toUpperCase();

  return null;
}

export default function QRScanner({
  onScanSuccess,
  onClose,
  autoStart = false,
  isPaused = false,
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef(`qr-reader-${Date.now()}-${Math.random()}`);

  // Debounce so a single QR doesn't fire repeatedly while it's in frame
  const lastScanRef = useRef<{ text: string; ts: number } | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      void stopInternal(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start (best effort). Note: iOS may still require a user gesture.
  useEffect(() => {
    if (autoStart && !isScanning && !error) {
      const t = setTimeout(() => {
        if (!isScanning && !error) void startScanning();
      }, 150);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function stopInternal(silent = false) {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (isScanning) await scanner.stop();
    } catch (e) {
      if (!silent) console.error("Error stopping scanner:", e);
    }

    try {
      scanner.clear();
    } catch (e) {
      if (!silent) console.error("Error clearing scanner:", e);
    }

    scannerRef.current = null;
    setIsScanning(false);
  }

  async function startScanning() {
    if (!containerRef.current) {
      setError("Scanner container not ready. Please refresh.");
      return;
    }

    setError(null);

    // If we already have a scanner running, don't restart.
    if (scannerRef.current && isScanning) return;

    // Ensure a clean slate
    await stopInternal(true);

    try {
      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      // Prefer back camera if possible
      let cameraIdOrConfig: string | { facingMode: string } = { facingMode: "environment" };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras?.length) {
          const back = cameras.find((c) => c.label.toLowerCase().includes("back"));
          cameraIdOrConfig = back?.id || cameras[0].id;
        }
      } catch {
        // Ignore enumeration failure; facingMode is fine.
      }

      await scanner.start(
        cameraIdOrConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isPaused) return;

          const now = Date.now();
          const last = lastScanRef.current;
          if (last && last.text === decodedText && now - last.ts < 1500) return;
          lastScanRef.current = { text: decodedText, ts: now };

          const cardId = extractCardId(decodedText);
          if (!cardId) {
            setError(
              `Invalid QR code. Expected something like /cards/RR-MLB-002 (or RR-MLB-002), got: ${decodedText.substring(
                0,
                80
              )}...`
            );
            return;
          }

          // IMPORTANT: do NOT stop the camera here.
          // We keep the stream alive and let the parent pause via isPaused.
          onScanSuccess(cardId);
        },
        () => {
          // ignore scan errors; they are frequent
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      let errorMsg = "Failed to start camera.";
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        errorMsg = "No camera found on this device.";
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        errorMsg = "Camera is already in use by another app.";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setIsScanning(false);
      scannerRef.current = null;
    }
  }

  async function stopScanning() {
    await stopInternal(false);
    onClose?.();
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Scanner</h2>
        {onClose ? (
          <button
            onClick={() => void stopScanning()}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close scanner"
            type="button"
          >
            ×
          </button>
        ) : null}
      </div>

      <div id={containerIdRef.current} ref={containerRef} className="w-full" style={{ minHeight: 320 }} />

      {error ? (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          <div className="font-semibold">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      ) : null}

      <div className="mt-3 flex gap-3">
        {!isScanning ? (
          <button
            onClick={() => void startScanning()}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
            type="button"
            style={{ minHeight: 44 }}
          >
            {error ? "Try Again" : "Start Camera"}
          </button>
        ) : (
          <button
            onClick={() => void stopScanning()}
            className="flex-1 bg-gray-900 text-white px-4 py-3 rounded hover:bg-black transition-colors"
            type="button"
            style={{ minHeight: 44 }}
          >
            Stop Camera
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-3">
        {isPaused ? "Paused — close the card to scan the next one." : "Point your camera at a Rookie Run QR code."}
      </p>
    </div>
  );
}
