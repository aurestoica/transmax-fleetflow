import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';

interface CompanyStatus {
  isActive: boolean;
  pendingApproval: boolean;
  loading: boolean;
}

export function useCompanyStatus(): CompanyStatus {
  const { companyId } = useAuthStore();
  const [status, setStatus] = useState<CompanyStatus>({ isActive: true, pendingApproval: false, loading: true });

  useEffect(() => {
    if (!companyId) {
      setStatus({ isActive: true, pendingApproval: false, loading: false });
      return;
    }

    supabase
      .from('companies')
      .select('is_active, pending_approval')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus({
            isActive: data.is_active,
            pendingApproval: (data as any).pending_approval ?? false,
            loading: false,
          });
        } else {
          setStatus({ isActive: true, pendingApproval: false, loading: false });
        }
      });
  }, [companyId]);

  return status;
}
