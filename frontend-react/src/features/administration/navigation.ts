import type { EntreeNavigation } from '../../core/navigation/types'

export const navigation: EntreeNavigation[] = [
  { libelle: 'Tableau de bord', chemin: '/admin', icone: 'dashboard', roles: ['ADMIN'], groupe: 'Administration', ordre: 100 },
  { libelle: 'Agents de scan', chemin: '/admin/agents', icone: 'badge', roles: ['ADMIN'], groupe: 'Administration', ordre: 150 },
  { libelle: "Journal d'audit", chemin: '/admin/audit', icone: 'history', roles: ['ADMIN'], groupe: 'Administration', ordre: 160 },
  { libelle: 'Notifications', chemin: '/admin/notifications', icone: 'mail', roles: ['ADMIN'], groupe: 'Administration', ordre: 170 },
]
