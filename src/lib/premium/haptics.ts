import { Capacitor } from '@capacitor/core';

type HapticKind = 'light' | 'medium' | 'success' | 'error' | 'selection';

async function nativeImpact(style: 'Light' | 'Medium' | 'Heavy') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle[style] });
  } catch {
    /* web fallback below */
  }
}

async function nativeNotification(type: 'Success' | 'Error' | 'Warning') {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType[type] });
  } catch {
    /* web fallback below */
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Light tap — tabs, toggles, secondary actions */
export function hapticLight() {
  if (Capacitor.isNativePlatform()) {
    void nativeImpact('Light');
    return;
  }
  vibrate(6);
}

/** Medium — primary button press */
export function hapticMedium() {
  if (Capacitor.isNativePlatform()) {
    void nativeImpact('Medium');
    return;
  }
  vibrate(12);
}

/** Selection change — pills, stars, pickers */
export function hapticSelection() {
  if (Capacitor.isNativePlatform()) {
    void nativeImpact('Light');
    return;
  }
  vibrate(4);
}

/** Save, wear logged, success */
export function hapticSuccess() {
  if (Capacitor.isNativePlatform()) {
    void nativeNotification('Success');
    return;
  }
  vibrate([20, 40, 20]);
}

/** Delete, error */
export function hapticError() {
  if (Capacitor.isNativePlatform()) {
    void nativeNotification('Error');
    return;
  }
  vibrate([80, 40, 80]);
}

export function triggerHaptic(kind: HapticKind) {
  switch (kind) {
    case 'light':
      hapticLight();
      break;
    case 'medium':
      hapticMedium();
      break;
    case 'selection':
      hapticSelection();
      break;
    case 'success':
      hapticSuccess();
      break;
    case 'error':
      hapticError();
      break;
  }
}
