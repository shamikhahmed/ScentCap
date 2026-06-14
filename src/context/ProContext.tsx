import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  FREE_BOTTLE_LIMIT,
  type ProFeature,
  readProStatus,
  writeProStatus,
} from '@/lib/pro';

interface ProState {
  isPro: boolean;
  paywallOpen: boolean;
  paywallFeature?: ProFeature;
  bottleCount: number;
  setBottleCount: (n: number) => void;
  canAccessFeature: (feature: ProFeature) => boolean;
  canAddBottle: () => boolean;
  requestFeature: (feature: ProFeature) => boolean;
  openPaywall: (feature?: ProFeature) => void;
  closePaywall: () => void;
  /** Dev / future IAP stub — marks user as Pro locally */
  activatePro: () => void;
  /** Reset Pro for testing */
  deactivatePro: () => void;
}

const Ctx = createContext<ProState | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(readProStatus);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<ProFeature | undefined>();
  const [bottleCount, setBottleCount] = useState(0);

  const canAccessFeature = useCallback(
    (feature: ProFeature) => {
      if (feature === 'bottle_limit') return isPro || bottleCount < FREE_BOTTLE_LIMIT;
      return isPro;
    },
    [isPro, bottleCount],
  );

  const canAddBottle = useCallback(
    () => isPro || bottleCount < FREE_BOTTLE_LIMIT,
    [isPro, bottleCount],
  );

  const openPaywall = useCallback((feature?: ProFeature) => {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallFeature(undefined);
  }, []);

  const requestFeature = useCallback(
    (feature: ProFeature): boolean => {
      if (isPro) return true;
      if (feature === 'bottle_limit') {
        if (bottleCount < FREE_BOTTLE_LIMIT) return true;
        openPaywall('bottle_limit');
        return false;
      }
      openPaywall(feature);
      return false;
    },
    [isPro, bottleCount, openPaywall],
  );

  const activatePro = useCallback(() => {
    writeProStatus(true);
    setIsPro(true);
    closePaywall();
  }, [closePaywall]);

  const deactivatePro = useCallback(() => {
    writeProStatus(false);
    setIsPro(false);
  }, []);

  const value = useMemo(
    () => ({
      isPro,
      paywallOpen,
      paywallFeature,
      bottleCount,
      setBottleCount,
      canAccessFeature,
      canAddBottle,
      requestFeature,
      openPaywall,
      closePaywall,
      activatePro,
      deactivatePro,
    }),
    [
      isPro,
      paywallOpen,
      paywallFeature,
      bottleCount,
      canAccessFeature,
      canAddBottle,
      requestFeature,
      openPaywall,
      closePaywall,
      activatePro,
      deactivatePro,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePro() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePro outside provider');
  return ctx;
}
