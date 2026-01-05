"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";

interface QRScannerProps {
  onScanSuccess?: (cardId: string) => void;
  onClose?: () => void;
  autoStart?: boolean;
}

export default function QRScanner({ onScanSuccess, onClose, autoStart = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef(`qr-reader-${Date.now()}-${Math.random()}`);
  const router = useRouter();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, [isScanning]);

  useEffect(() => {
    // Auto-start scanning if requested
    if (autoStart && containerRef.current && !isScanning) {
      const timer = setTimeout(async () => {
        if (!containerRef.current) return;
        try {
          const scanner = new Html5Qrcode(containerIdRef.current);
          scannerRef.current = scanner;
          await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              const match = decodedText.match(/\/cards\/([^\/]+)/);
              if (match && match[1]) {
                const cardId = match[1];
                scanner.stop().then(() => {
                  scanner.clear();
                  setIsScanning(false);
                  if (onScanSuccess) {
                    onScanSuccess(cardId);
                  } else {
                    router.push(`/cards/${cardId}`);
                  }
                });
              } else {
                setError("Invalid QR code format");
              }
            },
            () => {}
          );
          setIsScanning(true);
          setError(null);
        } catch (err: any) {
          setError(err.message || "Failed to start camera");
          setIsScanning(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isScanning, onScanSuccess, router]);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract card ID from URL (e.g., /cards/RR-BBK-001)
          const match = decodedText.match(/\/cards\/([^\/]+)/);
          if (match && match[1]) {
            const cardId = match[1];
            
            // Stop scanning
            scanner.stop().then(() => {
              scanner.clear();
              setIsScanning(false);
              
              // Navigate to the new card
              if (onScanSuccess) {
                onScanSuccess(cardId);
              } else {
                router.push(`/cards/${cardId}`);
              }
            });
          } else {
            setError("Invalid QR code format");
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
        if (onClose) onClose();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Scan QR Code</h2>
          <button
            onClick={stopScanning}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close scanner"
          >
            ×
          </button>
        </div>

        <div
          id={containerIdRef.current}
          ref={containerRef}
          className="w-full mb-4"
          style={{ minHeight: "300px" }}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Stop Scanning
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Point your camera at a QR code to scan
        </p>
      </div>
    </div>
  );
}
