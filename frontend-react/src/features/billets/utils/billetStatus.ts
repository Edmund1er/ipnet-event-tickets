import { Billet } from '../types/billet.types';
export function estBilletValide(b: Billet): boolean { return !b.invalide && !b.scanneLe; }
