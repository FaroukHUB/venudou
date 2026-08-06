import { expect, test } from '@playwright/test';

// Parcours critiques du site public pré-rendu et du routage Worker.

test('la page d’accueil est servie pré-rendue avec son contenu principal', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  // Le contenu principal est dans le HTML initial (pas d'attente JS)
  await expect(page.locator('h1')).toContainText("Comprenez d'où viennent vos clients");
  await expect(page.locator('main')).toContainText('parcours tablette');
});

test('les métadonnées SEO sont présentes sur une page publique', async ({ page }) => {
  await page.goto('/fonctionnalites');
  await expect(page).toHaveTitle(/Fonctionnalités/);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute('content', /.{50,}/);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/fonctionnalites$/);
});

test('la navigation interne fonctionne (tarifs)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Tarifs' }).first().click();
  await expect(page).toHaveURL(/\/tarifs/);
  await expect(page.locator('h1')).toContainText('tarifs simples');
});

test('une URL inconnue renvoie un statut 404 réel', async ({ page }) => {
  const response = await page.goto('/page-qui-nexiste-pas');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText("n'existe pas");
});

test('les routes privées servent la SPA en noindex', async ({ page }) => {
  const response = await page.goto('/connexion');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.locator('h1')).toContainText('Connexion');
});

test('le kiosque affiche l’écran d’activation', async ({ page }) => {
  await page.goto('/kiosk');
  await expect(page.locator('h1')).toContainText('Activer cette tablette');
  await expect(page.getByLabel("Code d'activation")).toBeVisible();
});

test('un code d’activation invalide est refusé proprement', async ({ page }) => {
  await page.goto('/kiosk');
  await page.getByLabel("Code d'activation").fill('XXXXXX');
  await page.getByRole('button', { name: 'Activer' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
