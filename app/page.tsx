export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
          In Order: Sports™
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Rookie Run
        </h1>

        <p className="mt-6 text-2xl font-semibold text-white">
          Know sports history? Prove it.
        </p>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          Place athletes from various sports in chronological order by rookie year.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/rules"
            className="rounded-full bg-white px-6 py-3 font-semibold text-zinc-950"
          >
            View Rules
          </a>

          <a
            href="/scan"
            className="rounded-full border border-zinc-600 px-6 py-3 font-semibold text-white"
          >
            Scan Players
          </a>
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Prototype in development. Rookie Run is the first game in the IN ORDER: SPORTS™ series.
        </p>
      </section>
    </main>
  );
}