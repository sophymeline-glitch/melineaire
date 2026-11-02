import { createServerFn } from '@tanstack/react-start';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database, Json } from '@/integrations/supabase/types';
import { bookSchema, type Book } from './books';

async function readBooks(client: SupabaseClient<Database>, id?: string, admin = false): Promise<Book[]> {
 let query = client.from('books').select('*').order('sort_order').order('created_at', { ascending: false });
 if (!admin) query = query.eq('status','published');
 if (id) query = query.eq('id',id);
 const { data, error } = await query;
 if(error) throw new Error('The Library could not be loaded. Please try again.');
 const sign = async (p: string | null) => { if(!p) return undefined; const { data }=await client.storage.from('book-media').createSignedUrl(p,1800); return data?.signedUrl?.replace(process.env['SUPABASE_URL'] ?? '', import.meta.env.VITE_SUPABASE_URL); };
 return Promise.all((data ?? []).map(async b => {
  const {data: sections,error: sectionError}=await client.from('book_sections').select('*').eq('book_id',b.id).order('sort_order');
  const {data: files}=await client.from('book_files').select('pdf_path').eq('book_id',b.id).maybeSingle();
  if(sectionError) throw new Error('Book contents could not be loaded.');
  return {...b, pdf_path: files?.pdf_path ?? null, cover_url:await sign(b.cover_path), preview_urls:(await Promise.all(b.preview_paths.map(sign))).filter((u): u is string => Boolean(u)), pdf_url:await sign(files?.pdf_path ?? null), sections: await Promise.all((sections ?? []).map(async s=>({...s,illustration_url:await sign(s.illustration_path),audio_url:await sign(s.audio_path),atmosphere_url:await sign(s.atmosphere_path)}))) };
 }));
}
export const getBooks = createServerFn({method:'GET'}).inputValidator((input: {id?: string} = {})=>z.object({id:z.string().uuid().optional()}).parse(input)).handler(async ({data})=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']; const url=process.env['SUPABASE_URL'];
 if(!key || !url) throw new Error('The Library connection is unavailable.');
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_') && h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 return readBooks(client,data.id);
});
export const manageBooks = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const {data,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(error || data!==true) throw new Error('Only authorised administrators can manage books.');
 return readBooks(context.supabase,undefined,true);
});
export const saveBook = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>bookSchema.parse(input)).handler(async ({data,context})=>{
 const {data:allowed,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(roleError || allowed!==true) throw new Error('Administrator access required.');
 const {error}=await context.supabase.rpc('save_publication',{payload:data as unknown as Json}); if(error) throw new Error('The book could not be saved. Please try again.'); return {id:data.id};
});
export const deleteBook = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input)).handler(async ({data,context})=>{
 const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(allowed!==true) throw new Error('Administrator access required.');
 const {error}=await context.supabase.from('books').delete().eq('id',data.id);if(error)throw new Error('The book could not be deleted.');return {deleted:true};
});
