import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { useMember } from '@/components/MemberProvider';
import { readJournal, storeJournal, removeJournal, type JournalEntry } from '@/lib/private-saves';
import { useQuery } from '@tanstack/react-query';
import { booksOptions } from '@/lib/book-query';
import { feelings } from "@/lib/content";

export const Route = createFileRoute("/journal")({
  validateSearch: (s: Record<string, unknown>): { b?: string; s?: string } => ({ ...(typeof s["b"] === "string" ? {b:s["b"]} : {}), ...(typeof s["s"] === "string" ? {s:s["s"]} : {}) }),
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

type Entry = JournalEntry;
const KEY = "melineaire.journal";

function Journal() {
  const {user,loading}=useMember();
  const {b,s}=Route.useSearch();
  const {data:books}=useQuery({...booksOptions(b),enabled:Boolean(b)});
  const section=books?.[0]?.sections.find(x=>x.id===s);
  const [busy,setBusy]=useState(true);
  const [message,setMessage]=useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if(loading)return;
    let active=true;setBusy(true);setEntries([]);setTitle('');setText('');setEditing(null);setPicked([]);setCustom('');
    void (async()=>{try{const rows=user?await readJournal(user.id):JSON.parse(localStorage.getItem(KEY)||'[]');if(active){setEntries(rows);setMessage('');}}catch{if(active)setMessage('Journal could not be loaded. Reload before saving.');}finally{if(active)setBusy(false);}})();
    return()=>{active=false;};
  }, [user?.id,loading]);
  const save = async () => {
    if (!text.trim()||busy||message.includes('Reload')) return;
    setBusy(true);
    const f=custom.trim()?[...picked,custom.trim()]:picked;
    const entry:Entry={id:editing??crypto.randomUUID(),date:entries.find(e=>e.id===editing)?.date??new Date().toISOString(),title:title||section?.title||'Untitled',text,feelings:f};
    const rows=editing?entries.map(e=>e.id===editing?entry:e):[entry,...entries];
    try{if(user)await storeJournal(user.id,entry);else localStorage.setItem(KEY,JSON.stringify(rows));setEntries(rows);setTitle('');setText('');setPicked([]);setCustom('');setEditing(null);setMessage(user?'Entry saved privately to your account.':'Entry saved on this device.');}catch{setMessage('Entry was not saved. Please try again.');}finally{setBusy(false);}
  };
  const deleteEntry=async(id:string)=>{if(busy||!confirm('Delete this entry?'))return;setBusy(true);try{const rows=entries.filter(e=>e.id!==id);if(user)await removeJournal(user.id,id);else localStorage.setItem(KEY,JSON.stringify(rows));setEntries(rows);}catch{setMessage('Entry was not deleted.');}finally{setBusy(false);}};

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
          <p className="mt-3 text-sm text-muted-foreground">{user?"Saved privately to your account.":"Saved in this browser only. Sign in for private account saving."}</p>
          {section&&<div className="mt-6"><p className="whitespace-pre-wrap">{section.journal_prompt}</p><Button asChild variant="link"><Link to="/read/$bookId/$sectionId" params={{bookId:b??'',sectionId:section.id}}>Return to reflection</Link></Button></div>}<p role="status" className="mt-3 text-sm text-primary">{busy?'Loading…':message}</p>
          <div className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full bg-transparent font-display text-2xl outline-none" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="What are you noticing?" className="w-full resize-y rounded-md bg-muted p-4 outline-none focus:ring-2 focus:ring-ring" />
            <div>
              <p className="text-sm text-muted-foreground">How are you feeling? <span className="italic">(optional — skip anytime)</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {feelings.map((f) => (
                  <Button key={f} onClick={() => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))}
                    className={`rounded-full border px-3 py-1 text-sm ${picked.includes(f) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                    {f}
                  </Button>
                ))}
                <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="other…" className="w-28 rounded-full border border-border bg-transparent px-3 py-1 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={()=>void save()} className="rounded-full bg-primary px-6 py-2 text-primary-foreground">{editing ? "Update" : "Save entry"}</Button>
              {editing && <Button onClick={() => { setEditing(null); setTitle(""); setText(""); setPicked([]); }} className="text-sm text-muted-foreground">Cancel</Button>}
            </div>
          </div>
        </section>
        <section>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" className="min-w-0 flex-1 rounded-md border border-border bg-card px-4 py-2 outline-none" />
            <Button onClick={exportAll} disabled={!entries.length} className="rounded-full border border-border px-4 text-sm disabled:opacity-40">Export</Button>
          </div>
          <div className="mt-6 space-y-4">
            {!shown.length && <p className="text-muted-foreground">No entries yet.</p>}
            {shown.map((e) => (
              <article key={e.id} className="rounded-lg bg-secondary/60 p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl text-secondary-foreground">{e.title}</h3>
                  <time className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</time>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm">{e.text}</p>
                {!!e.feelings.length && <p className="mt-2 text-xs italic text-accent-foreground">{e.feelings.join(" · ")}</p>}
                <div className="mt-3 flex gap-4 text-xs">
                  <Button onClick={() => { setEditing(e.id); setTitle(e.title); setText(e.text); setPicked(e.feelings); }} className="underline">Edit</Button>
                  <Button disabled={busy} onClick={()=>void deleteEntry(e.id)} className="text-destructive underline">Delete</Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
