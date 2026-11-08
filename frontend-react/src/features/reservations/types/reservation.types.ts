export interface Reservation {
  id: number; utilisateurId: number; evenementId: number; statut: string; creeLe: string; expireLe?: string; motifAnnulation?: string;
}
