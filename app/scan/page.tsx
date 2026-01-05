"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";

export default function ScanPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (cardId: string) => {
    // Navigate to the card page
    router.push(`/cards/${cardId}`);
  };

  return (
    <>
      <div style={{ minHeight: "100vh", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Rookie Run Scanner</h1>
        <p style={{ marginBottom: "2rem", opacity: 0.8 }}>
          Scan a QR code to view an athlete card
        </p>
        
        {!showScanner ? (
          <button
            onClick={() => setShowScanner(true)}
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
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
            autoStart={false}
          />
        )}
      </div>
    </>
  );
}
