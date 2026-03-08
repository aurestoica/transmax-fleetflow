import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('resetPassword.minLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{t('resetPassword.invalidLink')}</h1>
          <p className="text-muted-foreground mb-4">{t('resetPassword.invalidLinkDesc')}</p>
          <Button onClick={() => window.location.href = '/'}>{t('resetPassword.backToLogin')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Truck className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-display font-bold text-foreground">TMS Pro</h1>
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('resetPassword.success')}</h2>
            <p className="text-muted-foreground">{t('resetPassword.redirecting')}</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t('resetPassword.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('resetPassword.subtitle')}</p>

            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>{t('resetPassword.newPassword')}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>{t('resetPassword.confirmPassword')}</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('resetPassword.submit')}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
