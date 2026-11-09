import type { EntreeNavigation } from '../../core/navigation/types'

export const navigation: EntreeNavigation[] = [
  { libelle: 'Poste scanner', chemin: '/controle/scanner', icone: 'qr_code_scanner', roles: ['SCANNER', 'ADMIN'], groupe: "Contrôle d'accès", ordre: 200 },
  { libelle: 'Tableau temps réel', chemin: '/controle/temps-reel', icone: 'monitoring', roles: ['SCANNER', 'ADMIN'], groupe: "Contrôle d'accès", ordre: 210 },
]
