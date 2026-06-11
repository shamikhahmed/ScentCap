import { useEffect, useState } from 'react';
import { getPhoto } from '@/db';

export function usePhotoUrl(photoBlobId?: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoBlobId) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    getPhoto(photoBlobId).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoBlobId]);

  return url;
}
