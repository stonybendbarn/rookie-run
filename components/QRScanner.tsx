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
    if (autoStart && containerRef.current && !isScanning && !error) {
      const timer = setTimeout(() => {
        startScanning();
      }, 200); // Slightly longer delay to ensure DOM is ready
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startScanning = async () => {
    if (!containerRef.current) {
      console.error("Container ref not available");
      setError("Scanner container not ready. Please refresh the page.");
      return;
    }

    console.log("Starting camera scan...");
    
    // Clear any previous error
    setError(null);

    // Clean up any existing scanner instance
    if (scannerRef.current) {
      try {
        console.log("Cleaning up existing scanner...");
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log("Cleanup error (ignored):", e);
      }
      scannerRef.current = null;
    }

    try {
      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      // Try to get available cameras first for better error messages
      let cameraIdOrConfig: string | { facingMode: string } = { facingMode: "environment" };
      
      try {
        console.log("Enumerating cameras...");
        const cameras = await Html5Qrcode.getCameras();
        console.log("Found cameras:", cameras);
        if (cameras && cameras.length > 0) {
          // Prefer back camera, fallback to first available
          const backCamera = cameras.find((cam) => cam.label.toLowerCase().includes("back"));
          cameraIdOrConfig = backCamera?.id || cameras[0].id;
          console.log("Using camera:", cameraIdOrConfig);
        }
      } catch (e: any) {
        // If we can't enumerate cameras, use facingMode
        console.log("Could not enumerate cameras, using facingMode:", e.message || e);
      }

      console.log("Starting scanner with config:", cameraIdOrConfig);
      await scanner.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR code detected:", decodedText);
          // Extract card ID from URL (e.g., /cards/RR-BBK-001)
          const match = decodedText.match(/\/cards\/([^\/]+)/);
          if (match && match[1]) {
            const cardId = match[1];
            console.log("Navigating to card:", cardId);
            
            // Stop scanner and navigate immediately
            // Scanner will auto-restart on new page with scan=true param
            scanner.stop().catch(() => {
              // Ignore stop errors
            });
            
            // Navigate immediately - smooth transition without page reload
            try {
              if (onScanSuccess) {
                onScanSuccess(cardId);
              } else {
                router.push(`/cards/${cardId}?scan=true`);
              }
            } catch (navError: any) {
              console.error("Navigation error:", navError);
              router.push(`/cards/${cardId}?scan=true`);
            }
          } else {
            console.warn("Invalid QR code format:", decodedText);
            setError(`Invalid QR code format. Expected URL like /cards/RR-BBK-001, got: ${decodedText.substring(0, 50)}...`);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          // Only log if it's not a common scanning error
          if (!errorMessage.includes("NotFoundException") && !errorMessage.includes("No MultiFormat Readers")) {
            console.log("Scanning error (ignored):", errorMessage);
          }
        }
      );

      console.log("Scanner started successfully");
      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error("Camera error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        error: err
      });
      
      let errorMsg = "Failed to start camera";
      
      if (err.message) {
        errorMsg = err.message;
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera found. Please check your device has a camera.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera is already in use by another application.";
      } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        errorMsg = "Camera doesn't support required settings.";
      } else if (err.name) {
        errorMsg = `Camera error: ${err.name} - ${err.message || "Unknown error"}`;
      }
      
      setError(errorMsg);
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
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col items-center justify-center p-4"
      onClick={(e) => {
        // Close if clicking outside the white box
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
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
            <p className="font-semibold mb-1">Error:</p>
            <p className="text-sm">{error}</p>
            {error.includes("permission") && (
              <p className="text-xs mt-2 opacity-75">
                Try refreshing the page and allowing camera access when prompted.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {!isScanning ? (
            <button
              onClick={() => {
                console.log("Button onClick triggered");
                startScanning();
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer touch-manipulation select-none text-base font-medium"
              type="button"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
            >
              {error ? "Try Again" : "Start Camera"}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopScanning();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopScanning();
              }}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 active:bg-red-800 transition-colors cursor-pointer touch-manipulation select-none text-base font-medium"
              type="button"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
              }}
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
