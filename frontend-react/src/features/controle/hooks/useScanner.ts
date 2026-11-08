import { useState } from 'react';
import { controleService } from '../services/controleService';
import { ScanResultat } from '../types/controle.types';

export function useScanner(evenementId: number) {
  const [resultat, setResultat] = useState<ScanResultat | null>(null);
  const [scanning, setScanning] = useState(false);

  const traiterCode = async (jeton: string) => {
    setScanning(true);
    try {
      const res = await controleService.scanner(jeton, evenementId);
      setResultat(res);
      return res;
    } finally {
      setScanning(false);
    }
  };

  return { resultat, scanning, traiterCode };
}
