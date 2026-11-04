import { supabase } from '@/integrations/supabase/client';

export type JournalEntry = { id: string; date: string; title: string; text: string; feelings: string[] };
export async function readArtwork(userId: string, key: string) {
  const { data, error } = await supabase.from('artwork_saves').select('progress_png,completed_png').eq('user_id', userId).eq('artwork_key', key).maybeSingle();
  if (error) throw new Error('Your saved artwork could not be loaded.');
  return data;
}
export async function storeArtwork(userId: string, key: string, progress: string, completed?: string) {
  const { error } = await supabase.from('artwork_saves').upsert({ user_id: userId, artwork_key: key, progress_png: progress, ...(completed ? { completed_png: completed } : {}), updated_at: new Date().toISOString() });
  if (error) throw new Error('Artwork was not saved. Please try again.');
}
export async function readJournal(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase.from('journal_entries').select('id,date,title,text,feelings').eq('user_id', userId).order('date', { ascending: false });
  if (error) throw new Error('Your journal could not be loaded.');
  return data ?? [];
}
export async function storeJournal(userId: string, entry: JournalEntry) {
  const { error } = await supabase.from('journal_entries').upsert({ ...entry, user_id: userId });
  if (error) throw new Error('Your entry was not saved. Please try again.');
}
export async function removeJournal(userId: string, id: string) {
  const { error } = await supabase.from('journal_entries').delete().eq('user_id', userId).eq('id', id);
  if (error) throw new Error('Your entry was not deleted.');
}