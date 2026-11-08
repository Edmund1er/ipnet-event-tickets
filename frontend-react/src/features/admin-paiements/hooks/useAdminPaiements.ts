import { useState, useEffect } from 'react';
import { adminPaiementService } from '../services/adminPaiementService';
import { PaiementPreuve } from '../types/adminPaiement.types';

export function useAdminPaiements() {
  const [paiements, setPaiements] = useState<PaiementPreuve[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = () => {
    setLoading(true);
    adminPaiementService.lister()
      .then(res => setPaiements(res.content || []))
      .catch(() => setPaiements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  return { paiements, loading, recharger: charger };
}
