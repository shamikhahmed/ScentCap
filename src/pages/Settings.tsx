import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { useApp } from '@/context/AppContext';
import { exportAllData, importAllData } from '@/db';
import { exitDemo, loadDemoData } from '@/services/demo';
import { getDailyWeather, requestLocation } from '@/services/weather';

export function SettingsPage() {
  const { profile, prefs, setPrefs, setProfile, refresh } = useApp();
  const navigate = useNavigate();

  const exportData = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scentcap-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      <Link to="/analytics" className="text-sm text-[var(--color-accent)]">Collection analytics →</Link>
      <Link to="/travel" className="text-sm text-[var(--color-accent)] block">Travel kit planner →</Link>

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
        <Button variant="outline" className="w-full" onClick={exportData}>Export wardrobe</Button>
        <Button variant="ghost" className="w-full" onClick={importData}>Import wardrobe</Button>
      </Card>
    </div>
  );
}
