export function formatPrix(montant: number, devise = 'XOF'): string {
  return new Intl.NumberFormat('fr-TG', {
    style: 'currency',
    currency: devise,
    maximumFractionDigits: 0
  }).format(montant);
}

export function formatDateHeure(dateIso: string): string {
  if (!dateIso) return '';
  return new Intl.DateTimeFormat('fr-TG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateIso));
}
