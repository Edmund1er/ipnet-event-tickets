import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Alerte, EnteteSection, Tuile } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { adminPaiementService, type RapportRapprochement } from '../services/adminPaiementService'

/** EF-26 : import du relevé CSV de l'opérateur et rapport de rapprochement automatique. */
export function ImportRelevePage() {
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string[][]>([])
  const [rapport, setRapport] = useState<RapportRapprochement | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function choisir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setRapport(null)
    setErreur(null)
    setApercu([])
    setFichier(f)
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setErreur('Sélectionnez un fichier .csv')
      setFichier(null)
      return
    }
    const texte = await f.text()
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim()).slice(0, 6)
    setApercu(lignes.map((l) => l.replace(/^﻿/, '').split(l.includes(';') ? ';' : ',').map((c) => c.replaceAll('"', '').trim())))
  }

  async function importer(e: FormEvent) {
    e.preventDefault()
    if (!fichier) return
    setEnCours(true)
    setErreur(null)
    try {
      setRapport(await adminPaiementService.importerReleve(fichier))
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EnteteSection icone="upload_file" titre="Import du relevé opérateur" sousTitre="Rapprochement automatique par référence et montant" />

      <form onSubmit={importer} className="carte flex flex-col gap-4 p-5">
        <p className="text-sm text-attenue">
          Fichier CSV exporté par l'opérateur Mobile Money : une ligne d'en-tête puis les colonnes <strong>référence</strong>,{' '}
          <strong>montant</strong> et <strong>date</strong> (facultative), séparées par « ; » ou « , ». Chaque référence déclarée par un participant
          avec le même montant est confirmée automatiquement ; les autres restent dans la file de traitement manuel.
        </p>
        <label
          htmlFor="releve"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-primaire-moyen bg-surface p-8 text-center hover:border-primaire"
        >
          <Icone nom="description" taille={40} className="text-primaire" />
          <span className="font-semibold">{fichier ? fichier.name : 'Choisir le fichier CSV'}</span>
          {fichier && <span className="text-xs text-attenue">{(fichier.size / 1024).toFixed(1)} Ko</span>}
        </label>
        <input id="releve" type="file" accept=".csv,text/csv" className="sr-only" onChange={choisir} />

        {apercu.length > 0 && (
          <div>
            <p className="titre-section mb-2">Aperçu</p>
            <div className="overflow-x-auto rounded-lg border border-bordure">
              <table className="w-full text-sm">
                <tbody>
                  {apercu.map((l, i) => (
                    <tr key={i} className={i === 0 ? 'bg-surface font-semibold' : 'border-t border-bordure'}>
                      {l.map((c, j) => (
                        <td key={j} className="px-3 py-2 font-mono text-[13px]">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        <div className="flex justify-end">
          <Bouton type="submit" icone="sync" disabled={!fichier} enCours={enCours}>
            Importer et rapprocher
          </Bouton>
        </div>
      </form>

      {rapport && (
        <section className="mt-6" aria-label="Rapport de rapprochement">
          <h2 className="mb-3 text-lg font-semibold">Rapport de rapprochement</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Tuile icone="list_alt" libelle="Lignes importées" valeur={rapport.lignesImportees} detail="Nouvelles transactions du relevé" />
            <Tuile icone="verified" ton="vert" libelle="Confirmées automatiquement" valeur={rapport.confirmeesAutomatiquement} detail="Billets émis et envoyés" />
            <Tuile icone="pending_actions" ton="orange" libelle="À traiter manuellement" valeur={rapport.aTraiterManuellement} detail="Dans la file des paiements" />
          </div>
          {rapport.aTraiterManuellement > 0 && (
            <Link to="/admin/paiements" className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primaire px-4 font-semibold text-white">
              <Icone nom="arrow_forward" /> Traiter les paiements restants
            </Link>
          )}
        </section>
      )}
    </div>
  )
}
