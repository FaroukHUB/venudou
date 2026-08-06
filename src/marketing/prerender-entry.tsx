import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { MARKETING_ROUTES } from './routes';
import NotFound from './pages/NotFound';
import { PUBLIC_PAGES, SITE, canonicalUrl, renderHeadTags, metaForPath } from './seo';

/**
 * Point d'entrée SSR du pré-rendu statique (build dédié, voir
 * vite.prerender.config.ts). Consommé par scripts/prerender.mjs.
 */

export interface PrerenderedPage {
  path: string;
  head: string;
  html: string;
  sitemap: boolean;
}

export function renderAllPages(): PrerenderedPage[] {
  return MARKETING_ROUTES.map(({ path, Component }) => {
    const meta = metaForPath(path);
    if (!meta) {
      throw new Error(`Métadonnées SEO manquantes pour la page publique ${path}`);
    }
    return {
      path,
      head: renderHeadTags(meta),
      html: renderToStaticMarkup(createElement(Component)),
      sitemap: meta.sitemap !== false,
    };
  });
}

export function render404(): { head: string; html: string } {
  return {
    head: [
      `<title>Page introuvable — ${SITE.name}</title>`,
      `<meta name="robots" content="noindex" />`,
    ].join('\n    '),
    html: renderToStaticMarkup(createElement(NotFound)),
  };
}

export function renderSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_PAGES.filter((p) => p.sitemap !== false)
    .map(
      (p) =>
        `  <url>\n    <loc>${canonicalUrl(p.path)}</loc>\n    <lastmod>${
          p.article?.dateModified ?? today
        }</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobots(): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /app',
    'Disallow: /kiosk',
    'Disallow: /super-admin',
    'Disallow: /connexion',
    'Disallow: /inscription',
    'Disallow: /mot-de-passe-oublie',
    'Disallow: /bienvenue',
    'Disallow: /api/',
    'Disallow: /r/',
    '',
    `Sitemap: ${SITE.baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export { SITE };
