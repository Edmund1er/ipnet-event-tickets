import type { EntreeNavigation } from '../../core/navigation/types'

export const navigation: EntreeNavigation[] = [
  { libelle: 'Paramètres', chemin: '/admin/parametres', icone: 'settings', roles: ['ADMIN'], groupe: 'Administration', ordre: 180 },
]
