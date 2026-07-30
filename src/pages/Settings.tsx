import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { CityWeatherInput } from '@/components/settings/CityWeatherInput';
import { useApp } from '@/context/AppContext';
import { exportAllData, exportWearHistoryCsv, importAllData } from '@/db';
import { exitDemo, loadDemoData } from '@/services/demo';
import { APP_VERSION } from '@/lib/version';

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`settings-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <div>
        <h2
          id={`settings-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-semibold tracking-wide uppercase text-[var(--sc-text-muted)]"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-[var(--sc-text-soft)] mt-1 leading-relaxed">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { prefs, setPrefs, refresh, collection } = useApp();
  const navigate = useNavigate();
  const importRef = useRef<HTMLInputElement>(null);

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

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await importAllData(await file.text());
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <div className="atelier-page space-y-8">
      <header>
        <p className="atelier-page__brand">Preferences</p>
        <h1 className="atelier-page__title">Settings</h1>
      </header>

      {/* 1. Identity — most-used personal context */}
      <SettingsSection title="Account" description="Who you are for the advisor — stays on this device.">
        <ProfileEditor />
      </SettingsSection>

      {/* 2. Appearance */}
      <SettingsSection title="Appearance">
        <Card className="space-y-3">
          <p className="text-sm font-medium">Theme</p>
          <div className="flex gap-2" role="group" aria-label="Theme">
            {(['light', 'dark'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={prefs.theme === t ? 'default' : 'ghost'}
                aria-pressed={prefs.theme === t}
                onClick={() => setPrefs({ ...prefs, theme: t })}
              >
                {t === 'light' ? 'Light' : 'Dark'}
              </Button>
            ))}
          </div>
        </Card>
      </SettingsSection>

      {/* 3. Advisor preferences */}
      <SettingsSection title="Advisor" description="Rules engine — every pick is explainable. Never AI.">
        <Card className="space-y-3">
          <Button
            size="sm"
            variant={prefs.advisorAvoidSweet ? 'default' : 'ghost'}
            aria-pressed={prefs.advisorAvoidSweet}
            onClick={() => setPrefs({ ...prefs, advisorAvoidSweet: !prefs.advisorAvoidSweet })}
          >
            {prefs.advisorAvoidSweet ? 'Avoid sweet ON' : 'Avoid sweet OFF'}
          </Button>
          <Button
            size="sm"
            variant={prefs.advisorOfficeOnly ? 'default' : 'ghost'}
            aria-pressed={prefs.advisorOfficeOnly}
            onClick={() => setPrefs({ ...prefs, advisorOfficeOnly: !prefs.advisorOfficeOnly })}
          >
            {prefs.advisorOfficeOnly ? 'Office-only ON' : 'Office-only OFF'}
          </Button>
          <div className="pt-2 border-t border-[var(--sc-border-soft)] space-y-2">
            <p className="text-sm font-medium">Office-safe mode</p>
            <Button
              size="sm"
              variant={prefs.officeSafeMode ? 'default' : 'ghost'}
              aria-pressed={prefs.officeSafeMode}
              onClick={() => setPrefs({ ...prefs, officeSafeMode: !prefs.officeSafeMode })}
            >
              {prefs.officeSafeMode ? 'Office-safe ON' : 'Office-safe OFF'}
            </Button>
            <p className="text-xs text-[var(--sc-text-muted)]">
              When on, advisor only picks low-projection, office-friendly scents for work.
            </p>
            <label className="block text-sm text-[var(--sc-text-soft)]">
              Max sprays at work: {prefs.officeMaxSprays}
              <input
                type="range"
                min={1}
                max={6}
                value={prefs.officeMaxSprays}
                onChange={(e) => setPrefs({ ...prefs, officeMaxSprays: Number(e.target.value) })}
                className="w-full mt-1"
                aria-valuemin={1}
                aria-valuemax={6}
                aria-valuenow={prefs.officeMaxSprays}
              />
            </label>
          </div>
        </Card>
      </SettingsSection>

      {/* 4. Weather */}
      <SettingsSection title="Weather" description="Used by the daily pick — coordinates go to Open-Meteo only.">
        <Card className="space-y-3">
          <CityWeatherInput />
        </Card>
      </SettingsSection>

      {/* 5. Tools — secondary destinations, one home each */}
      <SettingsSection title="Tools" description="Power features. One tap from Settings — not duplicated in the tab bar.">
        <Card className="divide-y divide-[var(--sc-border-soft)] p-0 overflow-hidden">
          <Link to="/analytics" className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-[var(--sc-surface-2)] min-h-[44px]">
            <span>Collection analytics</span>
            <span className="text-[var(--sc-text-muted)]" aria-hidden>→</span>
          </Link>
          <Link to="/layering" className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-[var(--sc-surface-2)] min-h-[44px]">
            <span>Layering Lab</span>
            <span className="text-[var(--sc-text-muted)]" aria-hidden>→</span>
          </Link>
          <Link to="/travel" className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-[var(--sc-surface-2)] min-h-[44px]">
            <span>Travel kit planner</span>
            <span className="text-[var(--sc-text-muted)]" aria-hidden>→</span>
          </Link>
        </Card>
      </SettingsSection>

      {/* 6. Privacy & Data */}
      <SettingsSection title="Privacy & Data">
        <Card className="privacy-badge border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[var(--color-accent)]" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">Your data stays on this device</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                No account, no cloud sync, no tracking. Export a JSON backup anytime before switching phones.
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3" data-testid="privacy-network">
          <p className="text-sm font-medium">What leaves this device</p>
          <p className="text-xs text-[var(--sc-text-soft)] leading-relaxed">
            Wardrobe, wears, ratings, and notes stay local. Catalog search sends only the name/brand query to Fraganty.
            Weather sends coordinates to Open-Meteo when you allow location. Nothing from your collection is uploaded to Capricorn.
          </p>
          <p className="text-xs text-[var(--sc-text-muted)]">
            Bottle photos may come from third-party catalog services and are cached offline. Capricorn does not claim ownership of those images.
          </p>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-medium">Backup</p>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="sr-only"
            data-testid="import-backup"
            aria-label="Import wardrobe backup JSON"
            onChange={(e) => void onImportFile(e.target.files?.[0])}
          />
          <Button variant="outline" className="w-full" onClick={exportData}>Export wardrobe (JSON)</Button>
          <Button variant="outline" className="w-full" onClick={exportWearCsv}>Export wear history (CSV)</Button>
          <Button variant="ghost" className="w-full" onClick={() => importRef.current?.click()}>Import wardrobe</Button>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-medium">Demo wardrobe</p>
          {prefs.demoMode ? (
            <>
              <p className="text-xs text-[var(--sc-text-muted)]">You&apos;re using sample data. Start fresh to build your own wardrobe.</p>
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
          ) : collection.length > 0 ? (
            <p className="text-xs text-[var(--sc-text-muted)]">
              Your wardrobe is saved on this device. Export a backup above before clearing site data.
              To explore sample data, use onboarding on a fresh install or add{' '}
              <code className="text-[var(--sc-text-soft)]">?demo=1</code> on first visit.
            </p>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (!window.confirm('Load sample wardrobe? You can export your data anytime from Backup above.')) return;
                await loadDemoData();
                await refresh();
                navigate('/');
              }}
            >
              Load sample wardrobe
            </Button>
          )}
        </Card>
      </SettingsSection>

      {/* 7. About & Legal — bottom */}
      <SettingsSection title="About & Legal">
        <Card className="space-y-3">
          <p className="text-sm">ScentCap <span className="text-[var(--sc-text-muted)]">v{APP_VERSION}</span></p>
          <a
            href={`${import.meta.env.BASE_URL}privacy.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--sc-accent)] font-semibold inline-block min-h-[44px] leading-[44px]"
          >
            Privacy policy
          </a>
          <div className="pt-2 border-t border-[var(--sc-border-soft)] space-y-2">
            <p className="text-sm font-medium">App won&apos;t open?</p>
            <p className="text-xs text-[var(--sc-text-soft)] leading-relaxed">
              Old cache on iPhone can freeze the PWA after an update. Clear cache reloads a fresh install — wardrobe in IndexedDB usually stays.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void import('@/components/ErrorBoundary').then(({ hardResetApp }) => hardResetApp());
              }}
            >
              Clear cache & reopen
            </Button>
          </div>
        </Card>
      </SettingsSection>
    </div>
  );
}
