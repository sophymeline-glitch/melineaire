import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

const MemberContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export const useMember = () => useContext(MemberContext);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let transitioned = false;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      transitioned = true;
      setUser(session?.user ?? null);
      setLoading(false);
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active && !transitioned) { setUser(data.user); setLoading(false); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <MemberContext.Provider value={{ user, loading }}>{children}</MemberContext.Provider>;
}