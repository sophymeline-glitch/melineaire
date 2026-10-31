import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { palettes, reflections } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Melineaire — Let's notice." },
      { name: "description", content: "A creative sanctuary for colouring, reflection, journaling and growing closer to God." },
      { property: "og:title", content: "Melineaire — Let's notice." },
      { property: "og:description", content: "Colour, reflect and journal in a calm, creative space." },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = reflections[0];
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-dawn opacity-70" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sakura/50 blur-3xl animate-breathe" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-lilac/40 blur-3xl animate-breathe" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Melineaire</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-primary sm:text-7xl">
            Let's <em>notice.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/80">
            A quiet place to colour, reflect and write — to slow down, understand yourself, and
            recognise God's goodness in everyday life. Come as you are.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/studio" className="rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
              Begin colouring
            </Link>
            <Link to="/reflections" className="rounded-full border border-primary/30 bg-card/70 px-6 py-3 text-primary hover:bg-card">
              Read a reflection
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-3">
        {[
          { to: "/studio", t: "Colour Studio", d: "Fill, pencil, marker, spray and more on a gentle mandala." },
          { to: "/reflections", t: "Reflections", d: "Short readings and questions to sit with." },
          { to: "/journal", t: "Journal", d: "Private writing, with an optional feelings check-in." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-3xl border border-border bg-card p-8 transition-shadow hover:shadow-soft">
            <h3 className="text-2xl text-primary">{c.t}</h3>
            <p className="mt-3 text-muted-foreground">{c.d}</p>
            <span className="mt-6 inline-block text-sm text-accent-foreground group-hover:underline">Open →</span>
          </Link>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 md:grid-cols-2">
        <div className="rounded-3xl bg-secondary p-10">
          <p className="text-xs uppercase tracking-widest text-secondary-foreground/70">Featured reflection</p>
          <h2 className="mt-3 text-3xl text-secondary-foreground">{featured.title}</h2>
          <p className="mt-4 text-secondary-foreground/80">{featured.questions[0]}</p>
          <Link to="/reflections" className="mt-6 inline-block text-sm underline">Read more</Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Palettes</p>
          <div className="mt-5 space-y-4">
            {palettes.slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-4">
                <span className="font-display text-lg">{p.name}</span>
                <div className="flex overflow-hidden rounded-full">
                  {p.colors.map((c) => (
                    <span key={c} className="h-6 w-7" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        Melineaire · Let's notice.
      </footer>
    </div>
  );
}
