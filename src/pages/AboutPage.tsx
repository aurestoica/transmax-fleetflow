import { useNavigate } from 'react-router-dom';
import { useI18n, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Truck, ArrowLeft, LayoutDashboard, Route, MapPin, FileText,
  DollarSign, MessageSquare, Users, Shield, Clock, Eye, Globe,
  ChevronRight, Check, Smartphone, Bell, UserCog, Star
} from 'lucide-react';
import mockAdminDashboard from '@/assets/mock-admin-dashboard.jpg';
import mockDispatcherView from '@/assets/mock-dispatcher-view.jpg';
import mockDriverMobile from '@/assets/mock-driver-mobile.jpg';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group p-5 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h4 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="text-center p-6">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{desc}</p>
    </div>
  );
}

function RoleSection({
  title, desc, features, color, icon: Icon, mockupImg, mockupAlt,
}: {
  title: string;
  desc: string;
  features: { icon: any; title: string; desc: string }[];
  color: string;
  icon: any;
  mockupImg?: string;
  mockupAlt?: string;
}) {
  return (
    <div className="mb-24">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
      </div>
      <p className="text-muted-foreground mb-8 max-w-2xl">{desc}</p>

      {mockupImg && (
        <div className="mb-8 rounded-xl overflow-hidden border border-border shadow-lg bg-muted/30">
          <img
            src={mockupImg}
            alt={mockupAlt || title}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <FeatureCard key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();

  const adminFeatures = [
    { icon: LayoutDashboard, title: t('about.adminF1'), desc: t('about.adminF1Desc') },
    { icon: Route, title: t('about.adminF2'), desc: t('about.adminF2Desc') },
    { icon: FileText, title: t('about.adminF3'), desc: t('about.adminF3Desc') },
    { icon: DollarSign, title: t('about.adminF4'), desc: t('about.adminF4Desc') },
    { icon: MapPin, title: t('about.adminF5'), desc: t('about.adminF5Desc') },
    { icon: Users, title: t('about.adminF6'), desc: t('about.adminF6Desc') },
    { icon: UserCog, title: t('about.adminF7'), desc: t('about.adminF7Desc') },
  ];

  const dispatcherFeatures = [
    { icon: Route, title: t('about.dispatcherF1'), desc: t('about.dispatcherF1Desc') },
    { icon: MessageSquare, title: t('about.dispatcherF2'), desc: t('about.dispatcherF2Desc') },
    { icon: MapPin, title: t('about.dispatcherF3'), desc: t('about.dispatcherF3Desc') },
  ];

  const driverFeatures = [
    { icon: Route, title: t('about.driverF1'), desc: t('about.driverF1Desc') },
    { icon: MessageSquare, title: t('about.driverF2'), desc: t('about.driverF2Desc') },
    { icon: FileText, title: t('about.driverF3'), desc: t('about.driverF3Desc') },
    { icon: MapPin, title: t('about.driverF4'), desc: t('about.driverF4Desc') },
    { icon: UserCog, title: t('about.driverF5'), desc: t('about.driverF5Desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('about.backToLogin')}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
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
            <Button size="sm" onClick={() => navigate('/login')}>
              {t('about.loginBtn')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Truck className="h-4 w-4" />
            TMS Pro
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6 whitespace-pre-line">
            {t('about.heroTitle')}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('about.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/login')} className="gap-2 px-8">
              {t('about.startFree')}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              {t('about.features')}
            </Button>
          </div>

          <p className="mt-12 text-xs text-muted-foreground">{t('about.trustedBy')}</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">{t('about.whyTitle')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('about.whySubtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard icon={Clock} title={t('about.benefit1Title')} desc={t('about.benefit1Desc')} />
            <BenefitCard icon={Eye} title={t('about.benefit2Title')} desc={t('about.benefit2Desc')} />
            <BenefitCard icon={MessageSquare} title={t('about.benefit3Title')} desc={t('about.benefit3Desc')} />
            <BenefitCard icon={Shield} title={t('about.benefit4Title')} desc={t('about.benefit4Desc')} />
          </div>
        </div>
      </section>

      {/* Roles / Features */}
      <section id="roles" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">{t('about.rolesTitle')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('about.rolesSubtitle')}</p>
          </div>

          <RoleSection
            title={t('about.adminTitle')}
            desc={t('about.adminDesc')}
            features={adminFeatures}
            color="bg-primary"
            icon={Shield}
            mockupImg={mockAdminDashboard}
            mockupAlt="Admin Dashboard Preview"
          />

          <RoleSection
            title={t('about.dispatcherTitle')}
            desc={t('about.dispatcherDesc')}
            features={dispatcherFeatures}
            color="bg-[hsl(var(--info))]"
            icon={Users}
            mockupImg={mockDispatcherView}
            mockupAlt="Dispatcher View Preview"
          />

          <RoleSection
            title={t('about.driverTitle')}
            desc={t('about.driverDesc')}
            features={driverFeatures}
            color="bg-[hsl(var(--success))]"
            icon={Truck}
            mockupImg={mockDriverMobile}
            mockupAlt="Driver Mobile App Preview"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">{t('about.ctaTitle')}</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">{t('about.ctaSubtitle')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/login')}
              className="gap-2 px-8"
            >
              {t('about.ctaBtn')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-6 text-primary-foreground/60 text-sm">
            {t('about.loginLink')}{' '}
            <button onClick={() => navigate('/login')} className="underline hover:text-primary-foreground transition-colors">
              {t('about.loginBtn')}
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-muted-foreground">
          {t('auth.copyright')}
        </div>
      </footer>
    </div>
  );
}
