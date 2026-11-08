import { useState } from 'react';
import { adminEvenementService } from '../services/adminEvenementService';
import { CreerEvenementDemande } from '../types/adminEvenement.types';

export function useAdminEvenements() {
  const [actionEnCours, setActionEnCours] = useState(false);

  const creer = async (data: CreerEvenementDemande) => {
    setActionEnCours(true);
    try { return await adminEvenementService.creer(data); }
    finally { setActionEnCours(false); }
  };

  return { creer, actionEnCours };
}
