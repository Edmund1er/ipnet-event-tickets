import type { Page, Route } from '@playwright/test'

/** Simulation de l'API REST : mêmes routes et mêmes formes que le backend Spring. */
export interface EtatApi {
  appels: string[]
  codeAttendu: string
  compteCree: boolean
  corpsInscription?: Record<string, unknown>
}

const EVENEMENT = {
  id: 1,
  titre: 'JPOPE 2026',
  description: 'Journée portes ouvertes',
  dateDebut: '2026-12-05T18:30:00',
  lieu: 'IPNET Institute of Technology, Lomé',
  prix: 500,
  devise: 'XOF',
  capacite: 300,
  placesReservees: 12,
  placesRestantes: 288,
  statut: 'PUBLIE',
  aImage: false,
}

const json = (route: Route, status: number, corps: unknown) =>
  route.fulfill({ status, contentType: status >= 400 ? 'application/problem+json' : 'application/json', body: JSON.stringify(corps) })

export async function simulerApi(page: Page, options: { session?: 'PARTICIPANT' | 'ADMIN' } = {}): Promise<EtatApi> {
  const etat: EtatApi = { appels: [], codeAttendu: '123456', compteCree: false }

  await page.route((u) => u.pathname.startsWith('/api/'), async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const chemin = url.pathname.replace(/^\/api/, '')
    etat.appels.push(`${req.method()} ${chemin}`)

    if (chemin === '/installation') return json(route, 200, { installationRequise: false })
    if (chemin === '/auth/rafraichir') {
      if (options.session) return json(route, 200, session(options.session))
      return json(route, 401, { status: 401, title: 'Session expirée', detail: 'Session expirée' })
    }
    if (chemin === '/profil/moi') return json(route, 200, profil(options.session ?? 'PARTICIPANT', etat.compteCree))
    if (chemin === '/evenements' && req.method() === 'GET')
      return json(route, 200, { elements: [EVENEMENT], page: 0, taille: 12, totalElements: 1, totalPages: 1, premiere: true, derniere: true })
    if (chemin === '/evenements/1') return json(route, 200, EVENEMENT)
    if (chemin === '/referentiels/filieres') return json(route, 200, [{ id: 1, libelle: 'Génie Logiciel' }])
    if (chemin === '/referentiels/categories-visiteurs')
      return json(route, 200, [{ id: 2, code: 'PARENT', libelle: "Parent d'élève" }])
    if (chemin === '/referentiels/telephone')
      return json(route, 200, { regionParDefaut: 'TG', indicatifParDefaut: 228, regionsAutorisees: [] })

    if (chemin === '/auth/inscription') {
      etat.corpsInscription = req.postDataJSON()
      return json(route, 202, { email: etat.corpsInscription?.email, codeValideMinutes: 5, message: 'Code envoyé' })
    }
    if (chemin === '/auth/inscription/verification') {
      const corps = req.postDataJSON() as { code: string }
      if (corps.code !== etat.codeAttendu)
        return json(route, 400, { status: 400, title: 'Code invalide', detail: 'Code incorrect (4 essai(s) restant(s)).', code: 'RG-03' })
      etat.compteCree = true
      return json(route, 201, session('PARTICIPANT'))
    }
    if (chemin === '/admin/evenements' && req.method() === 'POST') {
      const corps = req.postDataJSON()
      return json(route, 201, { ...EVENEMENT, id: 2, ...corps, statut: 'BROUILLON', placesReservees: 0, placesRestantes: corps.capacite })
    }
    if (chemin === '/admin/evenements/2/image') return json(route, 200, { ...EVENEMENT, id: 2, aImage: true })
    if (chemin === '/auth/deconnexion') return route.fulfill({ status: 204 })
    return json(route, 404, { status: 404, title: 'Introuvable', detail: `Route non simulée ${chemin}` })
  })
  return etat
}

function session(role: 'PARTICIPANT' | 'ADMIN') {
  return { accessToken: 'jeton-e2e', expireDans: 900, utilisateurId: 1, role, emailVerifie: true }
}

function profil(role: 'PARTICIPANT' | 'ADMIN', cree: boolean) {
  return {
    id: 1,
    email: role === 'ADMIN' ? 'admin@test.tg' : 'parent@test.tg',
    emailVerifie: true,
    telephone: '+22890112345',
    role,
    typeProfil: role === 'ADMIN' ? 'AUCUN' : 'VISITEUR',
    nom: role === 'ADMIN' ? null : 'Kossi',
    prenom: role === 'ADMIN' ? null : 'Ama',
    creeLe: cree ? new Date().toISOString() : '2026-11-01T10:00:00',
    etudiant: null,
    visiteur: role === 'ADMIN' ? null : { categorieId: 2, categorieCode: 'PARENT', categorieLibelle: "Parent d'élève", organisation: null },
  }
}
