import { EvenementResume } from '../types/evenement.types';

export function filtrerEvenements(liste: EvenementResume[], query: string): EvenementResume[] {
  if (!query) return liste;
  const q = query.toLowerCase();
  return liste.filter(e => e.titre.toLowerCase().includes(q) || e.lieu.toLowerCase().includes(q));
}
