import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { mandalaSvg } from "@/lib/lineart";
import { palettes, reflections } from "@/lib/content";

export const Route = createFileRoute("/studio")({
  validateSearch: (s: Record<string, unknown>): { r?: string } => (typeof s.r === "string" ? { r: s.r } : {}),
  head: () => ({
    meta: [
      { title: "Colour Studio — Melineaire" },
      { name: "description", content: "Colour illustrations in your browser with fill, pencil, marker, spray and more." },
      { property: "og:title", content: "Colour Studio — Melineaire" },
      { property: "og:description", content: "A calm, working colouring studio." },
    ],
  }),
  component: Studio,
});

const SIZE = 800;
type Tool = "fill" | "pencil" | "marker" | "spray" | "crayon" | "eraser";
const tools: { id: Tool; label: string }[] = [
  { id: "fill", label: "Fill" }, { id: "pencil", label: "Pencil" }, { id: "marker", label: "Marker" },
  { id: "spray", label: "Spray" }, { id: "crayon", label: "Crayon" }, { id: "eraser", label: "Eraser" },
];
const SAVE_KEY = "melineaire.artwork";

function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function Studio() {
  const { r } = Route.useSearch();
  const reflection = reflections.find((x) => x.slug === r);
  const colorRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const lineData = useRef<Uint8ClampedArray | null>(null);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>("fill");
  const [color, setColor] = useState(palettes[4].colors[2]);
  const [size, setSize] = useState(14);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showRef, setShowRef] = useState(true);
  const [, force] = useState(0);

  const ctx = () => colorRef.current!.getContext("2d", { willReadFrequently: true })!;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const l = lineRef.current!.getContext("2d")!;
      l.drawImage(img, 0, 0, SIZE, SIZE);
      lineData.current = l.getImageData(0, 0, SIZE, SIZE).data;
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(mandalaSvg(SIZE));
    const c = ctx();
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, SIZE, SIZE);
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { const s = new Image(); s.onload = () => c.drawImage(s, 0, 0); s.src = saved; }
  }, []);

  const snapshot = () => {
    undo.current.push(ctx().getImageData(0, 0, SIZE, SIZE));
    if (undo.current.length > 30) undo.current.shift();
    redo.current = []; force((n) => n + 1);
  };

  const flood = (sx: number, sy: number) => {
    const c = ctx(); const img = c.getImageData(0, 0, SIZE, SIZE); const d = img.data;
    const line = lineData.current; const [cr, cg, cb] = hexToRgb(color);
    const isWall = (i: number) => !!line && line[i + 3] > 90;
    const start = (sy * SIZE + sx) * 4;
    if (isWall(start)) return;
    const tr = d[start], tg = d[start + 1], tb = d[start + 2];
    const nr = Math.round(cr * opacity + tr * (1 - opacity)), ng = Math.round(cg * opacity + tg * (1 - opacity)), nb = Math.round(cb * opacity + tb * (1 - opacity));
    if (Math.abs(tr - nr) + Math.abs(tg - ng) + Math.abs(tb - nb) < 3) return;
    const match = (i: number) => !isWall(i) && Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) < 40;
    const stack = [sx, sy]; const seen = new Uint8Array(SIZE * SIZE);
    while (stack.length) {
      const y = stack.pop()!, x = stack.pop()!;
      const p = y * SIZE + x;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || seen[p] || !match(p * 4)) continue;
      seen[p] = 1; const i = p * 4;
      d[i] = nr; d[i + 1] = ng; d[i + 2] = nb; d[i + 3] = 255;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    c.putImageData(img, 0, 0);
  };

  const pos = (e: React.PointerEvent) => {
    const rect = colorRef.current!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - rect.left) / rect.width) * SIZE), y: Math.floor(((e.clientY - rect.top) / rect.height) * SIZE) };
  };

  const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const c = ctx(); c.save();
    c.globalAlpha = opacity; c.strokeStyle = tool === "eraser" ? "#ffffff" : color; c.fillStyle = c.strokeStyle;
    c.lineCap = "round"; c.lineJoin = "round";
    if (tool === "spray") {
      const steps = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) / 4);
      for (let s = 0; s <= steps; s++) {
        const x = a.x + ((b.x - a.x) * s) / steps, y = a.y + ((b.y - a.y) * s) / steps;
        for (let k = 0; k < size * 1.5; k++) {
          const ang = Math.random() * Math.PI * 2, rad = Math.random() * size * 1.4;
          c.fillRect(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad, 1.4, 1.4);
        }
      }
    } else if (tool === "crayon") {
      c.globalAlpha = opacity * 0.7;
      for (let k = 0; k < 4; k++) {
        c.lineWidth = size * (0.3 + Math.random() * 0.5);
        c.beginPath();
        c.moveTo(a.x + (Math.random() - 0.5) * size * 0.6, a.y + (Math.random() - 0.5) * size * 0.6);
        c.lineTo(b.x + (Math.random() - 0.5) * size * 0.6, b.y + (Math.random() - 0.5) * size * 0.6);
        c.stroke();
      }
    } else {
      c.lineWidth = tool === "pencil" ? Math.max(1, size / 4) : tool === "marker" ? size : size * 1.5;
      if (tool === "marker") c.globalAlpha = opacity * 0.85;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.restore();
  };

  const down = (e: React.PointerEvent) => {
    const p = pos(e); snapshot();
    if (tool === "fill") { flood(p.x, p.y); return; }
    (e.target as Element).setPointerCapture(e.pointerId);
    last.current = p; stroke(p, p);
  };
  const move = (e: React.PointerEvent) => {
    if (!last.current) return;
    const p = pos(e); stroke(last.current, p); last.current = p;
  };
  const up = () => { last.current = null; };

  const doUndo = useCallback(() => {
    const s = undo.current.pop(); if (!s) return;
    redo.current.push(ctx().getImageData(0, 0, SIZE, SIZE)); ctx().putImageData(s, 0, 0); force((n) => n + 1);
  }, []);
  const doRedo = useCallback(() => {
    const s = redo.current.pop(); if (!s) return;
    undo.current.push(ctx().getImageData(0, 0, SIZE, SIZE)); ctx().putImageData(s, 0, 0); force((n) => n + 1);
  }, []);

  const clear = () => {
    if (!confirm("Clear all your colour? The illustration stays.")) return;
    snapshot(); const c = ctx(); c.fillStyle = "#ffffff"; c.fillRect(0, 0, SIZE, SIZE);
  };
  const composite = () => {
    const out = document.createElement("canvas"); out.width = SIZE; out.height = SIZE;
    const o = out.getContext("2d")!; o.drawImage(colorRef.current!, 0, 0); o.drawImage(lineRef.current!, 0, 0);
    return out;
  };
  const save = () => { localStorage.setItem(SAVE_KEY, colorRef.current!.toDataURL()); alert("Saved on this device."); };
  const exportPng = () => {
    const a = document.createElement("a"); a.href = composite().toDataURL("image/png"); a.download = "melineaire-artwork.png"; a.click();
  };

  const btn = "rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-40";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Tools</p>
            <div className="grid grid-cols-3 gap-2">
              {tools.map((t) => (
                <button key={t.id} onClick={() => setTool(t.id)}
                  className={`rounded-xl px-2 py-2 text-sm ${tool === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <label className="block">Size {size}<input type="range" min={2} max={60} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-primary" /></label>
            <label className="block">Opacity {Math.round(opacity * 100)}%<input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-primary" /></label>
            <label className="flex items-center gap-3">Custom colour<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded" /></label>
          </div>
          <div className="space-y-3">
            {palettes.map((p) => (
              <div key={p.name}>
                <p className="mb-1 font-display text-sm italic">{p.name}</p>
                <div className="flex gap-1">
                  {p.colors.map((c) => (
                    <button key={c} aria-label={c} onClick={() => setColor(c)}
                      className={`h-7 flex-1 rounded-md ${color === c ? "ring-2 ring-primary ring-offset-2" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button className={btn} onClick={doUndo} disabled={!undo.current.length}>Undo</button>
            <button className={btn} onClick={doRedo} disabled={!redo.current.length}>Redo</button>
            <button className={btn} onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>−</button>
            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <button className={btn} onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
            <button className={btn} onClick={clear}>Clear</button>
            <span className="flex-1" />
            <button className={btn} onClick={save}>Save</button>
            <button className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground" onClick={exportPng}>Export image</button>
          </div>
          <div className="relative overflow-auto rounded-3xl border border-border bg-muted p-3 shadow-soft" style={{ maxHeight: "80vh" }}>
            <div className="relative mx-auto aspect-square" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 760 : undefined }}>
              <canvas ref={colorRef} width={SIZE} height={SIZE} className="absolute inset-0 h-full w-full touch-none rounded-2xl"
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
              <canvas ref={lineRef} width={SIZE} height={SIZE} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
          </div>
          {reflection && (
            <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-4 shadow-soft">
              <button onClick={() => setShowRef((s) => !s)} className="flex w-full justify-between text-left font-display text-lg text-primary">
                {reflection.title}<span>{showRef ? "–" : "+"}</span>
              </button>
              {showRef && (
                <div className="mt-2 space-y-2 text-sm">
                  <p className="text-muted-foreground">{reflection.body}</p>
                  {reflection.questions.map((q) => <p key={q} className="italic text-secondary-foreground">{q}</p>)}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
