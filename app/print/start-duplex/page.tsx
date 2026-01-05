import QRCode from "qrcode";

export const runtime = "nodejs";

/**
 * SIMPLE, ROBUST START / RULES CARDS
 * - Portrait printing
 * - 3" wide x 5" tall cards
 * - 2 cards per page
 * - 1" vertical gap
 * - Duplex: flip on long edge
 * - No rotation, no offsets
 */

const COUNT = 2;

// Card size
const CARD_W_IN = 3.0;
const CARD_H_IN = 5.0;

// Vertical gap between cards
const GAP_IN = 0.2;

// Padding inside card
const PADDING_IN = 0.3;

// QR size
const QR_SIZE_PX = 260;

function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function PrintStartDuplexPage() {
  const baseUrl = getBaseUrl();

  const startUrl = `${baseUrl}/scan`;
  const rulesUrl = `${baseUrl}/rules`;

  const items = Array.from({ length: COUNT }, (_, i) => ({ key: i }));

  const startSvg = await QRCode.toString(startUrl, {
    type: "svg",
    margin: 0,
    width: QR_SIZE_PX,
  });

  const rulesSvg = await QRCode.toString(rulesUrl, {
    type: "svg",
    margin: 0,
    width: QR_SIZE_PX,
  });

  return (
    <div className="page">
      <style>{`
        @page {
          size: Letter;
          margin: 0.25in;
        }

        @media print {
          .page {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .page {
          font-family: Arial, sans-serif;
          color: #111;
        }

        .sheet {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 0;
        }

        .sheetBreak {
          page-break-after: always;
          break-after: page;
        }

        .card {
          width: ${CARD_W_IN}in;
          height: ${CARD_H_IN}in;
          box-sizing: border-box;
          border: 1px solid #ddd;
          border-radius: 14px;
          padding: ${PADDING_IN}in;
          background: #fff;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }

        .spacer {
          height: ${GAP_IN}in;
        }

        .brand {
          font-size: 36px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-top: 0.1in;
        }

        .qr {
          width: ${QR_SIZE_PX}px;
          height: ${QR_SIZE_PX}px;
        }

        .qr svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .caption {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 0.1in;
        }
      `}</style>

      {/* PAGE 1 — START */}
      <div className="sheet sheetBreak">
        {items.map((it, idx) => (
          <div key={`start-${idx}`}>
            <div className="card">
              <div className="brand">ROOKIE RUN</div>
              <div
                className="qr"
                dangerouslySetInnerHTML={{ __html: startSvg }}
              />
              <div className="caption">Scan to start game.</div>
            </div>
            {idx === 0 && <div className="spacer" />}
          </div>
        ))}
      </div>

      {/* PAGE 2 — RULES */}
      <div className="sheet">
        {items.map((it, idx) => (
          <div key={`rules-${idx}`}>
            <div className="card">
              <div className="brand">ROOKIE RUN</div>
              <div
                className="qr"
                dangerouslySetInnerHTML={{ __html: rulesSvg }}
              />
              <div className="caption">Scan for rules.</div>
            </div>
            {idx === 0 && <div className="spacer" />}
          </div>
        ))}
      </div>
    </div>
  );
}
