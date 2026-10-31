import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const getAccount = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('profiles').select('display_name, avatar_url, preferences').eq('id', context.userId).single();
    if (error) throw new Error('Your profile could not be loaded. Please try again.');
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError) throw new Error('Your account access could not be checked.');
    return { profile: data, isAdmin: isAdmin === true };
  });

export const saveProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ display_name: z.string().trim().max(80) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('profiles').update(data).eq('id', context.userId);
    if (error) throw new Error('Your profile could not be saved. Please try again.');
    return { saved: true };
  });