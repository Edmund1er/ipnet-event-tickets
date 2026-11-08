import { useState } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../../../core/storage/tokenStorage';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seConnecter = async (telephone: string, mdp: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.connexion({ telephone, motDePasse: mdp });
      tokenStorage.setToken(res.accessToken);
      tokenStorage.setRefreshToken(res.refreshToken);
      return res;
    } catch (err: any) {
      setError(err?.message || "Erreur d'authentification");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { seConnecter, loading, error };
}
