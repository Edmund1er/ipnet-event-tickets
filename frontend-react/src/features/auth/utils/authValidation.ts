export function isValidPhone(phone: string): boolean {
  return /^\+228\d{8}$/.test(phone.trim());
}
