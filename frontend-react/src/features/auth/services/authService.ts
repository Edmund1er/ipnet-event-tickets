import { httpClient } from '../../../core/api/httpClient';
import { ConnexionRequest, InscriptionRequest, AuthResponse } from '../types/auth.types';

export const authService = {
  connexion: (data: ConnexionRequest) => httpClient<AuthResponse>('/auth/connexion', { method: 'POST', body: JSON.stringify(data) }),
  inscription: (data: InscriptionRequest) => httpClient<any>('/auth/inscription', { method: 'POST', body: JSON.stringify(data) }),
  envoyerOtp: (telephone: string) => httpClient<any>('/auth/otp/envoi', { method: 'POST', body: JSON.stringify({ telephone }) }),
  verifierOtp: (telephone: string, codeOtp: string) => httpClient<any>('/auth/otp/verification', { method: 'POST', body: JSON.stringify({ telephone, codeOtp }) })
};
