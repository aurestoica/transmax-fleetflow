import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, LogIn, AlertCircle, Building2, ArrowLeft, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'login' | 'register' | 'success';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({
    company_name: '', company_cif: '', company_address: '', company_email: '', company_phone: '',
    admin_email: '', admin_password: '', admin_full_name: '',
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(t('auth.loginError'));
    } else {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    try {
      const res = await supabase.functions.invoke('register-company', { body: regForm });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || t('register.errorGeneric'));
      }
      setView('success');
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const updateReg = (key: string, val: string) => setRegForm(prev => ({ ...prev, [key]: val }));

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
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-3">TMS Pro</h1>
          <p className="text-primary-foreground/80 text-lg">{t('auth.subtitle')}</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        {/* Language selector - top right */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-muted rounded-lg p-1">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                language === lang.code
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{lang.flag}</span>
              <span className="hidden sm:inline">{lang.label}</span>
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Truck className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-display font-bold text-foreground">TMS Pro</h1>
          </div>

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">{t('auth.login')}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t('auth.subtitle')}</p>
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
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" required className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <><LogIn className="h-4 w-4 mr-2" />{t('auth.loginBtn')}</>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <button
                  onClick={() => setView('register')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  {t('auth.registerCompany')}
                </button>
              </div>

              <div className="mt-8 text-center text-xs text-muted-foreground">
                {t('auth.copyright')}
              </div>
            </>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <>
              <button onClick={() => setView('login')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> {t('register.backToLogin')}
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">{t('register.title')}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t('register.subtitle')}</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {regError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {regError}
                  </div>
                )}

                {/* Company section */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('register.companySection')}</p>
                  <div className="space-y-2">
                    <Label>{t('register.companyName')} *</Label>
                    <Input value={regForm.company_name} onChange={e => updateReg('company_name', e.target.value)} required className="h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t('register.cif')}</Label>
                      <Input value={regForm.company_cif} onChange={e => updateReg('company_cif', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('register.phone')}</Label>
                      <Input value={regForm.company_phone} onChange={e => updateReg('company_phone', e.target.value)} className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('register.address')}</Label>
                    <Input value={regForm.company_address} onChange={e => updateReg('company_address', e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('register.companyEmail')}</Label>
                    <Input type="email" value={regForm.company_email} onChange={e => updateReg('company_email', e.target.value)} className="h-10" />
                  </div>
                </div>

                {/* Admin section */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('register.adminSection')}</p>
                  <div className="space-y-2">
                    <Label>{t('register.fullName')} *</Label>
                    <Input value={regForm.admin_full_name} onChange={e => updateReg('admin_full_name', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('register.adminEmail')} * <span className="text-xs text-muted-foreground font-normal">({t('register.adminEmailHint')})</span></Label>
                    <Input type="email" value={regForm.admin_email} onChange={e => updateReg('admin_email', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('auth.password')} * <span className="text-xs text-muted-foreground font-normal">({t('register.passwordHint')})</span></Label>
                    <Input type="password" value={regForm.admin_password} onChange={e => updateReg('admin_password', e.target.value)} required minLength={6} className="h-10" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={regLoading}>
                  {regLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2" />
                  )}
                  {t('register.submit')}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t('register.disclaimer')}
                </p>
              </form>
            </>
          )}

          {/* SUCCESS VIEW */}
          {view === 'success' && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">{t('register.successTitle')}</h2>
              <p className="text-muted-foreground mb-2">
                <strong>{regForm.company_name}</strong> {t('register.successMsg')}
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                {t('register.successDetail')} <strong>{t('register.successHours')}</strong>.
                {' '}{t('register.successLoginHint')}
              </p>
              <Button onClick={() => { setView('login'); setEmail(regForm.admin_email); }} className="w-full h-11">
                <LogIn className="h-4 w-4 mr-2" /> {t('register.loginNow')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
