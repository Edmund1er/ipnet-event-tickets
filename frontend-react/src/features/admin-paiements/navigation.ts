import type { EntreeNavigation } from '../../core/navigation/types'

export const navigation: EntreeNavigation[] = [
  { libelle: 'Paiements', chemin: '/admin/paiements', icone: 'payments', roles: ['ADMIN'], groupe: 'Administration', ordre: 120 },
  { libelle: 'Import du relevé', chemin: '/admin/releve', icone: 'upload_file', roles: ['ADMIN'], groupe: 'Administration', ordre: 130 },
]
