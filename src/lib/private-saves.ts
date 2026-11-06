import { supabase } from '@/integrations/supabase/client';

export type JournalEntry = { id: string; date: string; title: string; text: string; feelings: string[] };
export async function readPosition(userId: string, bookId: string) {
  const { data, error } = await supabase.from('book_progress').select('section_id').eq('user_id',userId).eq('book_id',bookId).maybeSingle();
  if(error) throw new Error('Reading place could not be loaded.');
  return data?.section_id ?? null;
}
export async function storePosition(userId: string, bookId: string, sectionId: string) {
  const { error } = await supabase.from('book_progress').upsert({user_id:userId,book_id:bookId,section_id:sectionId,updated_at:new Date().toISOString()});
  if(error) throw new Error('Reading place was not saved.');
}
export async function readNote(userId: string, bookId: string, sectionId: string) {
  const { data,error } = await supabase.from('reflection_notes').select('text').eq('user_id',userId).eq('book_id',bookId).eq('section_id',sectionId).maybeSingle();
  if(error) throw new Error('Your writing could not be loaded.');
  return data?.text ?? '';
}
export async function storeNote(userId: string, bookId: string, sectionId: string, text: string) {
  const { error } = await supabase.from('reflection_notes').upsert({user_id:userId,book_id:bookId,section_id:sectionId,text,updated_at:new Date().toISOString()});
  if(error) throw new Error('Your writing was not saved.');
}
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