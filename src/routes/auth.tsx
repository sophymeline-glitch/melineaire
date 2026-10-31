import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useMember } from '@/components/MemberProvider';
import { pageHead } from '@/lib/page-head';
import '@lovable.dev/cloud-auth-js/styles.css';

export const Route = createFileRoute('/auth')({ head: () => pageHead('Welcome', 'Join Melineaire or sign in to your personal creative space.'), component: Auth });
function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useMember();
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('If an account exists, a password reset link will arrive in your email.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name } } });
        if (error) throw error;
        if (data.session) await navigate({ to: '/account' });
        else setMessage('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: '/account' });
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') {
    setMessage(''); setBusy(true);
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (result.error) throw result.error; if (!result.redirected) await navigate({ to: '/account' }); }
    catch { setMessage('Sign in could not be completed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen"><SiteNav /><main className="mx-auto max-w-lg px-6 py-16">
    <p className="eyebrow">Come as you are</p><h1 className="mt-3 text-5xl text-primary">{mode === 'signup' ? 'Make room for you.' : mode === 'forgot' ? 'A fresh start.' : 'Welcome back.'}</h1>
    {user ? <div className="mt-10"><p className="mb-6 text-muted-foreground">You’re signed in.</p><Button asChild><Link to="/account">My Account<ArrowRight /></Link></Button></div> : <>
      <form onSubmit={submit} className="mt-10 space-y-5">
        {mode === 'signup' && <label className="block text-sm">Display name<input autoComplete="name" className="field mt-2" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <label className="block text-sm">Email<input type="email" required autoComplete="email" className="field mt-2" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== 'forgot' && <label className="block text-sm">Password<input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="field mt-2" value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        <Button className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}<ArrowRight /></Button>
      </form>
      {mode !== 'forgot' && <div className="mt-6 space-y-3"><Button variant="outline" className="w-full" disabled={busy} onClick={() => social('google')}>Continue with Google</Button><Button className="lovable-auth-button w-full" disabled={busy} onClick={() => social('lovable')}>Continue with Lovable</Button></div>}
      <div className="mt-6 flex flex-wrap gap-3"><Button variant="link" className="px-0" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}</Button><Button variant="link" className="px-0" onClick={() => { setMode(mode === 'forgot' ? 'signin' : 'forgot'); setMessage(''); }}>{mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}</Button></div>
    </>}
    <p role="status" className="mt-5 text-sm text-muted-foreground">{message}</p>
  </main></div>;
}