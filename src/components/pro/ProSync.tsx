import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePro } from '@/context/ProContext';

/** Keeps ProContext bottle count in sync with collection size */
export function ProSync() {
  const { collection } = useApp();
  const { setBottleCount } = usePro();

  useEffect(() => {
    setBottleCount(collection.length);
  }, [collection.length, setBottleCount]);

  return null;
}
