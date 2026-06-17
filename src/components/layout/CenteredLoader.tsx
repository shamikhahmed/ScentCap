import { motion } from 'framer-motion';
import { ShimmerText } from '@/components/ui/ShimmerText';
import { AmbientBackground } from '@/components/premium/AmbientBackground';
import { BrandMark } from '@/components/premium/BrandMark';

export function CenteredLoader() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <BrandMark size="sm" />
        <ShimmerText className="text-[var(--color-text-secondary)]">Loading ScentCap…</ShimmerText>
      </motion.div>
    </div>
  );
}
