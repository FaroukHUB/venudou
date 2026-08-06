import { describe, expect, it } from 'vitest';
import {
  PUBLIC_PAGES,
  PRIVATE_PREFIXES,
  canonicalUrl,
  jsonLdForPage,
  metaForPath,
  renderHeadTags,
} from '@/marketing/seo';
import { MARKETING_ROUTES } from '@/marketing/routes';
import { renderRobots, renderSitemap } from '@/marketing/prerender-entry';

describe('métadonnées SEO', () => {
  it('chaque page publique a un title et une description uniques', () => {
    const titles = PUBLIC_PAGES.map((p) => p.title);
    const descriptions = PUBLIC_PAGES.map((p) => p.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const page of PUBLIC_PAGES) {
      expect(page.title.length).toBeGreaterThan(15);
      expect(page.title.length).toBeLessThanOrEqual(75);
      expect(page.description.length).toBeGreaterThan(50);
      expect(page.description.length).toBeLessThanOrEqual(180);
    }
  });

  it('chaque route publique a ses métadonnées, et réciproquement', () => {
    for (const route of MARKETING_ROUTES) {
      expect(metaForPath(route.path), `meta manquante pour ${route.path}`).toBeDefined();
    }
    for (const page of PUBLIC_PAGES) {
      expect(
        MARKETING_ROUTES.some((r) => r.path === page.path),
        `route manquante pour ${page.path}`,
      ).toBe(true);
    }
  });

  it('les canoniques sont absolues et sans slash final superflu', () => {
    for (const page of PUBLIC_PAGES) {
      const url = canonicalUrl(page.path);
      expect(url).toMatch(/^https?:\/\//);
      if (page.path !== '/') expect(url.endsWith('/')).toBe(false);
    }
  });

  it('les head tags contiennent title, description, canonical, OG et Twitter', () => {
    for (const page of PUBLIC_PAGES) {
      const head = renderHeadTags(page);
      expect(head).toContain('<title>');
      expect(head).toContain('name="description"');
      expect(head).toContain('rel="canonical"');
      expect(head).toContain('property="og:title"');
      expect(head).toContain('name="twitter:card"');
      expect(head).toContain('content="index, follow"');
      expect(head).not.toContain('noindex');
    }
  });

  it('les JSON-LD sont sérialisables et typés', () => {
    for (const page of PUBLIC_PAGES) {
      for (const block of jsonLdForPage(page)) {
        const parsed = JSON.parse(JSON.stringify(block)) as Record<string, unknown>;
        expect(parsed['@context']).toBe('https://schema.org');
        expect(typeof parsed['@type']).toBe('string');
      }
    }
    const home = jsonLdForPage(metaForPath('/')!);
    expect(home.map((b) => (b as { '@type': string })['@type'])).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'SoftwareApplication']),
    );
    const article = jsonLdForPage(metaForPath('/cas-clients/trust-industrie')!);
    expect(article.some((b) => (b as { '@type': string })['@type'] === 'Article')).toBe(true);
  });
});

describe('sitemap et robots', () => {
  const sitemap = renderSitemap();
  const robots = renderRobots();

  it('le sitemap contient toutes les pages publiques', () => {
    for (const page of PUBLIC_PAGES.filter((p) => p.sitemap !== false)) {
      expect(sitemap).toContain(`<loc>${canonicalUrl(page.path)}</loc>`);
    }
  });

  it('le sitemap ne contient aucune route privée', () => {
    for (const prefix of PRIVATE_PREFIXES) {
      expect(sitemap).not.toContain(`${prefix.replace(/\/$/, '')}<`);
      expect(sitemap.includes(`/loc>${prefix}`)).toBe(false);
    }
    expect(sitemap).not.toContain('/app');
    expect(sitemap).not.toContain('/kiosk');
    expect(sitemap).not.toContain('/super-admin');
    expect(sitemap).not.toContain('/connexion');
  });

  it('robots.txt bloque les espaces privés et référence le sitemap', () => {
    expect(robots).toContain('Disallow: /app');
    expect(robots).toContain('Disallow: /kiosk');
    expect(robots).toContain('Disallow: /super-admin');
    expect(robots).toContain('Disallow: /connexion');
    expect(robots).toContain('Sitemap: ');
  });
});
