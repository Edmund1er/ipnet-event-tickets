import { expect, test, type Page } from '@playwright/test'
import { simulerApi } from './api'

async function remplirInscriptionVisiteur(page: Page) {
  await page.goto('/inscription')
  await page.getByText('Visiteur externe').click()
  await page.getByLabel('Nom', { exact: true }).fill('Kossi')
  await page.getByLabel('Prénom').fill('Ama')
  await page.getByLabel('E-mail').fill('parent@test.tg')
  await page.getByLabel('Téléphone').fill('90 11 23 45')
  await page.getByLabel('Catégorie').selectOption('2')
  await page.getByLabel('Mot de passe', { exact: true }).fill('MotDePasseOk12')
  await page.getByLabel('Confirmation').fill('MotDePasseOk12')
}

test.describe('inscription : le compte n’existe qu’après validation du code', () => {
  test('parcours complet visiteur, sans champ adresse', async ({ page }) => {
    const api = await simulerApi(page)
    await remplirInscriptionVisiteur(page)
    await expect(page.getByLabel('Adresse')).toHaveCount(0)
    await page.getByRole('button', { name: /créer mon compte/i }).click()

    // Étape code : aucune session, aucun profil chargé
    await expect(page.getByRole('heading', { name: /vérifiez votre e-mail/i })).toBeVisible()
    await expect(page.getByText('parent@test.tg').first()).toBeVisible()
    expect(api.corpsInscription).toBeDefined()
    expect(api.corpsInscription).not.toHaveProperty('adresse')
    expect(api.appels).not.toContain('GET /profil/moi')
    expect(api.compteCree).toBe(false)

    // Mauvais code : refusé, toujours aucun compte
    await page.getByLabel('Chiffre 1').click()
    await page.keyboard.type('000000')
    await page.getByRole('button', { name: /valider et créer/i }).click()
    await expect(page.getByRole('alert')).toContainText('Code incorrect')
    expect(api.compteCree).toBe(false)

    // Bon code : compte créé et connecté
    await page.getByLabel('Chiffre 1').click()
    await page.keyboard.type(api.codeAttendu)
    await page.getByRole('button', { name: /valider et créer/i }).click()
    await expect(page).toHaveURL('/')
    expect(api.compteCree).toBe(true)
    await expect(page.getByText('JPOPE 2026').first()).toBeVisible()
  })

  test('la page du code est inaccessible sans demande préalable', async ({ page }) => {
    await simulerApi(page)
    await page.goto('/inscription/verification')
    await expect(page).toHaveURL(/\/inscription$/)
  })
})

test.describe('accès protégés', () => {
  test('un anonyme est renvoyé vers la connexion depuis le tableau de bord et les pages participant', async ({ page }) => {
    await simulerApi(page)
    for (const chemin of ['/admin', '/admin/paiements', '/reservations', '/billets', '/controle/scanner']) {
      await page.goto(chemin)
      await expect(page).toHaveURL(/\/connexion/)
    }
  })

  test('un participant ne peut pas ouvrir l’espace administrateur', async ({ page }) => {
    await simulerApi(page, { session: 'PARTICIPANT' })
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin/)
  })
})

test.describe('données dynamiques', () => {
  test('la liste affiche les événements de l’API avec date formatée', async ({ page }) => {
    await simulerApi(page)
    await page.goto('/')
    await expect(page.getByText('JPOPE 2026').first()).toBeVisible()
    await expect(page.getByText(/5 décembre 2026 à 18h30/).first()).toBeVisible()
    await expect(page.getByText('500 FCFA').first()).toBeVisible()
  })

  test('l’administrateur choisit date et image dès la création d’un événement', async ({ page }) => {
    await simulerApi(page, { session: 'ADMIN' })
    await page.goto('/admin/evenements/nouveau')
    const champDate = page.getByLabel('Date et heure de début')
    await expect(champDate).toHaveAttribute('type', 'datetime-local')
    await expect(champDate).toHaveAttribute('min', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    await expect(page.getByText('Choisir une image')).toBeVisible()
  })
})

test.describe('responsive : aucun débordement horizontal', () => {
  for (const chemin of ['/', '/connexion', '/inscription', '/mot-de-passe-oublie']) {
    test(`page ${chemin}`, async ({ page }) => {
      await simulerApi(page)
      await page.goto(chemin)
      await page.waitForLoadState('networkidle')
      const { largeurPage, largeurFenetre } = await page.evaluate(() => ({
        largeurPage: document.documentElement.scrollWidth,
        largeurFenetre: window.innerWidth,
      }))
      expect(largeurPage).toBeLessThanOrEqual(largeurFenetre)
    })
  }

  test('formulaire d’inscription visiteur et étudiant tiennent dans l’écran', async ({ page }) => {
    await simulerApi(page)
    await remplirInscriptionVisiteur(page)
    for (const champ of [page.getByLabel('E-mail'), page.getByLabel('Catégorie'), page.getByLabel('Confirmation')]) {
      const boite = await champ.boundingBox()
      const largeur = page.viewportSize()!.width
      expect(boite!.x).toBeGreaterThanOrEqual(0)
      expect(boite!.x + boite!.width).toBeLessThanOrEqual(largeur)
      expect(boite!.height).toBeGreaterThanOrEqual(44) // cible tactile
    }
  })

  test('formulaire de création d’événement (administrateur)', async ({ page }) => {
    await simulerApi(page, { session: 'ADMIN' })
    await page.goto('/admin/evenements/nouveau')
    await page.waitForLoadState('networkidle')
    const { largeurPage, largeurFenetre } = await page.evaluate(() => ({
      largeurPage: document.documentElement.scrollWidth,
      largeurFenetre: window.innerWidth,
    }))
    expect(largeurPage).toBeLessThanOrEqual(largeurFenetre)
  })
})
