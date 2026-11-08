import { useState, useEffect } from 'react';
import { billetService } from '../services/billetService';
import { Billet } from '../types/billet.types';

export function useBillets() {
  const [billets, setBillets] = useState<Billet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billetService.mesBillets()
      .then(res => setBillets(res || []))
      .catch(() => setBillets([]))
      .finally(() => setLoading(false));
  }, []);

  return { billets, loading };
}
