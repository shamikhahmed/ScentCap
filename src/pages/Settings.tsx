import { Link, useNavigate } from 'react-router-dom';
import { Crown, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { useApp } from '@/context/AppContext';
import { usePro } from '@/context/ProContext';
import { exportAllData, exportWearHistoryCsv, importAllData } from '@/db';
import { exitDemo, loadDemoData } from '@/services/demo';
import { getDailyWeather, requestLocation } from '@/services/weather';
import { LAUNCH_PREVIEW } from '@/lib/pro';

export function SettingsPage() {
  const { profile, prefs, setPrefs, setProfile, refresh } = useApp();
  const { isPro, openPaywall, deactivatePro } = usePro();
  const navigate = useNavigate();

  const exportData = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scentcap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const exportWearCsv = async () => {
    const csv = await exportWearHistoryCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scentcap-wear-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await importAllData(await file.text());
      await refresh();
    };
    input.click();
  };

  const refreshLocation = async () => {
    if (!profile) return;
    const loc = await requestLocation();
    const nextProfile = loc
      ? { ...profile, lat: loc.lat, lon: loc.lon, cityLabel: loc.label }
      : profile;
    if (loc) await setProfile(nextProfile);
    await getDailyWeather(nextProfile, true);
    await refresh();
  };

  return (
    <div className="safe-pt px-5 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>

      <Card className={`space-y-4 ${isPro ? 'border-[var(--color-accent)]/40' : ''}`} data-testid="pro-settings-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center shrink-0">
            {LAUNCH_PREVIEW ? <Sparkles size={20} className="text-[var(--color-accent)]" /> : <Crown size={20} className="text-[var(--color-accent)]" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {LAUNCH_PREVIEW ? 'Launch preview' : isPro ? 'ScentCap Pro' : 'Upgrade to Pro'}
            </p>
            <p className="text-sm text-stone-400 mt-1">
              {LAUNCH_PREVIEW
                ? 'Every feature is free while we polish the App Store release — Analytics, Layering Lab, Travel Kit, and unlimited bottles.'
                : isPro
                  ? 'All features unlocked — Analytics, Layering Lab, Travel Kit, and unlimited bottles.'
                  : 'Pro unlocks analytics, layering, travel kit, export, and unlimited bottles.'}
            </p>
          </div>
        </div>
        {LAUNCH_PREVIEW ? (
          <Button variant="outline" size="sm" onClick={() => openPaywall()} data-testid="pro-roadmap-btn">
            Pro subscriptions — coming to App Store
          </Button>
        ) : isPro ? (
          <Button variant="ghost" size="sm" onClick={deactivatePro} data-testid="pro-deactivate">
            Reset Pro (dev)
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => openPaywall()} data-testid="upgrade-pro-btn">
              Upgrade — $4.99/mo
            </Button>
            <Button variant="outline" onClick={() => openPaywall()} data-testid="upgrade-pro-yearly">
              Yearly — $39.99/yr
            </Button>
          </div>
        )}
      </Card>

      <Card className="privacy-badge border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
            <Shield size={20} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="font-semibold">Your data stays on this device</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              No account, no cloud sync, no tracking. Export a JSON backup anytime before switching phones.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="flex-1" onClick={exportData}>Export wardrobe</Button>
          <a
            href={`${import.meta.env.BASE_URL}privacy.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="ghost" size="sm" className="w-full">Privacy policy</Button>
          </a>
        </div>
      </Card>

      <Link to="/analytics" className="text-sm text-[var(--color-accent)]">
        Collection analytics
      </Link>
      <Link to="/travel" className="text-sm text-[var(--color-accent)] block">
        Travel kit planner
      </Link>

      <ProfileEditor />

      <Card className="space-y-4">
        <p className="font-medium">Theme</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <Button key={t} size="sm" variant={prefs.theme === t ? 'default' : 'ghost'} onClick={() => setPrefs({ ...prefs, theme: t })}>
              {t}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="font-medium">Office mode</p>
        <Button
          size="sm"
          variant={prefs.officeSafeMode ? 'default' : 'ghost'}
          onClick={() => setPrefs({ ...prefs, officeSafeMode: !prefs.officeSafeMode })}
        >
          {prefs.officeSafeMode ? 'Office-safe ON' : 'Office-safe OFF'}
        </Button>
        <p className="text-xs text-stone-500">When on, advisor only picks low-projection, office-friendly scents for work.</p>
        <input type="range" min={1} max={6} value={prefs.officeMaxSprays} onChange={(e) => setPrefs({ ...prefs, officeMaxSprays: Number(e.target.value) })} className="w-full" />
        <p className="text-sm text-stone-400">Max {prefs.officeMaxSprays} sprays at work</p>
      </Card>

      <Card className="space-y-3">
        <p className="font-medium">Weather & location</p>
        <Button variant="ghost" className="w-full" onClick={refreshLocation}>Update location & weather</Button>
        {profile?.cityLabel && <p className="text-xs text-stone-500">{profile.cityLabel}</p>}
      </Card>

      <Card className="space-y-3">
        <p className="font-medium">Demo wardrobe</p>
        {prefs.demoMode ? (
          <>
            <p className="text-xs text-stone-500">You&apos;re using sample data. Start fresh to build your own wardrobe.</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await exitDemo();
                await refresh();
                navigate('/onboarding');
              }}
            >
              Start my own wardrobe
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await loadDemoData();
                await refresh();
              }}
            >
              Reset demo data
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await loadDemoData();
              await refresh();
              navigate('/');
            }}
          >
            Load demo wardrobe
          </Button>
        )}
      </Card>

      <Card className="space-y-3">
        <p className="font-medium">Backup (includes photos)</p>
        <Button variant="outline" className="w-full" onClick={exportData}>Export wardrobe (JSON)</Button>
        <Button variant="outline" className="w-full" onClick={exportWearCsv}>Export wear history (CSV)</Button>
        <Button variant="ghost" className="w-full" onClick={importData}>Import wardrobe</Button>
      </Card>
    </div>
  );
}
