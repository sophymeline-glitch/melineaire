import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Menu, X, ArrowUpRight, UserRound, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMember } from '@/components/MemberProvider';

const links = [
  { to: '/', label: 'Home' },
  { to: '/reflections', label: 'Reflections' },
  { to: '/studio', label: 'Colour Studio' },
  { to: '/journal', label: 'My Journal' },
] as const;
const forthcoming = ['My Bible', 'The Atmosphere', 'My Creative Garden', 'Library', 'Tutorials'];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useMember();
  return <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
    <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-2xl italic text-primary"><Flower2 className="size-5 shrink-0" />Melineaire<span className="hidden pl-3 font-sans text-[10px] not-italic uppercase tracking-widest text-muted-foreground lg:inline">Let's notice.</span></Link>
      <div className="hidden items-center gap-6 md:flex">{links.slice(1).map((link) => <Link key={link.to} to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-primary" activeProps={{ className: 'text-primary underline underline-offset-8' }}>{link.label}</Link>)}</div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label={user ? 'My Account' : 'Sign in'}><Link to={user ? '/account' : '/auth'}><UserRound /></Link></Button>
        <Button variant="ghost" size="icon" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="destination-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
    </nav>
    {open && <div id="destination-menu" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-border bg-background"><div className="mx-auto grid max-w-4xl gap-8 px-6 py-8 sm:grid-cols-2">
      <div><p className="eyebrow mb-4">Make room</p>{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-border py-3 font-display text-xl text-primary">{link.label}<ArrowUpRight className="size-4" /></Link>)}<Link to={user ? '/account' : '/auth'} onClick={() => setOpen(false)} className="flex items-center justify-between py-3 font-display text-xl text-primary">{loading ? 'My Account' : user ? 'My Account' : 'Join / Sign in'}<ArrowUpRight className="size-4" /></Link></div>
      <div><p className="eyebrow mb-4">Still growing · forthcoming</p>{forthcoming.map((label) => <p key={label} className="border-b border-border py-3 font-display text-xl text-muted-foreground">{label}</p>)}</div>
    </div></div>}
  </header>;
}
