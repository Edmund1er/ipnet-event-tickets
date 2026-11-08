export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  ORGANISATEUR: 'ROLE_ORGANISATEUR',
  CONTROLEUR: 'ROLE_CONTROLEUR',
  PARTICIPANT: 'ROLE_PARTICIPANT'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
