import { Capacitor } from '@capacitor/core';
import { writeProStatus } from '@/lib/pro';

export const IAP_PRODUCT_MONTHLY = 'com.capricorn.scentcap.pro.monthly';
export const IAP_PRODUCT_YEARLY = 'com.capricorn.scentcap.pro.yearly';

export const IAP_UNAVAILABLE_MESSAGE =
  'Subscriptions are available in the App Store version. Enroll in Apple Developer and configure products in App Store Connect to enable purchases.';

export type IapResult =
  | { ok: true; productId: string }
  | { ok: false; reason: 'unavailable' | 'cancelled' | 'error'; message: string };

function isNativeIos(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * StoreKit integration lands on day 1 of Apple Developer enrollment.
 * Until `@capgo/native-purchases` (or similar) is installed and products exist
 * in App Store Connect, purchases return a graceful unavailable result.
 */
async function purchase(_productId: string): Promise<IapResult> {
  if (!isNativeIos()) {
    return { ok: false, reason: 'unavailable', message: IAP_UNAVAILABLE_MESSAGE };
  }

  // Future: dynamic import native purchases plugin when configured in Xcode.
  // const { NativePurchases } = await import('@capgo/native-purchases');
  // await NativePurchases.purchaseProduct({ productIdentifier: productId });

  return {
    ok: false,
    reason: 'unavailable',
    message:
      'In-app purchases are not configured yet. Create subscription products in App Store Connect, then wire StoreKit in IOS-BUILD.md.',
  };
}

export async function purchaseMonthly(): Promise<IapResult> {
  return purchase(IAP_PRODUCT_MONTHLY);
}

export async function purchaseYearly(): Promise<IapResult> {
  return purchase(IAP_PRODUCT_YEARLY);
}

export async function restorePurchases(): Promise<IapResult> {
  if (!isNativeIos()) {
    return { ok: false, reason: 'unavailable', message: IAP_UNAVAILABLE_MESSAGE };
  }

  // Future: NativePurchases.restorePurchases() + receipt validation
  return {
    ok: false,
    reason: 'unavailable',
    message: 'Restore purchases will work after StoreKit products are live in App Store Connect.',
  };
}

/** Apply Pro entitlement after a verified purchase or restore. */
export function applyProEntitlement(): void {
  writeProStatus(true);
}
