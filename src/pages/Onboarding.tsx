import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Lock, MapPin, Navigation, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { loadDemoData } from '@/services/demo';
import { geocodeCity, requestLocationDetailed, weatherUnavailableMessage, type CityLocation } from '@/services/weather';
import { loadLocalCatalog, popularLocal, type LocalFragrance } from '@/catalog/local';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import type { UserProfile } from '@/types';
import { hapticSelection, hapticSuccess } from '@/lib/premium/haptics';

const WORK = [
  { v: 'office', l: 'Office' },
  { v: 'hybrid', l: 'Hybrid' },
  { v: 'wfh', l: 'Home' },
  { v: 'student', l: 'Campus' },
] as const;

const BOLDNESS = [
  { v: 'skin_scent', l: 'Close to skin', d: 'Only people near you notice' },
  { v: 'moderate', l: 'Balanced', d: 'Noticeable, never loud' },
  { v: 'bold', l: 'Make an entrance', d: 'Projection is welcome' },
] as const;

const DEFAULT_PROFILE: Omit<UserProfile, 'lat' | 'lon' | 'cityLabel'> = {
  id: 'profile',
  gender: 'prefer_not',
  ageRange: '25-34',
  skinType: 'normal',
  sensitivity: false,
  workContext: 'office',
  dressStyle: 'smart_casual',
  projectionComfort: 'moderate',
  onboardingComplete: true,
};

export function Onboarding() {
  const { setProfile, setPrefs, prefs, refresh } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [data, setData] = useState<Partial<UserProfile>>({ workContext: 'office', projectionComfort: 'moderate' });
  const [officeSafe, setOfficeSafe] = useState(true);
  const [cityQuery, setCityQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState<CityLocation | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hero, setHero] = useState<LocalFragrance[]>([]);

  const [catalogSize, setCatalogSize] = useState(0);

  useEffect(() => {
    void popularLocal(5).then(setHero);
    void loadLocalCatalog().then((idx) => setCatalogSize(idx.list.length));
  }, []);

  const finish = async (location?: CityLocation | null) => {
    setFinishing(true);
    try {
      await setProfile({
        ...DEFAULT_PROFILE,
        ...data,
        lat: location?.lat,
        lon: location?.lon,
        cityLabel: location?.label,
        onboardingComplete: true,
      });
      await setPrefs({ ...prefs, officeSafeMode: officeSafe });
      hapticSuccess();
      navigate('/add', { replace: true });
    } finally {
      setFinishing(false);
    }
  };

  const continueFromCity = async () => {
    if (!cityQuery.trim()) return finish(pendingLocation);
    const loc = pendingLocation ?? (await geocodeCity(cityQuery));
    if (!loc) {
      setLocationError('We couldn’t find that city. Try “Paris, France” or “Austin, TX”.');
      return;
    }
    setPendingLocation(loc);
    await finish(loc);
  };

  const locateMe = async () => {
    setLocationError(null);
    setLocating(true);
    const result = await requestLocationDetailed();
    setLocating(false);
    if (!result.ok) {
      setLocationError(weatherUnavailableMessage(result.reason) ?? 'Enter your city instead.');
      return;
    }
    setPendingLocation(result.location);
    setCityQuery(result.location.label);
  };

  const tryDemo = async () => {
    setLoadingDemo(true);
    setDemoError(null);
    try {
      await loadDemoData();
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[ScentCap] Demo load failed', err);
      setDemoError('The sample wardrobe didn’t load. Please try again.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const progress = (
    <div className="flex items-center justify-between mb-6">
      <button
        type="button"
        className="ui-btn ui-btn--plain !font-normal !px-1"
        onClick={() => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1) : 0))}
      >
        <ChevronLeft size={22} aria-hidden /> Back
      </button>
      <div className="flex gap-1.5" aria-label={`Step ${step} of 2`}>
        {[1, 2].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-6 bg-[var(--tint)]' : 'w-1.5 bg-[var(--label-4)]'}`} />
        ))}
      </div>
      <button type="button" className="ui-btn ui-btn--plain !font-normal !px-1" onClick={() => void finish(pendingLocation)} disabled={finishing}>
        Skip
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex flex-col">
      <div className="flex-1 w-full max-w-md mx-auto px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] flex flex-col">
        {step === 0 && (
          <div className="flex-1 flex flex-col ui-rise">
            <div className="relative h-[300px] mt-4 mb-8" aria-hidden>
              {hero.slice(0, 5).map((f, i) => {
                const pos = [
                  'left-1/2 -translate-x-1/2 top-4 w-[46%] z-30',
                  'left-[2%] top-16 w-[34%] z-20 -rotate-6',
                  'right-[2%] top-16 w-[34%] z-20 rotate-6',
                  'left-[16%] top-[150px] w-[26%] z-10 -rotate-3 opacity-90',
                  'right-[16%] top-[150px] w-[26%] z-10 rotate-3 opacity-90',
                ][i];
                return (
                  <div key={f.id} className={`absolute ${pos} drop-shadow-[0_18px_30px_rgba(0,0,0,0.12)]`}>
                    <FragranceThumb fragrance={f} variant="plinth" size={i === 0 ? 'hero' : 'md'} className="!rounded-[22px]" />
                  </div>
                );
              })}
            </div>

            <h1 className="ui-largetitle text-center">Your fragrance wardrobe, beautifully kept.</h1>
            <div className="ui-list mt-7">
              {[
                { icon: Sparkles, t: 'A pick for every day', d: 'Matched to the weather, your plans and your mood.' },
                { icon: LayoutGrid, t: catalogSize > 100 ? `${(Math.floor(catalogSize / 100) * 100).toLocaleString()}+ real bottles` : 'Real bottle photos', d: 'Search and add what you own in a tap.' },
                { icon: Lock, t: 'Private by design', d: 'No account. Everything stays on this device.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="ui-row !items-start !py-3">
                  <Icon size={22} className="text-[var(--tint)] shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-semibold">{t}</p>
                    <p className="text-[var(--t-subhead)] text-[var(--label-2)]">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 space-y-2.5">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => setStep(1)}>
                Get started
              </button>
              <button type="button" className="ui-btn ui-btn--gray ui-btn--block" onClick={() => void tryDemo()} disabled={loadingDemo}>
                {loadingDemo ? 'Preparing sample…' : 'Explore a sample wardrobe'}
              </button>
              {demoError && (
                <p className="ui-footnote text-center !text-[var(--danger)]" role="alert">
                  {demoError}
                </p>
              )}
              <p className="ui-footnote text-center pt-2">Free · No account · Works offline</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col ui-rise">
            {progress}
            <h1 className="ui-largetitle">About your days</h1>
            <p className="ui-secondary mt-2">So picks fit where you’ll be wearing them.</p>

            <p className="ui-list-header mt-7">Most days I’m at</p>
            <div className="ui-segmented">
              {WORK.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={data.workContext === o.v}
                  onClick={() => {
                    hapticSelection();
                    setData({ ...data, workContext: o.v });
                    setOfficeSafe(o.v === 'office' || o.v === 'hybrid');
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <p className="ui-list-header mt-7">I like my scent</p>
            <div className="ui-list" role="radiogroup" aria-label="Projection preference">
              {BOLDNESS.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={data.projectionComfort === o.v}
                  className="ui-row"
                  onClick={() => {
                    hapticSelection();
                    setData({ ...data, projectionComfort: o.v });
                  }}
                >
                  <span className="ui-row__main">
                    <span className="ui-row__title block">{o.l}</span>
                    <span className="ui-row__sub block">{o.d}</span>
                  </span>
                  <span
                    className={`w-[22px] h-[22px] rounded-full grid place-items-center shrink-0 ${data.projectionComfort === o.v ? 'bg-[var(--tint)]' : 'border-2 border-[var(--label-4)]'}`}
                    aria-hidden
                  >
                    {data.projectionComfort === o.v && <span className="w-2 h-2 rounded-full bg-[var(--on-tint)]" />}
                  </span>
                </button>
              ))}
            </div>

            <div className="ui-list mt-7">
              <label className="ui-row cursor-pointer">
                <span className="ui-row__main">
                  <span className="ui-row__title block">Office Safe</span>
                  <span className="ui-row__sub block whitespace-normal">Keep work-day picks quiet and desk-friendly.</span>
                </span>
                <input type="checkbox" className="ui-switch" checked={officeSafe} onChange={(e) => setOfficeSafe(e.target.checked)} />
              </label>
            </div>

            <div className="mt-auto pt-8">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col ui-rise">
            {progress}
            <h1 className="ui-largetitle">Your weather</h1>
            <p className="ui-secondary mt-2">
              Hot afternoons and cold evenings call for different scents. We only use your city to look up the forecast.
            </p>

            <label className="ui-search !bg-[var(--surface)] !min-h-[50px] mt-7 shadow-[var(--shadow-1)]">
              <MapPin size={18} aria-hidden />
              <span className="sr-only">City</span>
              <input
                placeholder="City, e.g. London or Austin, TX"
                value={cityQuery}
                autoComplete="address-level2"
                enterKeyHint="go"
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setLocationError(null);
                  setPendingLocation(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && void continueFromCity()}
              />
            </label>
            {pendingLocation && <p className="ui-footnote mt-2 px-1 !text-[var(--success)]">Found {pendingLocation.label}</p>}
            {locationError && (
              <p className="ui-footnote mt-2 px-1 !text-[var(--warning)]" role="alert">
                {locationError}
              </p>
            )}
            <button type="button" className="ui-btn ui-btn--plain self-start mt-2 !px-1" onClick={() => void locateMe()} disabled={locating}>
              <Navigation size={17} aria-hidden /> {locating ? 'Locating…' : 'Use my current location'}
            </button>

            <div className="mt-auto pt-8 space-y-2.5">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => void continueFromCity()} disabled={finishing}>
                {finishing ? 'Setting up…' : 'Add my first bottles'}
              </button>
              <p className="ui-footnote text-center">You can change this any time in Settings.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
