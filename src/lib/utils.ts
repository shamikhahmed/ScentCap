import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return crypto.randomUUID();
}

export const BOTTLE_LEVEL_WEAR_FACTOR: Record<string, number> = {
  full: 1,
  '75': 0.75,
  '50': 0.5,
  '25': 0.25,
  '10': 0.1,
  empty: 0,
};

export function estimateWearsRemaining(level: string, concentration: string): number {
  const base = { EDT: 120, EDP: 90, Parfum: 60, Cologne: 150, Extrait: 45 }[concentration] ?? 90;
  return Math.round(base * (BOTTLE_LEVEL_WEAR_FACTOR[level] ?? 1));
}
