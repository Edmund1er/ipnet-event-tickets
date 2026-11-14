import type { Evenement } from '../../../core/api/types'
import { montant } from '../../../core/utils/format'

/** Libellé de tarif d'un événement ou d'une activité : accès libre, gratuit sur inscription, ou prix. */
export function libelleTarif(e: Evenement): string {
  if (e.accesLibre) return 'Accès libre'
  if (e.prix === 0) return 'Gratuit · inscription'
  return montant(e.prix, e.devise)
}
