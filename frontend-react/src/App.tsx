import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './core/auth/AuthContext'
import { AppLayout } from './core/components/layout/AppLayout'
import { PublicLayout } from './core/components/layout/PublicLayout'
import { ChargementPage } from './core/components/ui/Chargement'
import { EtatVide } from './core/components/ui/Divers'
import { ToastsProvider } from './core/components/ui/Toasts'
import type { EntreeNavigation } from './core/navigation/types'
import { GardeInstallation } from './core/routing/GardeInstallation'
import { RequireAnonyme, RequireRole } from './core/routing/Gardes'

import { navigation as navAdminEvenements } from './features/admin-evenements/navigation'
import { AdminEvenementsPage } from './features/admin-evenements/pages/AdminEvenementsPage'
import { FormulaireEvenementPage } from './features/admin-evenements/pages/FormulaireEvenementPage'
import { ParticipantsPage } from './features/admin-evenements/pages/ParticipantsPage'
import { navigation as navAdminPaiements } from './features/admin-paiements/navigation'
import { ImportRelevePage } from './features/admin-paiements/pages/ImportRelevePage'
import { PaiementsPage } from './features/admin-paiements/pages/PaiementsPage'
import { navigation as navAdministration } from './features/administration/navigation'
import { AgentsScanPage } from './features/administration/pages/AgentsScanPage'
import { AuditPage } from './features/administration/pages/AuditPage'
import { NotificationsPage } from './features/administration/pages/NotificationsPage'
import { TableauDeBordPage } from './features/administration/pages/TableauDeBordPage'
import { ConnexionPage } from './features/auth/pages/ConnexionPage'
import { InscriptionPage } from './features/auth/pages/InscriptionPage'
import { InstallationPage } from './features/auth/pages/InstallationPage'
import { MotDePasseOubliePage, ReinitialisationPage } from './features/auth/pages/MotDePassePages'
import { VerificationInscriptionPage } from './features/auth/pages/VerificationInscriptionPage'
import { VerificationPage } from './features/auth/pages/VerificationPage'
import { navigation as navBillets } from './features/billets/navigation'
import { MesBilletsPage } from './features/billets/pages/MesBilletsPage'
import { navigation as navControle } from './features/controle/navigation'
import { navigation as navEvenements } from './features/evenements/navigation'
import { DetailEvenementPage } from './features/evenements/pages/DetailEvenementPage'
import { ListeEvenementsPage } from './features/evenements/pages/ListeEvenementsPage'
import { navigation as navParametres } from './features/parametres/navigation'
import { ParametresPage } from './features/parametres/pages/ParametresPage'
import { navigation as navProfil } from './features/profil/navigation'
import { ProfilPage } from './features/profil/pages/ProfilPage'
import { navigation as navReservations } from './features/reservations/navigation'
import { MesReservationsPage } from './features/reservations/pages/MesReservationsPage'
import { PaiementPage } from './features/reservations/pages/PaiementPage'

// Contrôle d'accès chargé à la demande (bibliothèque caméra volumineuse)
const ScannerPage = lazy(() => import('./features/controle/pages/ScannerPage').then((m) => ({ default: m.ScannerPage })))
const TempsReelPage = lazy(() => import('./features/controle/pages/TempsReelPage').then((m) => ({ default: m.TempsReelPage })))

/** Ajouter une feature = ajouter son fichier navigation.ts ici (Sidebar dynamique, architecture §4.2). */
const NAVIGATION: EntreeNavigation[] = [
  ...navEvenements,
  ...navReservations,
  ...navBillets,
  ...navAdministration,
  ...navAdminEvenements,
  ...navAdminPaiements,
  ...navParametres,
  ...navControle,
  ...navProfil,
]

/** Pages publiques : gabarit connecté si une session existe, gabarit public sinon. */
function GabaritAdaptatif() {
  const { chargement, session } = useAuth()
  if (chargement) return <ChargementPage />
  return session ? <AppLayout entrees={NAVIGATION} /> : <PublicLayout />
}

const participant = (page: ReactNode) => <RequireRole roles={['PARTICIPANT']}>{page}</RequireRole>
const admin = (page: ReactNode) => <RequireRole roles={['ADMIN']}>{page}</RequireRole>
const controle = (page: ReactNode) => (
  <RequireRole roles={['SCANNER', 'ADMIN']}>
    <Suspense fallback={<ChargementPage />}>{page}</Suspense>
  </RequireRole>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastsProvider>
          <GardeInstallation>
          <Routes>
            {/* Pages publiques (et accessibles une fois connecté) */}
            <Route element={<GabaritAdaptatif />}>
              <Route index element={<ListeEvenementsPage />} />
              <Route path="evenements/:id" element={<DetailEvenementPage />} />
            </Route>

            {/* Authentification */}
            <Route element={<PublicLayout />}>
              <Route path="connexion" element={<RequireAnonyme><ConnexionPage /></RequireAnonyme>} />
              <Route path="inscription" element={<RequireAnonyme><InscriptionPage /></RequireAnonyme>} />
              <Route path="inscription/verification" element={<RequireAnonyme><VerificationInscriptionPage /></RequireAnonyme>} />
              <Route path="mot-de-passe-oublie" element={<RequireAnonyme><MotDePasseOubliePage /></RequireAnonyme>} />
              <Route path="reinitialisation-mot-de-passe" element={<ReinitialisationPage />} />
              <Route path="installation" element={<InstallationPage />} />
            </Route>

            {/* Espaces connectés */}
            <Route element={<RequireRole><AppLayout entrees={NAVIGATION} /></RequireRole>}>
              <Route path="verification" element={participant(<VerificationPage />)} />
              <Route path="reservations" element={participant(<MesReservationsPage />)} />
              <Route path="reservations/:id/paiement" element={participant(<PaiementPage />)} />
              <Route path="billets" element={participant(<MesBilletsPage />)} />
              <Route path="profil" element={<ProfilPage />} />

              <Route path="admin" element={admin(<TableauDeBordPage />)} />
              <Route path="admin/evenements" element={admin(<AdminEvenementsPage />)} />
              <Route path="admin/evenements/nouveau" element={admin(<FormulaireEvenementPage />)} />
              <Route path="admin/evenements/:id" element={admin(<FormulaireEvenementPage />)} />
              <Route path="admin/evenements/:id/participants" element={admin(<ParticipantsPage />)} />
              <Route path="admin/paiements" element={admin(<PaiementsPage />)} />
              <Route path="admin/releve" element={admin(<ImportRelevePage />)} />
              <Route path="admin/agents" element={admin(<AgentsScanPage />)} />
              <Route path="admin/audit" element={admin(<AuditPage />)} />
              <Route path="admin/notifications" element={admin(<NotificationsPage />)} />
              <Route path="admin/parametres" element={admin(<ParametresPage />)} />

              <Route path="controle/scanner" element={controle(<ScannerPage />)} />
              <Route path="controle/temps-reel" element={controle(<TempsReelPage />)} />
            </Route>

            <Route path="accueil" element={<Navigate to="/" replace />} />
            <Route element={<GabaritAdaptatif />}>
              <Route path="*" element={<EtatVide icone="explore_off" titre="Page introuvable" texte="Cette adresse n'existe pas." />} />
            </Route>
          </Routes>
          </GardeInstallation>
        </ToastsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
