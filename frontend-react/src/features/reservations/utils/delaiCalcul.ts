export function tempsRestant(expireLeIso?: string): string {
  if (!expireLeIso) return '';
  const diff = new Date(expireLeIso).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const heures = Math.floor(diff / (1000 * 60 * 60));
  return `${heures}h restantes`;
}
