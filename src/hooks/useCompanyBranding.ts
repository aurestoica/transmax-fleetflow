import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';

interface CompanyBranding {
  name: string;
  logoUrl: string | null;
}

export function useCompanyBranding() {
  const { companyId } = useAuthStore();
  const [branding, setBranding] = useState<CompanyBranding>({ name: '', logoUrl: null });

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('companies')
      .select('name, logo_url')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBranding({ name: data.name, logoUrl: (data as any).logo_url || null });
        }
      });
  }, [companyId]);

  return branding;
}
