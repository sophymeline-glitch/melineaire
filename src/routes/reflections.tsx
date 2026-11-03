import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { reflections } from "@/lib/content";

export const Route = createFileRoute("/reflections")({
  head: () => ({
    meta: [
      { title: "Reflections — Melineaire" },
      { name: "description", content: "Reflective readings and guided questions from Melineaire." },
      { property: "og:title", content: "Reflections — Melineaire" },
      { property: "og:description", content: "Readings and questions to sit with." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reflections,
});

function Reflections() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-5xl text-primary">Reflections</h1>
        <p className="mt-3 text-muted-foreground">Read slowly. Take what helps, leave what doesn't.</p>
        <div className="mt-12 space-y-8">
          {reflections.map((r) => (
            <article key={r.slug} className="rounded-lg border border-border bg-card p-8">
              <h2 className="text-3xl text-primary">{r.title}</h2>
              <p className="mt-4 leading-relaxed text-foreground/80">{r.body}</p>
              <ul className="mt-6 space-y-2 border-l-2 border-sakura pl-4 italic text-secondary-foreground">
                {r.questions.map((q) => <li key={q}>{q}</li>)}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Button asChild><Link to="/studio" search={{ r: r.slug }}>Start colouring</Link></Button>
                <Button asChild variant="outline"><Link to="/journal">Write about it</Link></Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
