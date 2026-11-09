import { http } from '../../../core/api/httpClient'
import type { SessionResponse } from '../../../core/api/types'
import type { Categorie, DemandeInscription, Filiere, ReponseInscription } from '../types/auth.types'

export const authService = {
  async connexion(email: string, motDePasse: string) {
    return (await http.post<SessionResponse>('/auth/connexion', { email, motDePasse })).data
  },
  async inscription(demande: DemandeInscription) {
    return (await http.post<ReponseInscription>('/auth/inscription', demande)).data
  },
  /** Valide le code reçu par e-mail : c'est cette étape qui crée le compte et ouvre la session. */
  async confirmerInscription(email: string, code: string) {
    return (await http.post<SessionResponse>('/auth/inscription/verification', { email, code })).data
  },
  async renvoyerCodeInscription(email: string) {
    return (await http.post<ReponseInscription>('/auth/inscription/renvoi', { email })).data
  },
  async envoyerOtp() {
    await http.post('/auth/otp/envoi')
  },
  /** Confirme l'adresse e-mail ; la nouvelle session porte les droits du rôle. */
  async verifierOtp(code: string) {
    return (await http.post<SessionResponse>('/auth/otp/verification', { code })).data
  },
  async demanderChangementEmail(nouvelEmail: string) {
    return (await http.post<{ message: string }>('/profil/moi/email', { nouvelEmail })).data
  },
  async confirmerChangementEmail(code: string) {
    await http.post('/profil/moi/email/confirmation', { code })
  },
  async etatInstallation() {
    return (await http.get<{ installationRequise: boolean }>('/installation')).data
  },
  async installer(d: { code: string; email: string; telephone: string; motDePasse: string }) {
    return (await http.post<SessionResponse>('/installation', d)).data
  },
  async motDePasseOublie(email: string) {
    return (await http.post<{ message: string }>('/auth/mot-de-passe/oubli', { email })).data
  },
  async reinitialiser(jeton: string, nouveauMotDePasse: string) {
    return (await http.post<{ message: string }>('/auth/mot-de-passe/reinitialisation', { jeton, nouveauMotDePasse })).data
  },
  async filieres() {
    return (await http.get<Filiere[]>('/referentiels/filieres')).data
  },
  async categories() {
    return (await http.get<Categorie[]>('/referentiels/categories-visiteurs')).data
  },
}
