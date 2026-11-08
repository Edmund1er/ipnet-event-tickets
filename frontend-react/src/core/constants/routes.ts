export const ROUTES = {
  HOME: '/',
  CONNEXION: '/connexion',
  INSCRIPTION: '/inscription',
  EVENEMENTS: '/evenements',
  EVENEMENT_DETAIL: (id: string | number) => `/evenements/${id}`,
  RESERVATIONS: '/reservations',
  BILLETS: '/billets',
  SCAN: '/scan',
  ADMIN_EVENEMENTS: '/admin/evenements',
  ADMIN_PAIEMENTS: '/admin/paiements',
  ADMIN_AUDIT: '/admin/audit'
} as const;
