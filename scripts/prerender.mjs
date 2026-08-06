/**
 * Pré-rendu statique des pages publiques VenuD'où.
 * S'exécute après `vite build` (client) et le build SSR (dist/prerender) :
 *  1. copie le shell SPA vers app-shell.html (servi par le Worker, noindex) ;
 *  2. écrit chaque page publique en HTML complet (contenu dans la réponse) ;
 *  3. génère 404.html (statut 404 servi par le Worker), robots.txt, sitemap.xml.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'dist', 'client');
const ssrEntry = path.join(root, 'dist', 'prerender', 'prerender-entry.js');

if (!existsSync(clientDir)) {
  throw new Error('dist/client introuvable — lancer `vite build` d’abord.');
}
if (!existsSync(ssrEntry)) {
  throw new Error('dist/prerender introuvable — lancer le build SSR d’abord.');
}

const { renderAllPages, render404, renderSitemap, renderRobots, SITE } = await import(
  pathToFileURL(ssrEntry).href
);

// --- Feuilles de style du build client (manifest Vite) ---
let cssFiles = [];
const manifestPath = path.join(clientDir, '.vite', 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  cssFiles = [...new Set(Object.values(manifest).flatMap((entry) => entry.css ?? []))];
}
if (cssFiles.length === 0) {
  // Repli : extraire les <link rel="stylesheet"> du shell SPA construit.
  const shell = await readFile(path.join(clientDir, 'index.html'), 'utf8');
  cssFiles = [...shell.matchAll(/href="\/(assets\/[^"]+\.css)"/g)].map((m) => m[1]);
}
const cssLinks = cssFiles.map((f) => `<link rel="stylesheet" href="/${f}" />`).join('\n    ');

function documentTemplate(head, body) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="theme-color" content="#1B3A6B" />
    ${cssLinks}
    ${head}
  </head>
  <body>
${body}
  </body>
</html>
`;
}

// 1. Shell SPA → app-shell.html (les routes privées le servent en noindex)
await copyFile(path.join(clientDir, 'index.html'), path.join(clientDir, 'app-shell.html'));

// 2. Pages publiques pré-rendues
const pages = renderAllPages();
for (const page of pages) {
  const outDir = page.path === '/' ? clientDir : path.join(clientDir, page.path.slice(1));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), documentTemplate(page.head, page.html));
}

// 3. 404, robots.txt, sitemap.xml
const nf = render404();
await writeFile(path.join(clientDir, '404.html'), documentTemplate(nf.head, nf.html));
await writeFile(path.join(clientDir, 'robots.txt'), renderRobots());
await writeFile(path.join(clientDir, 'sitemap.xml'), renderSitemap());

console.log(
  `Pré-rendu terminé : ${pages.length} pages publiques, 404.html, robots.txt, sitemap.xml (base ${SITE.baseUrl}).`,
);
