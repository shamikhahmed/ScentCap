export const FREE_BOTTLE_LIMIT = 12;

/** All features free until App Store IAP ships. Set false to re-enable paywall. */
export const LAUNCH_PREVIEW = true;

export const PRO_STORAGE_KEY = 'scentcap_pro';

export type ProFeature = 'analytics' | 'layering' | 'travel' | 'export' | 'bottle_limit';

export const PRO_FEATURES: Record<ProFeature, { title: string; description: string }> = {
  analytics: {
    title: 'Collection Analytics',
    description: 'Rotation health, wear patterns, and value insights.',
  },
  layering: {
    title: 'Layering Lab',
    description: 'Discover and save compatible scent combos.',
  },
  travel: {
    title: 'Travel Kit',
    description: 'Plan decants and travel sizes for any trip.',
  },
  export: {
    title: 'Data Export',
    description: 'Export your wardrobe and wear history as JSON or CSV.',
  },
  bottle_limit: {
    title: 'Unlimited Bottles',
    description: `Free plan supports up to ${FREE_BOTTLE_LIMIT} bottles. Upgrade for unlimited wardrobe size.`,
  },
};

export function readProStatus(): boolean {
  try {
    return localStorage.getItem(PRO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeProStatus(isPro: boolean) {
  try {
    localStorage.setItem(PRO_STORAGE_KEY, isPro ? 'true' : 'false');
  } catch {
    /* ignore quota errors in private mode */
  }
}
