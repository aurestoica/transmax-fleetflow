import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, LogIn, AlertCircle, Building2, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

type View = 'login' | 'register' | 'success';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
        throw new Error(res.data?.error || res.error?.message || 'Eroare la înregistrare');
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
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-3">TRANS MAX SIB</h1>
          <p className="text-primary-foreground/80 text-lg">Management Transport România – España</p>
          <div className="mt-8 flex items-center justify-center gap-8 text-primary-foreground/60 text-sm">
            <span>🇷🇴 România</span>
            <span className="w-12 h-px bg-primary-foreground/30" />
            <span>🇪🇸 España</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Truck className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-display font-bold text-foreground">TRANS MAX SIB</h1>
          </div>

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <>
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
                  Înregistrează o companie nouă
                </button>
              </div>

              <div className="mt-8 text-center text-xs text-muted-foreground">
                © 2026 Transport Management Platform
              </div>
            </>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <>
              <button onClick={() => setView('login')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Înapoi la autentificare
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Companie nouă</h2>
                <p className="text-muted-foreground mt-1 text-sm">Completează datele pentru a solicita activarea contului</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date companie</p>
                  <div className="space-y-2">
                    <Label>Denumire companie *</Label>
                    <Input value={regForm.company_name} onChange={e => updateReg('company_name', e.target.value)} required className="h-10" placeholder="SC Exemplu Transport SRL" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>CIF</Label>
                      <Input value={regForm.company_cif} onChange={e => updateReg('company_cif', e.target.value)} className="h-10" placeholder="RO12345678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input value={regForm.company_phone} onChange={e => updateReg('company_phone', e.target.value)} className="h-10" placeholder="0722..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adresă</Label>
                    <Input value={regForm.company_address} onChange={e => updateReg('company_address', e.target.value)} className="h-10" placeholder="Str. Exemplu, Sibiu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email companie</Label>
                    <Input type="email" value={regForm.company_email} onChange={e => updateReg('company_email', e.target.value)} className="h-10" placeholder="office@companie.ro" />
                  </div>
                </div>

                {/* Admin section */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cont administrator</p>
                  <div className="space-y-2">
                    <Label>Nume complet *</Label>
                    <Input value={regForm.admin_full_name} onChange={e => updateReg('admin_full_name', e.target.value)} required className="h-10" placeholder="Ion Popescu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email * <span className="text-xs text-muted-foreground font-normal">(va fi folosit pentru autentificare)</span></Label>
                    <Input type="email" value={regForm.admin_email} onChange={e => updateReg('admin_email', e.target.value)} required className="h-10" placeholder="admin@companie.ro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parolă * <span className="text-xs text-muted-foreground font-normal">(minim 6 caractere)</span></Label>
                    <Input type="password" value={regForm.admin_password} onChange={e => updateReg('admin_password', e.target.value)} required minLength={6} className="h-10" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={regLoading}>
                  {regLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2" />
                  )}
                  Trimite cererea de înregistrare
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Contul va fi verificat și activat de administratorul platformei în maxim 48 de ore.
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
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Cerere trimisă!</h2>
              <p className="text-muted-foreground mb-2">
                Compania <strong>{regForm.company_name}</strong> a fost înregistrată cu succes.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Contul va fi verificat și activat de administratorul platformei în maxim <strong>48 de ore</strong>.
                Te poți autentifica imediat pentru a vizualiza panoul, dar funcționalitățile vor fi disponibile după activare.
              </p>
              <Button onClick={() => { setView('login'); setEmail(regForm.admin_email); }} className="w-full h-11">
                <LogIn className="h-4 w-4 mr-2" /> Autentifică-te acum
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
