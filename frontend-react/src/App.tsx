import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './core/auth/AuthContext'
import { AppLayout } from './core/components/layout/AppLayout'
import { PublicLayout } from './core/components/layout/PublicLayout'
import { ChargementPage } from './core/components/ui/Chargement'
import { EtatVide } from './core/components/ui/Divers'
import { ImmersionProvider } from './core/components/layout/Immersion'
import { ToastsProvider } from './core/components/ui/Toasts'
import type { EntreeNavigation } from './core/navigation/types'
import { GardeInstallation } from './core/routing/GardeInstallation'
import { RequireAnonyme, RequireRole } from './core/routing/Gardes'

import { navigation as navAdminEvenements } from './features/admin-evenements/navigation'
import { navigation as navAdminPaiements } from './features/admin-paiements/navigation'
import { navigation as navAdministration } from './features/administration/navigation'
import { navigation as navBillets } from './features/billets/navigation'
import { navigation as navControle } from './features/controle/navigation'
import { navigation as navEvenements } from './features/evenements/navigation'
import { navigation as navParametres } from './features/parametres/navigation'
import { navigation as navProfil } from './features/profil/navigation'
import { navigation as navReservations } from './features/reservations/navigation'

// Charger chaque écran avec sa route pour garder le premier écran léger.
const AdminEvenementsPage = lazy(() => import('./features/admin-evenements/pages/AdminEvenementsPage').then((m) => ({ default: m.AdminEvenementsPage })))
const FormulaireEvenementPage = lazy(() => import('./features/admin-evenements/pages/FormulaireEvenementPage').then((m) => ({ default: m.FormulaireEvenementPage })))
const ConstructeurPage = lazy(() => import('./features/admin-evenements/pages/ConstructeurPage').then((m) => ({ default: m.ConstructeurPage })))
const ParticipantsPage = lazy(() => import('./features/admin-evenements/pages/ParticipantsPage').then((m) => ({ default: m.ParticipantsPage })))
const ProgrammeAdminPage = lazy(() => import('./features/admin-evenements/pages/ProgrammeAdminPage').then((m) => ({ default: m.ProgrammeAdminPage })))
const ImportRelevePage = lazy(() => import('./features/admin-paiements/pages/ImportRelevePage').then((m) => ({ default: m.ImportRelevePage })))
const PaiementsPage = lazy(() => import('./features/admin-paiements/pages/PaiementsPage').then((m) => ({ default: m.PaiementsPage })))
const AgentsScanPage = lazy(() => import('./features/administration/pages/AgentsScanPage').then((m) => ({ default: m.AgentsScanPage })))
const AuditPage = lazy(() => import('./features/administration/pages/AuditPage').then((m) => ({ default: m.AuditPage })))
const NotificationsPage = lazy(() => import('./features/administration/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const TableauDeBordPage = lazy(() => import('./features/administration/pages/TableauDeBordPage').then((m) => ({ default: m.TableauDeBordPage })))
const ConnexionPage = lazy(() => import('./features/auth/pages/ConnexionPage').then((m) => ({ default: m.ConnexionPage })))
const InscriptionPage = lazy(() => import('./features/auth/pages/InscriptionPage').then((m) => ({ default: m.InscriptionPage })))
const InstallationPage = lazy(() => import('./features/auth/pages/InstallationPage').then((m) => ({ default: m.InstallationPage })))
const MotDePasseOubliePage = lazy(() => import('./features/auth/pages/MotDePassePages').then((m) => ({ default: m.MotDePasseOubliePage })))
const ReinitialisationPage = lazy(() => import('./features/auth/pages/MotDePassePages').then((m) => ({ default: m.ReinitialisationPage })))
const VerificationInscriptionPage = lazy(() => import('./features/auth/pages/VerificationInscriptionPage').then((m) => ({ default: m.VerificationInscriptionPage })))
const VerificationPage = lazy(() => import('./features/auth/pages/VerificationPage').then((m) => ({ default: m.VerificationPage })))
const MesBilletsPage = lazy(() => import('./features/billets/pages/MesBilletsPage').then((m) => ({ default: m.MesBilletsPage })))
const DetailEvenementPage = lazy(() => import('./features/evenements/pages/DetailEvenementPage').then((m) => ({ default: m.DetailEvenementPage })))
const ApercuModelePage = lazy(() => import('./features/evenements/pages/ApercuModelePage').then((m) => ({ default: m.ApercuModelePage })))
const ListeEvenementsPage = lazy(() => import('./features/evenements/pages/ListeEvenementsPage').then((m) => ({ default: m.ListeEvenementsPage })))
const ParametresPage = lazy(() => import('./features/parametres/pages/ParametresPage').then((m) => ({ default: m.ParametresPage })))
const ProfilPage = lazy(() => import('./features/profil/pages/ProfilPage').then((m) => ({ default: m.ProfilPage })))
const MesReservationsPage = lazy(() => import('./features/reservations/pages/MesReservationsPage').then((m) => ({ default: m.MesReservationsPage })))
const PaiementPage = lazy(() => import('./features/reservations/pages/PaiementPage').then((m) => ({ default: m.PaiementPage })))

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
          <ImmersionProvider>
          <GardeInstallation>
          <Suspense fallback={<ChargementPage />}>
          <Routes>
            {/* Pages publiques (et accessibles une fois connecté) */}
            <Route element={<GabaritAdaptatif />}>
              <Route index element={<ListeEvenementsPage />} />
              <Route path="evenements/:id" element={<DetailEvenementPage />} />
              <Route path="apercu-modele/:cle" element={<ApercuModelePage />} />
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
              <Route path="admin/evenements/:id/page" element={admin(<ConstructeurPage />)} />
              <Route path="admin/evenements/:id/programme" element={admin(<ProgrammeAdminPage />)} />
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
          </Suspense>
          </GardeInstallation>
          </ImmersionProvider>
        </ToastsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
