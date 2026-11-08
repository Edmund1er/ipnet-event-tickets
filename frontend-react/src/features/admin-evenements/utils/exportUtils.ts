export function downloadExportUrl(evenementId: number, format: 'CSV' | 'PDF'): string {
  return `/api/admin/evenements/${evenementId}/export?format=${format}`;
}
