import { useState, useEffect } from 'react';
import { evenementService } from '../services/evenementService';
import { EvenementResume } from '../types/evenement.types';

export function useEvenements() {
  const [evenements, setEvenements] = useState<EvenementResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evenementService.lister()
      .then(res => setEvenements(res.elements || []))
      .catch(() => setEvenements([]))
      .finally(() => setLoading(false));
  }, []);

  return { evenements, loading };
}
