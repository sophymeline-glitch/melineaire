import { Link } from "@tanstack/react-router";

const links = [
  { to: "/studio", label: "Colour Studio" },
  { to: "/reflections", label: "Reflections" },
  { to: "/journal", label: "Journal" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="font-display text-2xl italic text-primary">
          Melineaire
        </Link>
        <div className="flex gap-1 text-sm sm:gap-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
