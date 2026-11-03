import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Flower2, Palette, PenLine } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Button } from '@/components/ui/button';
import { palettes } from '@/lib/content';
import { pageHead } from '@/lib/page-head';
import garden from '@/assets/melineaire-creative-world.jpg';
import { useSuspenseQuery } from '@tanstack/react-query';
import { booksOptions } from '@/lib/book-query';
import { BookCollection } from '@/components/BookCollection';

export const Route = createFileRoute('/')({
  head: () => pageHead("Let's notice.", 'Melineaire is a creative sanctuary for noticing, colouring, reflection and growing closer to God.'),
  loader: ({context})=>context.queryClient.ensureQueryData(booksOptions()),
  component: Index,
});

function Index() {
  const {data:books}=useSuspenseQuery(booksOptions());
  const featured=books.filter(b=>b.featured);
  const [hasArtwork, setHasArtwork] = useState(false);
  useEffect(() => { setHasArtwork(Boolean(localStorage.getItem('melineaire.artwork'))); }, []);
  return <div className="min-h-screen"><SiteNav />
    <main>
      <section className="home-garden relative isolate overflow-hidden bg-hero-shade">
        <img src={garden} width={1600} height={1008} alt="A colourful art journal with botanical drawings, vivid paints, and artist pencils" className="absolute inset-0 -z-20 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-hero-shade/15" />
        <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-12 hero-copy text-hero-foreground sm:px-10 sm:py-16">
          <p className="text-[10px] uppercase tracking-[0.2em]">Reflection. Art. Faith. Becoming.</p>
          <h1 className="mt-5 text-5xl leading-tight sm:text-7xl">Melineaire</h1>
          <p className="mt-2 font-display text-4xl italic sm:text-5xl">Let's notice.</p>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-hero-foreground/90">Books to explore. Colours to discover.<br />Space to become — with God at the centre.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild className="bg-background text-primary hover:bg-background/90" size="lg"><Link to="/library">Explore the Library<ArrowRight /></Link></Button><Button asChild variant="ghost" size="lg" className="px-2 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/studio">Begin colouring<ArrowUpRight /></Link></Button></div>
          <p className="mt-10 text-[10px] uppercase tracking-[0.16em] text-hero-foreground/80">Come as you are. There is room for you.</p>
        </div>
      </section>
      <div className="brand-divider"/><section className="editorial-width py-12 sm:py-16">
        <div className="flex items-center gap-3"><Flower2 className="size-4 text-accent-foreground" /><p className="eyebrow">The invitation</p></div>
        <div className="mt-5 grid gap-6 sm:grid-cols-[1.2fr_1fr]"><h2 className="text-3xl leading-snug text-primary sm:text-4xl">A life in colour.<br />A little room to <em>notice.</em></h2><p className="self-center text-sm leading-7 text-muted-foreground">From noticing, we choose. From choosing, we act. From acting, we reflect. Through it all, we seek God and reflect His glory.</p></div>
      </section>
      {featured.length>0&&<section className="wide-width border-t border-border py-14"><p className="eyebrow">The collection</p><h2 className="mb-8 mt-4 text-4xl">Featured books</h2><BookCollection books={featured.slice(0,4)}/><Button asChild variant="link" className="mt-7 px-0"><Link to="/library">Explore the Library<ArrowRight/></Link></Button></section>}
       <section className="bg-sky/25 py-14 sm:py-20"><div className="editorial-width">
        <p className="eyebrow">A moment in Scripture</p><blockquote className="mt-6 max-w-2xl font-display text-3xl leading-relaxed text-primary sm:text-4xl">“Be still, and know that I am God.”</blockquote><p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Psalm 46:10 · King James Version · excerpt</p>
      </div></section>
      <section className="editorial-width py-14 sm:py-20"><p className="eyebrow">Follow your curiosity</p><h2 className="mt-4 text-4xl text-primary">What are you drawn to?</h2>
        <div className="mt-9 divide-y divide-border">{[
          { to: '/library', icon: Flower2, n: '01', title: 'Open a book. Make room for wonder.', subtitle: 'The Melineaire Library', action: 'Explore the collection' },
          { to: '/studio', icon: Palette, n: '02', title: hasArtwork ? 'Return to your colours' : 'A little colour. A little quiet.', subtitle: hasArtwork ? 'Your saved artwork is waiting on this device.' : 'Colour Studio', action: hasArtwork ? 'Continue colouring' : 'Enter the studio' },
          { to: '/reflections', icon: Flower2, n: '03', title: 'Notice what’s beneath the surface.', subtitle: 'Reflections', action: 'Take a moment' },
          { to: '/journal', icon: PenLine, n: '04', title: 'Let the page hold your thoughts.', subtitle: 'My Journal · saved on this device', action: 'Start writing' },
        ].map((item) => <div key={item.to} className="flex items-start gap-4 py-7 sm:gap-8"><span className="pt-1 font-display text-sm italic text-muted-foreground">{item.n}</span><div className="min-w-0 flex-1"><p className="eyebrow">{item.subtitle}</p><h3 className="mt-2 text-2xl text-primary">{item.title}</h3><Button asChild variant="link" className="mt-3 h-auto px-0"><Link to={item.to}>{item.action}<ArrowRight /></Link></Button></div><item.icon className="mt-2 size-7 shrink-0 text-lilac" /></div>)}</div>
      </section>
      <section className="border-y border-border bg-card py-14"><div className="editorial-width"><p className="eyebrow">Colour stories</p><h2 className="mt-4 text-3xl text-primary">A mood, in six shades.</h2><div className="mt-8 grid gap-x-12 gap-y-6 sm:grid-cols-2">{palettes.slice(0, 4).map((palette) => <div key={palette.name}><p className="mb-3 font-display text-lg italic">{palette.name}</p><div className="flex h-8 overflow-hidden rounded-sm">{palette.colors.map((color) => <span key={color} className="flex-1" style={{ backgroundColor: color }} />)}</div></div>)}</div><Button asChild variant="link" className="mt-8 px-0"><Link to="/studio">Find your colours<ArrowRight /></Link></Button></div></section>
    </main>
    <footer className="editorial-width flex flex-wrap items-center justify-between gap-4 py-10"><p className="font-display text-2xl italic text-primary">Melineaire</p><p className="text-xs text-muted-foreground">Let the glory belong to God.</p></footer>
  </div>;
}
