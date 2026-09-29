'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

const OnlineContext = createContext<number | null>(null);

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const key = crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const channel = supabase.channel('online-users', {
      config: { presence: { key } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ t: Date.now() });
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <OnlineContext.Provider value={count}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnlineCount() {
  return useContext(OnlineContext);
}
