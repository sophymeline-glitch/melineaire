import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { LogOut, Save, UserRound } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getAccount, saveProfile } from '@/lib/account.functions';
import { pageHead } from '@/lib/page-head';

const accountOptions = queryOptions({ queryKey: ['account'], queryFn: () => getAccount() });
export const Route = createFileRoute('/_authenticated/account')({
  head: () => pageHead('My Account', 'Your Melineaire member profile and account settings.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountOptions),
  component: Account,
});

function Account() {
  const { data } = useSuspenseQuery(accountOptions);
  const [name, setName] = useState(data.profile.display_name);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveProfile);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return <div className="min-h-screen"><SiteNav /><main className="editorial-width py-16">
    <p className="eyebrow">Your own little corner</p><h1 className="mt-3 text-5xl text-primary">My Account</h1>
    <div className="mt-12 flex items-center gap-4 border-b border-border pb-8"><UserRound className="size-10 text-primary" /><div><p className="font-display text-2xl">{name || 'Welcome to Melineaire'}</p><p className="text-sm text-muted-foreground">{data.isAdmin ? 'Administrator' : 'Member'}</p></div></div>
    {data.isAdmin && <Button asChild className="mt-6"><Link to="/manage-books">Manage Books</Link></Button>}
    <form className="mt-8 max-w-md space-y-5" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setMessage(''); try { await save({ data: { display_name: name } }); await queryClient.invalidateQueries({ queryKey: ['account'] }); setMessage('Your profile is saved.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save your profile.'); } finally { setBusy(false); } }}>
      <label className="block text-sm">Display name<input className="field mt-2" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
      <Button type="submit" disabled={busy}><Save />{busy ? 'Saving…' : 'Save profile'}</Button>
      <p role="status" className="text-sm text-muted-foreground">{message}</p>
    </form>
    <div className="mt-12 border-t border-border pt-8"><Button variant="outline" onClick={async () => { setBusy(true); try { await queryClient.cancelQueries(); queryClient.clear(); const { error } = await supabase.auth.signOut(); if (error) throw error; await navigate({ to: '/auth', replace: true }); } catch { setMessage('Sign out failed. Please try again.'); setBusy(false); } }} disabled={busy}><LogOut />Sign out</Button></div>
  </main></div>;
}