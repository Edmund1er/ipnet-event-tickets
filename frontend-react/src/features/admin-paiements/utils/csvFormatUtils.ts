export function validerFichierCsv(fichier: File): boolean {
  return fichier.name.toLowerCase().endsWith('.csv');
}
