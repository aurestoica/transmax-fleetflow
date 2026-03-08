import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(t('auth.loginError'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-foreground" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-foreground" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-primary-foreground" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Truck className="h-14 w-14 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-3">TRANS MAX SIB</h1>
          <p className="text-primary-foreground/80 text-lg">Management Transport România – España</p>
          <div className="mt-8 flex items-center justify-center gap-8 text-primary-foreground/60 text-sm">
            <span>🇷🇴 România</span>
            <span className="w-12 h-px bg-primary-foreground/30" />
            <span>🇪🇸 España</span>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Truck className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-display font-bold text-foreground">TRANS MAX SIB</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">{t('auth.login')}</h2>
            <p className="text-muted-foreground mt-1 text-sm">Management Transport România – España</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {t('auth.loginBtn')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 TRANS MAX SIB. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
