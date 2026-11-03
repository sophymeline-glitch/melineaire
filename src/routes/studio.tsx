import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { StudioHelp } from '@/components/StudioHelp';
import { booksOptions } from '@/lib/book-query';
import { artworkKey } from '@/lib/books';
import { Undo2, Redo2, ZoomIn, ZoomOut, Save, Download, Trash2, PaintBucket, Pencil, Paintbrush, SprayCan, Eraser, Highlighter } from 'lucide-react';
import { SiteNav } from "@/components/SiteNav";
import { mandalaSvg } from "@/lib/lineart";
import { palettes, reflections } from "@/lib/content";

export const Route = createFileRoute("/studio")({
  validateSearch: (s: Record<string, unknown>): { r?: string; b?: string; s?: string } => ({ ...(typeof s['r']==='string'?{r:s['r']}:{}), ...(typeof s['b']==='string'?{b:s['b']}:{}), ...(typeof s['s']==='string'?{s:s['s']}: {}) }),
  head: () => ({
    meta: [
      { title: "Colour Studio — Melineaire" },
      { name: "description", content: "Colour illustrations in your browser with fill, pencil, marker, spray and more." },
      { property: "og:title", content: "Colour Studio — Melineaire" },
      { property: "og:description", content: "A calm, working colouring studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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


function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function Studio() {
  const { r, b, s: sectionId } = Route.useSearch();
  const {data: bookData} = useQuery({...booksOptions(b), enabled: Boolean(b)});
  const book = bookData?.[0];
  const section = book?.sections.find(x=>x.id===sectionId);
  const reflection = section ? {title:section.title,body:section.reflection,questions:section.questions} : reflections.find((x) => x.slug === r);
  const saveKey = artworkKey(b,sectionId);
  const [saveMessage,setSaveMessage]=useState('');
  const [illustrationReady,setIllustrationReady]=useState(false);
  const [savedColors,setSavedColors]=useState<string[]>([]);
  const [mixA,setMixA]=useState('#8050f5'); const [mixB,setMixB]=useState('#62c8ff'); const [mixRatio,setMixRatio]=useState(50);
  const mixture='#'+hexToRgb(mixA).map((v,i)=>Math.round(v*(1-mixRatio/100)+(hexToRgb(mixB)[i] ?? 0)*mixRatio/100).toString(16).padStart(2,'0')).join('');
  useEffect(()=>{try{setSavedColors(JSON.parse(localStorage.getItem('melineaire.colors') ?? '[]'));}catch{setSavedColors([]);}},[]);
  const colorRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const lineData = useRef<Uint8ClampedArray | null>(null);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>("fill");
  const [color, setColor] = useState(palettes[0]?.colors[1] ?? "#8050f5");
  const [size, setSize] = useState(14);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showRef, setShowRef] = useState(true);
  const [, force] = useState(0);

  const ctx = () => { const c=colorRef.current?.getContext('2d',{willReadFrequently:true}); if(!c) throw new Error('Colour canvas unavailable'); return c; };

  useEffect(() => {
    if(b && !section) return;
    const l=lineRef.current?.getContext('2d'); if(!l) return;
    let active=true;
    const c=ctx(); const img=new Image(); img.crossOrigin='anonymous';
    c.fillStyle='#ffffff';c.fillRect(0,0,SIZE,SIZE);l.clearRect(0,0,SIZE,SIZE);
    undo.current=[];redo.current=[];lineData.current=null;setIllustrationReady(false);
    img.onload=()=>{if(!active)return;l.drawImage(img,0,0,SIZE,SIZE);const image=l.getImageData(0,0,SIZE,SIZE);if(section){for(let i=0;i<image.data.length;i+=4){const light=Math.min(image.data[i] ?? 255,image.data[i+1] ?? 255,image.data[i+2] ?? 255);image.data[i+3]=Math.round((image.data[i+3] ?? 255)*(1-light/255));}l.putImageData(image,0,0);}lineData.current=l.getImageData(0,0,SIZE,SIZE).data;setIllustrationReady(true);};
    img.onerror=()=>setSaveMessage('The illustration could not be loaded. Return to the book and try again.');
    img.src=section?.illustration_url ?? 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(mandalaSvg(SIZE));
    try{const saved=localStorage.getItem(saveKey);if(saved){const image=new Image();image.onload=()=>{if(active)c.drawImage(image,0,0);};image.src=saved;}}catch{setSaveMessage('Device storage is unavailable. Export your artwork to keep it.');}
    return()=>{active=false;};
  }, [b, section, saveKey]);

  const snapshot = () => {
    undo.current.push(ctx().getImageData(0, 0, SIZE, SIZE));
    if (undo.current.length > 30) undo.current.shift();
    redo.current = []; force((n) => n + 1);
  };

  const flood = (sx: number, sy: number) => {
    const c = ctx(); const img = c.getImageData(0, 0, SIZE, SIZE); const d = img.data as unknown as number[];
    const line = lineData.current; const [cr, cg, cb] = hexToRgb(color);
    const isWall = (i: number) => !!line && (line[i + 3] ?? 0) > 90;
    const start = (sy * SIZE + sx) * 4;
    if (isWall(start)) return;
    const tr = (d[start] ?? 0), tg = (d[start + 1] ?? 0), tb = (d[start + 2] ?? 0);
    const nr = Math.round(cr * opacity + tr * (1 - opacity)), ng = Math.round(cg * opacity + tg * (1 - opacity)), nb = Math.round(cb * opacity + tb * (1 - opacity));
    if (Math.abs(tr - nr) + Math.abs(tg - ng) + Math.abs(tb - nb) < 3) return;
    const match = (i: number) => !isWall(i) && Math.abs((d[i] ?? 0) - tr) + Math.abs((d[i + 1] ?? 0) - tg) + Math.abs((d[i + 2] ?? 0) - tb) < 40;
    const stack = [sx, sy]; const seen = new Uint8Array(SIZE * SIZE);
    while (stack.length) {
      const y = stack.pop(), x = stack.pop(); if(y===undefined || x===undefined) break;
      const p = y * SIZE + x;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || seen[p] || !match(p * 4)) continue;
      seen[p] = 1; const i = p * 4;
      d[i] = nr; d[i + 1] = ng; d[i + 2] = nb; d[i + 3] = 255;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    c.putImageData(img, 0, 0);
  };

  const pos = (e: React.PointerEvent) => {
    const rect = colorRef.current?.getBoundingClientRect(); if(!rect) return {x:0,y:0};
    return { x: Math.floor(((e.clientX - rect.left) / rect.width) * SIZE), y: Math.floor(((e.clientY - rect.top) / rect.height) * SIZE) };
  };

  const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const c = ctx(); c.save();
    c.globalAlpha = opacity; c.strokeStyle = tool === "eraser" ? "#ffffff" : color; c.fillStyle = tool === "eraser" ? "#ffffff" : color;
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
    if(!illustrationReady)return;
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
    const o = out.getContext("2d"); if(!o || !colorRef.current || !lineRef.current) return out; o.drawImage(colorRef.current, 0, 0); o.drawImage(lineRef.current, 0, 0);
    return out;
  };
  const save = () => { if(!colorRef.current)return;try{localStorage.setItem(saveKey,colorRef.current.toDataURL());setSaveMessage('Saved on this device.');}catch{setSaveMessage('Could not save. Export your image to keep a copy.');} };
  const exportPng = () => {
    const a = document.createElement("a"); a.href = composite().toDataURL("image/png"); a.download = "melineaire-artwork.png"; a.click();
  };

  const btn = "shrink-0";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="order-2 lg:order-1 space-y-6 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Tools</p>
            <div className="grid grid-cols-3 gap-2">
              {tools.map((t) => (
                <Button key={t.id} title={t.label} aria-label={t.label} variant="ghost" onClick={() => setTool(t.id)}
                  className={`rounded-md px-2 py-2 text-sm ${tool === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"}`}>
                  {(() => { const Icon=({fill:PaintBucket,pencil:Pencil,marker:Highlighter,spray:SprayCan,crayon:Paintbrush,eraser:Eraser})[t.id];return <Icon className="size-4"/>;})()}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <label className="block">Size {size}<input type="range" min={2} max={60} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-primary" /></label>
            <label className="block">Opacity {Math.round(opacity * 100)}%<input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-primary" /></label>
            <label className="flex items-center gap-3">Custom colour<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded" /></label>
          </div>
          <div className="border-t border-border pt-5"><p className="font-display text-lg">Colour mixer</p><div className="mt-3 flex items-center gap-3"><input type="color" aria-label="First mixing colour" value={mixA} onChange={e=>setMixA(e.target.value)}/><span>+</span><input type="color" aria-label="Second mixing colour" value={mixB} onChange={e=>setMixB(e.target.value)}/></div><label className="mt-3 block text-sm">Blend {mixRatio}%<input type="range" min={0} max={100} value={mixRatio} onChange={e=>setMixRatio(Number(e.target.value))} className="w-full accent-primary"/></label><Button className="mt-3 w-full" variant="outline" onClick={()=>setColor(mixture)}><span className="size-4 rounded-sm" style={{backgroundColor:mixture}}/>Use mixture</Button><Button className="mt-2 w-full" variant="ghost" onClick={()=>{try{const colors=[...new Set([...savedColors,color])];localStorage.setItem('melineaire.colors',JSON.stringify(colors));setSavedColors(colors);}catch{setSaveMessage('Saved colours are unavailable on this device.');}}}><Save/>Save colour</Button>{savedColors.length>0&&<div className="mt-4"><p className="mb-2 text-sm">Saved colours</p><div className="flex flex-wrap gap-2">{savedColors.map(c=><Button key={c} size="icon" variant="ghost" aria-label={`Saved ${c}`} title={c} style={{backgroundColor:c}} onClick={()=>setColor(c)}/>)}</div></div>}</div>
          <div className="space-y-3">
            {palettes.map((p) => (
              <div key={p.name}>
                <p className="mb-1 font-display text-sm italic">{p.name}</p>
                <div className="flex gap-1">
                  {p.colors.map((c) => (
                    <Button key={c} variant="ghost" title={c} aria-label={c} onClick={() => setColor(c)}
                      className={`h-7 flex-1 rounded-md ${color === c ? "ring-2 ring-primary ring-offset-2" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="order-1 lg:order-2 min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Colour Studio</h1><StudioHelp/></div>{b&&section&&<Button asChild variant="link" className="mb-4 px-0"><Link to="/read/$bookId/$sectionId" params={{bookId:b,sectionId:section.id}}>Return to reflection & next section</Link></Button>}<p role="status" className="mb-3 text-sm text-primary">{saveMessage || (!illustrationReady ? "Loading illustration…" : "")}</p><div className="mb-4 flex flex-wrap items-center gap-2">
            <Button className={btn} onClick={doUndo} aria-label="Undo" title="Undo" size="icon" variant="outline" disabled={!undo.current.length}><Undo2/></Button>
            <Button className={btn} onClick={doRedo} aria-label="Redo" title="Redo" size="icon" variant="outline" disabled={!redo.current.length}><Redo2/></Button>
            <Button className={btn} onClick={() => setZoom((z) => Math.max(1, z - 0.25))} aria-label="Zoom out" title="Zoom out" size="icon" variant="outline"><ZoomOut/></Button>
            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button className={btn} onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in" title="Zoom in" size="icon" variant="outline"><ZoomIn/></Button>
            <Button className={btn} onClick={clear} aria-label="Clear colour" title="Clear colour" size="icon" variant="outline"><Trash2/></Button>
            <span className="flex-1" />
            <Button className={btn} onClick={save} variant="outline"><Save/>Save</Button>
            <Button className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground" onClick={exportPng}><Download/>Export image</Button>
          </div>
          <div className="relative overflow-auto rounded-lg border border-border bg-muted p-3 shadow-soft" style={{ maxHeight: "80vh" }}>
            <div className="relative mx-auto aspect-square" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 760 : undefined }}>
              <canvas ref={colorRef} width={SIZE} height={SIZE} className="absolute inset-0 h-full w-full touch-none rounded-lg"
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
              <canvas ref={lineRef} width={SIZE} height={SIZE} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
          </div>
          {reflection && (
            <div className="mt-5 w-full rounded-lg border border-border bg-card p-4 shadow-soft">
              <Button onClick={() => setShowRef((s) => !s)} variant="ghost" className="flex h-auto w-full justify-between whitespace-normal text-left font-display text-lg text-primary">
                {reflection.title}<span>{showRef ? "–" : "+"}</span>
              </Button>
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
