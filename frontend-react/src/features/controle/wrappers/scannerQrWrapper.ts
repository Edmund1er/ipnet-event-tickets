import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

/**
 * Adaptateur caméra (html5-qrcode). Le composant ne dépend que de cette interface :
 * changer de bibliothèque ne touche que ce fichier.
 */
export interface ScannerQr {
  demarrer(surLecture: (texte: string) => void): Promise<void>
  arreter(): Promise<void>
}

export function creerScannerQr(idElement: string): ScannerQr {
  const lecteur = new Html5Qrcode(idElement, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false })
  let actif = false
  return {
    async demarrer(surLecture) {
      await lecteur.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: (l, h) => {
          const cote = Math.floor(Math.min(l, h) * 0.75)
          return { width: cote, height: cote }
        } },
        (texte) => surLecture(texte),
        () => undefined,
      )
      actif = true
    },
    async arreter() {
      if (actif) {
        actif = false
        try {
          await lecteur.stop()
          lecteur.clear()
        } catch {
          /* caméra déjà libérée */
        }
      }
    },
  }
}
