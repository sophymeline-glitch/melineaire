import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/SiteNav';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/reset-password')({ head: () => pageHead('Reset password', 'Set a new password for your Melineaire account.'), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    if (isRecovery) sessionStorage.setItem('melineaire.recovery', 'pending');
    void supabase.auth.getUser().then(({ data }) => setRecovery(Boolean(data.user) && (isRecovery || sessionStorage.getItem('melineaire.recovery') === 'pending')));
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') { setRecovery(true); sessionStorage.setItem('melineaire.recovery', 'pending'); } });
    return () => data.subscription.unsubscribe();
  }, []);
  return <div className="min-h-screen"><SiteNav /><main className="mx-auto max-w-lg px-6 py-16"><h1 className="text-4xl text-primary">Set a new password</h1>
    {saved ? <div className="mt-8"><p>Your password is updated.</p><Button asChild className="mt-5"><Link to="/account">My Account</Link></Button></div> : recovery ? <form className="mt-8 space-y-5" onSubmit={async (event) => { event.preventDefault(); if (password !== confirm) { setMessage('Passwords do not match.'); return; } setBusy(true); try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; sessionStorage.removeItem('melineaire.recovery'); setSaved(true); } catch (error) { setMessage(error instanceof Error ? error.message : 'Please request a new reset link.'); } finally { setBusy(false); } }}>
      <label className="block">New password<input className="field mt-2" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label className="block">Confirm password<input className="field mt-2" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label><Button disabled={busy}>{busy ? 'Updating…' : 'Update password'}</Button>
    </form> : <p className="mt-8 text-muted-foreground">Open the reset link from your email, or <Link to="/auth" className="underline">request a new link</Link>.</p>}
    <p role="status" className="mt-5 text-sm text-muted-foreground">{message}</p>
  </main></div>;
}