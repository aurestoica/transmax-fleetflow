import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingCompanies() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { count: c } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('pending_approval', true)
      .eq('is_active', false);
    setCount(c ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('pending-companies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { count, loading, refresh: load };
}
