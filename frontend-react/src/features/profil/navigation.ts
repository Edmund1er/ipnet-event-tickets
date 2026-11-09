import type { EntreeNavigation } from '../../core/navigation/types'

export const navigation: EntreeNavigation[] = [
  { libelle: 'Mon profil', chemin: '/profil', icone: 'account_circle', roles: ['PARTICIPANT', 'ADMIN', 'SCANNER'], groupe: 'Compte', ordre: 900 },
]
