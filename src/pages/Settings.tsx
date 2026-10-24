import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHeader, Sheet } from '@/components/kit';
import { useApp } from '@/context/AppContext';
import { clearUserData, exportAllData, exportWearHistoryCsv, importAllData } from '@/db';
import { exitDemo, loadDemoData } from '@/services/demo';
import { APP_VERSION } from '@/lib/version';
import type { UserProfile } from '@/types';
import {
  applyCityToProfile,
  applyGpsToProfile,
  getDailyWeather,
  requestLocationDetailed,
  weatherUnavailableMessage,
} from '@/services/weather';

const PROFILE_FIELDS: { key: keyof UserProfile; label: string; options: { v: string; l: string }[] }[] = [
  {
    key: 'gender',
    label: 'Gender',
    options: [
      { v: 'man', l: 'Man' },
      { v: 'woman', l: 'Woman' },
      { v: 'nonbinary', l: 'Non-binary' },
      { v: 'prefer_not', l: 'Prefer not' },
    ],
  },
  {
    key: 'ageRange',
    label: 'Age',
    options: [
      { v: 'under18', l: 'Under 18' },
      { v: '18-24', l: '18–24' },
      { v: '25-34', l: '25–34' },
      { v: '35-44', l: '35–44' },
      { v: '45plus', l: '45+' },
    ],
  },
  {
    key: 'skinType',
    label: 'Skin',
    options: [
      { v: 'dry', l: 'Dry' },
      { v: 'normal', l: 'Normal' },
      { v: 'oily', l: 'Oily' },
    ],
  },
  {
    key: 'workContext',
    label: 'Work',
    options: [
      { v: 'office', l: 'Office' },
      { v: 'hybrid', l: 'Hybrid' },
      { v: 'wfh', l: 'WFH' },
      { v: 'student', l: 'Student' },
      { v: 'other', l: 'Other' },
    ],
  },
  {
    key: 'dressStyle',
    label: 'Dress',
    options: [
      { v: 'casual', l: 'Casual' },
      { v: 'smart_casual', l: 'Smart casual' },
      { v: 'formal', l: 'Formal' },
    ],
  },
  {
    key: 'projectionComfort',
    label: 'Projection',
    options: [
      { v: 'skin_scent', l: 'Skin scent' },
      { v: 'moderate', l: 'Moderate' },
      { v: 'bold', l: 'Bold' },
    ],
  },
];

export function SettingsPage() {
  const { profile, setProfile, prefs, setPrefs, refresh, collection, weather, weatherUnavailable } = useApp();
  const navigate = useNavigate();
  const importRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [wipeStep, setWipeStep] = useState<0 | 1 | 2>(0);
  const [cityInput, setCityInput] = useState(
    profile?.cityLabel && profile.cityLabel !== 'Current location' ? profile.cityLabel : '',
  );
  const [weatherBusy, setWeatherBusy] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile?.cityLabel && profile.cityLabel !== 'Current location') {
      setCityInput(profile.cityLabel);
    }
  }, [profile?.cityLabel]);

  useEffect(
    () => () => {
      if (cityDebounce.current) clearTimeout(cityDebounce.current);
    },
    [],
  );

  const updateProfile = (key: keyof UserProfile, value: string) => {
    if (!profile) return;
    const next = { ...profile, [key]: key === 'sensitivity' ? value === 'true' : value } as UserProfile;
    void setProfile(next);
  };

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
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const saveCity = async (query: string) => {
    if (!profile || !query.trim()) return;
    setWeatherBusy(true);
    setWeatherError(null);
    setWeatherStatus(null);
    try {
      const { profile: next, error: cityError } = await applyCityToProfile(profile, query);
      if (cityError) {
        setWeatherError(weatherUnavailableMessage(cityError));
        return;
      }
      await setProfile(next);
      setWeatherStatus(`Weather updated for ${next.cityLabel}.`);
    } finally {
      setWeatherBusy(false);
    }
  };

  const applyMyLocation = async () => {
    if (!profile) return;
    setWeatherBusy(true);
    setWeatherError(null);
    setWeatherStatus(null);
    try {
      const result = await requestLocationDetailed();
      if (!result.ok) {
        setWeatherError(weatherUnavailableMessage(result.reason));
        return;
      }
      const next = applyGpsToProfile(profile, result.location);
      await setProfile(next);
      setCityInput('');
      setWeatherStatus(`Weather updated for ${next.cityLabel ?? 'your location'}.`);
    } finally {
      setWeatherBusy(false);
    }
  };

  const refreshWeather = async () => {
    if (!profile?.lat || profile.lon == null) return;
    setWeatherBusy(true);
    try {
      await getDailyWeather(profile, true);
      await refresh();
      setWeatherStatus('Weather refreshed.');
    } finally {
      setWeatherBusy(false);
    }
  };

  const wipeAll = async () => {
    await clearUserData();
    await refresh();
    setWipeStep(0);
    navigate('/onboarding');
  };

  return (
    <div className="ui-page">
      <PageHeader eyebrow="You" title="Settings" subtitle="Profile, preferences, and local data." />

      <Sheet open={!!importError} title="Import failed" onClose={() => setImportError(null)} done={{ label: 'OK', onClick: () => setImportError(null) }}>
        <p className="ui-secondary px-1 pb-4">{importError}</p>
      </Sheet>

      <Sheet
        open={demoConfirmOpen}
        title="Load sample wardrobe?"
        onClose={() => setDemoConfirmOpen(false)}
        done={{
          label: 'Load samples',
          onClick: async () => {
            setDemoConfirmOpen(false);
            await loadDemoData();
            await refresh();
            navigate('/');
          },
        }}
      >
        <p className="ui-secondary px-1 pb-4">You can export your data anytime from Data below.</p>
      </Sheet>

      <Sheet
        open={wipeStep === 1}
        title="Erase all data?"
        onClose={() => setWipeStep(0)}
        done={{ label: 'Continue', onClick: () => setWipeStep(2) }}
      >
        <p className="ui-secondary px-1 pb-4">
          This removes your wardrobe, wears, preferences, and photos from this device. Export a backup first if you need it.
        </p>
      </Sheet>

      <Sheet
        open={wipeStep === 2}
        title="Erase permanently?"
        onClose={() => setWipeStep(0)}
        done={{ label: 'Erase everything', onClick: () => void wipeAll() }}
      >
        <p className="ui-secondary px-1 pb-4">This cannot be undone. You will start onboarding again.</p>
        <button type="button" className="ui-btn ui-btn--danger ui-btn--block" onClick={() => void wipeAll()}>
          Erase everything
        </button>
      </Sheet>

      {/* Profile */}
      <p className="ui-list-header">Profile</p>
      <div className="ui-list">
        {profile ? (
          PROFILE_FIELDS.map((f) => (
            <div key={f.key} className="ui-row !items-start !py-3" role="radiogroup" aria-label={f.label}>
              <div className="ui-row__main">
                <p className="ui-row__title">{f.label}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {f.options.map((o) => {
                    const selected = String(profile[f.key]) === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className="ui-chip"
                        aria-pressed={selected}
                        onClick={() => updateProfile(f.key, o.v)}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="ui-row">
            <p className="ui-row__title">Finish onboarding to set your profile</p>
          </div>
        )}
        {profile && (
          <div className="ui-row" role="radiogroup" aria-label="Fragrance sensitivity">
            <div className="ui-row__main">
              <p className="ui-row__title">Sensitive to fragrance</p>
              <p className="ui-row__sub">Advisor prefers softer projection when on</p>
            </div>
            <div className="ui-segmented shrink-0" role="presentation">
              <button
                type="button"
                role="radio"
                aria-checked={!profile.sensitivity}
                aria-pressed={!profile.sensitivity}
                onClick={() => updateProfile('sensitivity', 'false')}
              >
                No
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!!profile.sensitivity}
                aria-pressed={!!profile.sensitivity}
                onClick={() => updateProfile('sensitivity', 'true')}
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences */}
      <p className="ui-list-header">Preferences</p>
      <div className="ui-list">
        <div className="ui-row" role="group" aria-label="Theme">
          <div className="ui-row__main">
            <p className="ui-row__title">Theme</p>
          </div>
          <div className="ui-segmented shrink-0">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={prefs.theme === t}
                onClick={() => setPrefs({ ...prefs, theme: t })}
              >
                {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'}
              </button>
            ))}
          </div>
        </div>

        <div className="ui-row">
          <div className="ui-row__main">
            <p className="ui-row__title">Avoid sweet</p>
            <p className="ui-row__sub">Rules engine steers away from gourmand picks</p>
          </div>
          <input
            type="checkbox"
            className="ui-switch"
            checked={!!prefs.advisorAvoidSweet}
            onChange={() => setPrefs({ ...prefs, advisorAvoidSweet: !prefs.advisorAvoidSweet })}
            aria-label="Avoid sweet"
          />
        </div>

        <div className="ui-row">
          <div className="ui-row__main">
            <p className="ui-row__title">Office-only picks</p>
            <p className="ui-row__sub">Bias recommendations toward work-friendly scents</p>
          </div>
          <input
            type="checkbox"
            className="ui-switch"
            checked={!!prefs.advisorOfficeOnly}
            onChange={() => setPrefs({ ...prefs, advisorOfficeOnly: !prefs.advisorOfficeOnly })}
            aria-label="Office-only picks"
          />
        </div>

        <div className="ui-row">
          <div className="ui-row__main">
            <p className="ui-row__title">Office Safe</p>
            <p className="ui-row__sub">Low projection for work and professional occasions</p>
          </div>
          <input
            type="checkbox"
            className="ui-switch"
            checked={!!prefs.officeSafeMode}
            onChange={() => setPrefs({ ...prefs, officeSafeMode: !prefs.officeSafeMode })}
            aria-label="Office Safe"
          />
        </div>

        <div className="ui-row !items-start !py-3">
          <div className="ui-row__main w-full">
            <p className="ui-row__title">Max sprays at work</p>
            <p className="ui-row__sub mb-2">{prefs.officeMaxSprays} sprays</p>
            <input
              type="range"
              min={1}
              max={6}
              value={prefs.officeMaxSprays}
              onChange={(e) => setPrefs({ ...prefs, officeMaxSprays: Number(e.target.value) })}
              className="w-full accent-[var(--tint)]"
              aria-valuemin={1}
              aria-valuemax={6}
              aria-valuenow={prefs.officeMaxSprays}
              aria-label="Max sprays at work"
            />
          </div>
        </div>

        <div className="ui-row !items-start !py-3">
          <div className="ui-row__main w-full space-y-3">
            <p className="ui-row__title">Weather city</p>
            <p className="ui-row__sub">Coordinates go to Open-Meteo only when you allow location.</p>
            <label className="sr-only" htmlFor="city-weather-input">
              City
            </label>
            <input
              id="city-weather-input"
              className="ui-field"
              placeholder="e.g. London, Tokyo"
              value={cityInput}
              onChange={(e) => {
                const value = e.target.value;
                setCityInput(value);
                setWeatherError(null);
                setWeatherStatus(null);
                if (cityDebounce.current) clearTimeout(cityDebounce.current);
                if (value.trim().length < 3) return;
                cityDebounce.current = setTimeout(() => void saveCity(value), 700);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (cityDebounce.current) clearTimeout(cityDebounce.current);
                  void saveCity(cityInput);
                }
              }}
              autoComplete="address-level2"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => void applyMyLocation()} disabled={weatherBusy}>
                Use my location
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--gray ui-btn--sm"
                onClick={() => void refreshWeather()}
                disabled={weatherBusy || profile?.lat == null}
              >
                Refresh weather
              </button>
            </div>
            {profile?.cityLabel && (
              <p className="ui-footnote">
                Active: {profile.cityLabel}
                {weather ? ` · ${Math.round(weather.tempC)}° · ${weather.humidity}% humidity` : ''}
              </p>
            )}
            {weatherStatus && <p className="ui-footnote" style={{ color: 'var(--tint)' }}>{weatherStatus}</p>}
            {weatherError && (
              <p className="ui-footnote" role="alert" style={{ color: 'var(--warning)' }}>
                {weatherError}
              </p>
            )}
            {!weather && weatherUnavailable && !weatherError && (
              <p className="ui-footnote">{weatherUnavailableMessage(weatherUnavailable)}</p>
            )}
          </div>
        </div>
      </div>

      <p className="ui-list-header">Tools</p>
      <div className="ui-list">
        {(
          [
            { to: '/analytics', label: 'Collection analytics' },
            { to: '/layering', label: 'Layering Lab' },
            { to: '/travel', label: 'Travel kit planner' },
          ] as const
        ).map((row) => (
          <Link key={row.to} to={row.to} className="ui-row ui-row--media">
            <div className="ui-row__main">
              <p className="ui-row__title">{row.label}</p>
            </div>
            <ChevronRight className="ui-chevron" size={18} aria-hidden />
          </Link>
        ))}
      </div>

      {/* Data */}
      <p className="ui-list-header">Data</p>
      <p className="ui-list-footer !mt-0 !mb-2">
        Your wardrobe stays on this device. No account, no cloud sync, no tracking.
      </p>
      <div className="ui-list" data-testid="privacy-network">
        <div className="ui-row !items-start !py-3">
          <div className="ui-row__main">
            <p className="ui-row__title">What may leave this device</p>
            <p className="ui-row__sub mt-1">
              Optional Open-Meteo weather and Fraganty search queries. Wardrobe, wears, and ratings stay local. Bottle images © their
              respective brands, via Parfumo.
            </p>
          </div>
        </div>
        <button type="button" className="ui-row w-full text-left" onClick={() => void exportData()}>
          <div className="ui-row__main">
            <p className="ui-row__title">Export wardrobe (JSON)</p>
          </div>
        </button>
        <button type="button" className="ui-row w-full text-left" onClick={() => void exportWearCsv()}>
          <div className="ui-row__main">
            <p className="ui-row__title">Export wear history (CSV)</p>
          </div>
        </button>
        <button type="button" className="ui-row w-full text-left" onClick={() => importRef.current?.click()}>
          <div className="ui-row__main">
            <p className="ui-row__title">Import wardrobe</p>
          </div>
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="sr-only"
          data-testid="import-backup"
          aria-label="Import wardrobe backup JSON"
          onChange={(e) => void onImportFile(e.target.files?.[0])}
        />
        <button type="button" className="ui-row w-full text-left" onClick={() => setWipeStep(1)}>
          <div className="ui-row__main">
            <p className="ui-row__title" style={{ color: 'var(--danger)' }}>
              Erase all data
            </p>
            <p className="ui-row__sub">Double confirmation required</p>
          </div>
        </button>
      </div>

      <p className="ui-list-header">Sample data</p>
      <div className="ui-list">
        {prefs.demoMode ? (
          <>
            <div className="ui-row !items-start !py-3">
              <p className="ui-row__sub">You&apos;re using a sample wardrobe. Start fresh to build your own.</p>
            </div>
            <button
              type="button"
              className="ui-row w-full text-left"
              onClick={async () => {
                await exitDemo();
                await refresh();
                navigate('/onboarding');
              }}
            >
              <p className="ui-row__title">Start my own wardrobe</p>
            </button>
            <button
              type="button"
              className="ui-row w-full text-left"
              onClick={async () => {
                await loadDemoData();
                await refresh();
              }}
            >
              <p className="ui-row__title">Reset sample data</p>
            </button>
          </>
        ) : collection.length > 0 ? (
          <div className="ui-row !items-start !py-3">
            <p className="ui-row__sub">
              Your wardrobe is saved on this device. Export a backup above before clearing site data.
            </p>
          </div>
        ) : (
          <button type="button" className="ui-row w-full text-left" onClick={() => setDemoConfirmOpen(true)}>
            <p className="ui-row__title">Load sample wardrobe</p>
          </button>
        )}
      </div>

      {/* About */}
      <p className="ui-list-header">About</p>
      <div className="ui-list">
        <div className="ui-row">
          <div className="ui-row__main">
            <p className="ui-row__title">ScentCap</p>
            <p className="ui-row__sub">Version {APP_VERSION}</p>
          </div>
        </div>
        <div className="ui-row !items-start !py-3">
          <p className="ui-row__sub">
            Bottle images © their respective brands, via Parfumo. Brand names belong to their owners. ScentCap isn&apos;t affiliated
            with any fragrance house.
          </p>
        </div>
        <a
          href={`${import.meta.env.BASE_URL}privacy.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-row ui-row--media"
        >
          <div className="ui-row__main">
            <p className="ui-row__title">Privacy policy</p>
          </div>
          <ChevronRight className="ui-chevron" size={18} aria-hidden />
        </a>
        <a
          href={`${import.meta.env.BASE_URL}support.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-row ui-row--media"
        >
          <div className="ui-row__main">
            <p className="ui-row__title">Support</p>
          </div>
          <ChevronRight className="ui-chevron" size={18} aria-hidden />
        </a>
        <a
          href={`${import.meta.env.BASE_URL}terms.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-row ui-row--media"
        >
          <div className="ui-row__main">
            <p className="ui-row__title">Terms of use</p>
          </div>
          <ChevronRight className="ui-chevron" size={18} aria-hidden />
        </a>
        <button
          type="button"
          className="ui-row w-full text-left"
          onClick={() => {
            void import('@/components/ErrorBoundary').then(({ hardResetApp }) => hardResetApp());
          }}
        >
          <div className="ui-row__main">
            <p className="ui-row__title">Clear cache & reopen</p>
            <p className="ui-row__sub">Fixes a stuck PWA after an update. Wardrobe usually stays.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
