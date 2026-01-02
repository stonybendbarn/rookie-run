import { getCardById } from "@/lib/cards";
import Link from "next/link";

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardPage({ params }: Props) {
  const { cardId } = await params;

  const card = getCardById(cardId);

  if (!card) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Card not found</h1>
        <p>
          No card exists for ID: <code>{cardId}</code>
        </p>
        <p>
          Try: <Link href="/cards/test-001">/cards/test-001</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        {card.athleteName}
      </h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{card.sport}</p>

      <details style={{ marginTop: "1.5rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "1.1rem" }}>
          Reveal rookie year
        </summary>
        <p style={{ fontSize: "2.5rem", margin: "0.75rem 0 0" }}>
          {card.rookieYear}
        </p>
      </details>

      {card.notes ? (
        <p style={{ marginTop: "1.5rem", opacity: 0.8 }}>{card.notes}</p>
      ) : null}

      <hr style={{ margin: "2rem 0" }} />

      <p style={{ opacity: 0.7 }}>
        Card ID: <code>{card.id}</code>
      </p>
    </main>
  );
}
