"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";

export default function ScanPage() {
  const router = useRouter();

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
      </div>
      
      <QRScanner
        onScanSuccess={handleScanSuccess}
        onClose={() => router.push("/")}
        autoStart={true}
      />
    </>
  );
}
