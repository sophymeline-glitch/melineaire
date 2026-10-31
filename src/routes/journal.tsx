import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { feelings } from "@/lib/content";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Melineaire" },
      { name: "description", content: "A private journal with an optional feelings check-in." },
      { property: "og:title", content: "Journal — Melineaire" },
      { property: "og:description", content: "Write privately, at your own pace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});

type Entry = { id: string; date: string; title: string; text: string; feelings: string[] };
const KEY = "melineaire.journal";

function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);
  const persist = (e: Entry[]) => { setEntries(e); localStorage.setItem(KEY, JSON.stringify(e)); };

  const save = () => {
    if (!text.trim()) return;
    const f = custom.trim() ? [...picked, custom.trim()] : picked;
    if (editing) persist(entries.map((e) => (e.id === editing ? { ...e, title, text, feelings: f } : e)));
    else persist([{ id: crypto.randomUUID(), date: new Date().toISOString(), title: title || "Untitled", text, feelings: f }, ...entries]);
    setTitle(""); setText(""); setPicked([]); setCustom(""); setEditing(null);
  };

  const exportAll = () => {
    const body = entries.map((e) => `# ${e.title}\n${new Date(e.date).toLocaleString()}\n${e.feelings.length ? "Feeling: " + e.feelings.join(", ") + "\n" : ""}\n${e.text}\n`).join("\n---\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/markdown" }));
    a.download = "melineaire-journal.md"; a.click();
  };

  const shown = entries.filter((e) => (e.title + e.text).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h1 className="text-5xl text-primary">Journal</h1>
          <p className="mt-3 text-sm text-muted-foreground">Private to this device. Nothing is shared.</p>
          <div className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full bg-transparent font-display text-2xl outline-none" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="What are you noticing?" className="w-full resize-y rounded-xl bg-muted p-4 outline-none focus:ring-2 focus:ring-ring" />
            <div>
              <p className="text-sm text-muted-foreground">How are you feeling? <span className="italic">(optional — skip anytime)</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {feelings.map((f) => (
                  <button key={f} onClick={() => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))}
                    className={`rounded-full border px-3 py-1 text-sm ${picked.includes(f) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                    {f}
                  </button>
                ))}
                <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="other…" className="w-28 rounded-full border border-border bg-transparent px-3 py-1 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} className="rounded-full bg-primary px-6 py-2 text-primary-foreground">{editing ? "Update" : "Save entry"}</button>
              {editing && <button onClick={() => { setEditing(null); setTitle(""); setText(""); setPicked([]); }} className="text-sm text-muted-foreground">Cancel</button>}
            </div>
          </div>
        </section>
        <section>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" className="flex-1 rounded-full border border-border bg-card px-4 py-2 outline-none" />
            <button onClick={exportAll} disabled={!entries.length} className="rounded-full border border-border px-4 text-sm disabled:opacity-40">Export</button>
          </div>
          <div className="mt-6 space-y-4">
            {!shown.length && <p className="text-muted-foreground">No entries yet.</p>}
            {shown.map((e) => (
              <article key={e.id} className="rounded-2xl bg-secondary/60 p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl text-secondary-foreground">{e.title}</h3>
                  <time className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</time>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm">{e.text}</p>
                {!!e.feelings.length && <p className="mt-2 text-xs italic text-accent-foreground">{e.feelings.join(" · ")}</p>}
                <div className="mt-3 flex gap-4 text-xs">
                  <button onClick={() => { setEditing(e.id); setTitle(e.title); setText(e.text); setPicked(e.feelings); }} className="underline">Edit</button>
                  <button onClick={() => confirm("Delete this entry?") && persist(entries.filter((x) => x.id !== e.id))} className="text-destructive underline">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
