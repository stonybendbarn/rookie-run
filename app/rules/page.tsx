const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} style={{ marginTop: "1.25rem" }}>
    <h2
      style={{
        fontSize: "1.25rem",
        margin: "0 0 0.65rem",
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h2>
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14,
        padding: "1rem",
      }}
    >
      {children}
    </div>
  </section>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: "inline-block",
      padding: "0.15rem 0.55rem",
      borderRadius: 999,
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.14)",
      fontSize: "0.9rem",
      lineHeight: 1.4,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const ulStyle: React.CSSProperties = {
  margin: "0.25rem 0 0",
  paddingLeft: "1.2rem",
};
const liStyle: React.CSSProperties = { margin: "0.35rem 0" };

export default function RulesPage() {
  const sections = [
    { id: "objective", label: "Objective" },
    { id: "setup", label: "Setup" },
    { id: "start", label: "Start" },
    { id: "turn", label: "Your Turn" },
    { id: "timelines", label: "Timelines" },
    { id: "challenges", label: "Challenges" },
    { id: "resolve", label: "Resolving" },
    { id: "special", label: "Special Cards" },
    { id: "winning", label: "Winning" },
  ];

  return (
    <main
      style={{
        padding: "1.25rem",
        maxWidth: 900,
        margin: "0 auto",
        color: "#f9fafb",
        lineHeight: 1.6,
        fontSize: "1.05rem",
      }}
    >
      <header style={{ marginBottom: "1rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            margin: "0 0 0.35rem",
            letterSpacing: "-0.02em",
          }}
        >
          Rookie Run — Rules
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Fast timeline game with challenges. No walls of text. 🙂
        </p>
      </header>

      {/* Mobile-friendly quick nav */}
      <details
        open
        style={{
          marginTop: "0.75rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: "0.75rem 1rem",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontSize: "1.05rem",
            fontWeight: 600,
            listStyle: "none",
            outline: "none",
          }}
        >
          Jump to a section
        </summary>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                textDecoration: "none",
                color: "#f9fafb",
              }}
            >
              <Pill>{s.label}</Pill>
            </a>
          ))}
        </div>
      </details>

      <Section id="objective" title="Objective">
        <p style={{ margin: 0 }}>
          Be the first player to complete a timeline containing at least one
          card from every sport and successfully complete your turn.
        </p>
        <p style={{ margin: "0.75rem 0 0" }}>
          <strong>You may only win on your own turn.</strong> Completing your
          final sport during a challenge does <strong>not</strong> win the game.
        </p>
      </Section>

      <Section id="setup" title="Setup">
        <ul style={ulStyle}>
          <li style={liStyle}>Shuffle all cards into a face-down draw pile.</li>
          <li style={liStyle}>Create a discard pile.</li>
          <li style={liStyle}>
            All players start with no cards and no timeline.
          </li>
        </ul>
      </Section>

      <Section id="start" title="Start of Play">
        <p style={{ margin: 0 }}>
          The youngest player goes first. Play proceeds clockwise.
        </p>
      </Section>

      <Section id="turn" title="Your Turn">
        <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li style={liStyle}>Draw one card and scan it.</li>
          <li style={liStyle}>
            Announce where you believe it belongs in your timeline.
            <div style={{ marginTop: "0.35rem", opacity: 0.95 }}>
              <Pill>First card: declare a decade</Pill>
            </div>
          </li>
          <li style={liStyle}>If correct, place the card.</li>
          <li style={liStyle}>If incorrect, discard it.</li>
        </ol>
      </Section>

      <Section id="timelines" title="Timelines">
        <p style={{ margin: 0 }}>
          Timelines must remain chronological. Exact years are not required —
          only correct relative placement.
        </p>

        <div
          style={{
            marginTop: "0.85rem",
            padding: "0.75rem",
            borderRadius: 12,
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
            Example timeline on the table
          </div>
          <div
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: "1.05rem",
              whiteSpace: "nowrap",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
          >
            1984 — 1990 — 1994 — 1998 — 2006
          </div>

          <div style={{ marginTop: "0.75rem", fontWeight: 700 }}>
            Valid placement windows
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
            }}
          >
            <Pill>before 1984</Pill>
            <Pill>between 1984–1990</Pill>
            <Pill>1990–1994</Pill>
            <Pill>1994–1998</Pill>
            <Pill>1998–2006</Pill>
            <Pill>after 2006</Pill>
          </div>

          <p style={{ margin: "0.75rem 0 0", opacity: 0.95 }}>
            Saying “between 1990 and 1994” is valid even if the year is 1990.
          </p>
        </div>
      </Section>

      <Section id="challenges" title="Challenges">
        <ul style={ulStyle}>
          <li style={liStyle}>Only players with an active timeline may challenge.</li>
          <li style={liStyle}>
            Challenges start to the left of the drawing player and proceed
            clockwise.
          </li>
          <li style={liStyle}>
            Each challenger must select a <strong>different</strong> placement
            window — no duplicates.
          </li>
          <li style={liStyle}>
            The number of challenges is limited by the number of available
            windows.
          </li>
        </ul>
      </Section>

      <Section id="resolve" title="Resolving Challenges">
        <p style={{ margin: 0 }}>
          Reveal the rookie year, then apply the correct outcome:
        </p>

        <div style={{ marginTop: "0.85rem", display: "grid", gap: "0.65rem" }}>
          <div
            style={{
              padding: "0.85rem",
              borderRadius: 12,
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              Drawing player correct
            </div>
            <div>
              Drawing player wins. All challengers lose one timeline card,
              chosen by the drawing player.
            </div>
          </div>

          <div
            style={{
              padding: "0.85rem",
              borderRadius: 12,
              background: "rgba(59,130,246,0.10)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              Drawing player incorrect
            </div>
            <div>
              The first challenger (clockwise from the drawing player) whose
              selected window contains the correct year wins, takes the drawn
              card, and places it in their timeline. The drawing player loses
              no cards. All losing challengers lose one card chosen by the
              winner.
            </div>
          </div>

          <div
            style={{
              padding: "0.85rem",
              borderRadius: 12,
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              No winner
            </div>
            <div>
              All challengers lose one card and choose which card to remove from
              their own timeline.
            </div>
          </div>
        </div>
      </Section>

      <Section id="special" title="Special Cards">
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div
            style={{
              padding: "0.85rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              Instant Win Cards
            </div>
            <div style={{ opacity: 0.95, marginBottom: "0.35rem" }}>
              <Pill>Walk-Off</Pill>{" "}
              <Pill>Game Set Match</Pill>{" "}
              <Pill>Hat Trick</Pill>{" "}
              <Pill>Hole in One</Pill>
            </div>
            <div>
              May be placed anywhere, count as that sport, and win immediately
              if played successfully on your turn and you already have all
              sports.
            </div>
          </div>

          <div
            style={{
              padding: "0.85rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              Lose Your Turn
            </div>
            <div>
              Immediately discard this card and end your current turn. No
              timeline card is placed and you cannot win this turn.
            </div>
          </div>
        </div>
      </Section>

      <Section id="winning" title="Winning">
        <p style={{ margin: 0 }}>
          You win when your timeline contains all sports and you successfully
          place a card on your own turn.
        </p>
      </Section>

      <footer style={{ marginTop: "1.5rem", opacity: 0.75, fontSize: "0.95rem" }}>
        Tip: this page is designed to scroll well on phones — big tap targets,
        short blocks, and no giant paragraphs.
      </footer>
    </main>
  );
}
