export default function RulesPage() {
  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: 800,
        margin: "0 auto",
        color: "#f9fafb",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>
        Rookie Run — Rules
      </h1>

      <section>
        <h2>Objective</h2>
        <p>
          Be the first player to complete a timeline containing at least one
          card from every sport and successfully complete your turn.
        </p>
        <p>
          You may only win on <strong>your own turn</strong>. Completing your
          final sport during a challenge does <strong>not</strong> win the game.
        </p>
      </section>

      <section>
        <h2>Setup</h2>
        <ul>
          <li>Shuffle all cards into a face-down draw pile.</li>
          <li>Create a discard pile.</li>
          <li>All players start with no cards and no timeline.</li>
        </ul>
      </section>

      <section>
        <h2>Start of Play</h2>
        <p>The youngest player goes first. Play proceeds clockwise.</p>
      </section>

      <section>
        <h2>Your Turn</h2>
        <ol>
          <li>Draw one card and scan it.</li>
          <li>
            Announce where you believe it belongs in your timeline.
            <ul>
              <li>For your first card, you must declare a <strong>decade</strong>.</li>
            </ul>
          </li>
          <li>If correct, place the card.</li>
          <li>If incorrect, discard it.</li>
        </ol>
      </section>

      <section>
        <h2>Timelines</h2>
        <p>
          Timelines must remain chronological. Exact years are not required —
          only correct relative placement.
        </p>

        <p style={{ marginTop: "0.75rem" }}>
          <strong>Example timeline on the table:</strong>
        </p>
        <p style={{ fontStyle: "italic" }}>
          1984 — 1990 — 1994 — 1998 — 2006
        </p>

        <p>
          <strong>Valid placement windows:</strong>
        </p>
        <p style={{ fontStyle: "italic" }}>
          before 1984 | between 1984–1990 | 1990–1994 | 1994–1998 | 1998–2006 | after
          2006
        </p>

        <p>
          Saying “between 1990 and 1994” is valid even if the year is 1990.
        </p>
      </section>

      <section>
        <h2>Challenges</h2>
        <ul>
          <li>Only players with an active timeline may challenge.</li>
          <li>
            Challenges start to the left of the drawing player and proceed
            clockwise.
          </li>
          <li>
            Each challenger must select a <strong>different</strong> placement
            window.
          </li>
          <li>
            No two challengers may choose the same window.
          </li>
          <li>
            The number of challenges is limited by the number of available
            windows.
          </li>
        </ul>
      </section>

      <section>
        <h2>Resolving Challenges</h2>
        <p>Reveal the rookie year.</p>

        <ul>
          <li>
            <strong>Drawing player correct:</strong> The drawing player wins.
            All challengers lose one timeline card, chosen by the drawing
            player.
          </li>
          <li>
            <strong>Drawing player incorrect:</strong> The first challenger
            (clockwise from the drawing player) whose selected window contains
            the correct year wins. That player takes the drawn card and places
            it in their timeline. The drawing player loses no cards. All losing
            challengers lose one card chosen by the winner.
          </li>
          <li>
            <strong>No winner:</strong> All challengers lose one card and choose
            which card to remove from their own timeline.
          </li>
        </ul>
      </section>

      <section>
        <h2>Special Cards</h2>
        <ul>
          <li>
            <strong>Instant Win Cards</strong> (Walk-Off, Game Set Match, Hat
            Trick, Hole in One): May be placed anywhere, count as that sport, and
            win immediately if played successfully on your turn and you already
            have all sports.
          </li>
          <li>
            <strong>Lose Your Turn:</strong> Immediately discard this card and
            end your current turn. No timeline card is placed and you cannot win
            this turn.
          </li>
        </ul>
      </section>

      <section>
        <h2>Winning</h2>
        <p>
          You win when your timeline contains all sports and you successfully
          place a card on your own turn.
        </p>
      </section>
    </main>
  );
}
