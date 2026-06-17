import { useEffect, useState } from 'react';
import { ShimmerText } from '@/components/ui/ShimmerText';

export function CyclingShimmerText({
  messages,
  intervalMs = 2200,
  className,
}: {
  messages: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [messages, intervalMs]);

  return (
    <ShimmerText key={messages[index]} className={className}>
      {messages[index]}
    </ShimmerText>
  );
}

export const ADVISOR_LOADING_MESSAGES = [
  'Matching notes to today\'s weather…',
  'Scanning your wardrobe…',
  'Checking projection for the occasion…',
  'Balancing longevity and vibe…',
];

export const HOME_LOADING_MESSAGES = [
  'Finding today\'s scent…',
  'Reading the weather…',
  'Scoring your wardrobe…',
];

export const DEMO_LOADING_MESSAGES = [
  'Loading demo wardrobe…',
  'Seeding wear history…',
  'Almost ready…',
];
