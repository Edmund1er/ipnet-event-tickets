export interface ConnexionRequest { telephone: string; motDePasse: string; }
export interface InscriptionRequest { nom: string; prenom: string; email: string; telephone: string; motDePasse: string; typeProfil: 'ETUDIANT' | 'VISITEUR'; filiereId?: number; anneeInscriptionL1?: number; }
export interface AuthResponse { accessToken: string; refreshToken: string; tokenType: string; }
