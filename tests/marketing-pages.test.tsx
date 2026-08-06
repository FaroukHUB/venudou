import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MARKETING_ROUTES } from '@/marketing/routes';
import NotFound from '@/marketing/pages/NotFound';

describe('pages publiques pré-rendues', () => {
  for (const { path, Component } of MARKETING_ROUTES) {
    it(`${path} : un seul h1, contenu significatif, navigation présente`, () => {
      const html = renderToStaticMarkup(createElement(Component));
      const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
      expect(h1Count, `page ${path} doit avoir exactement un h1`).toBe(1);
      // Contenu principal réellement présent dans le HTML généré
      expect(html.length).toBeGreaterThan(3000);
      expect(html).toContain('<main');
      expect(html).toContain('<header');
      expect(html).toContain('<footer');
      // Maillage interne : au moins un lien vers une autre page
      expect(html).toContain('href="/');
    });
  }

  it('la page 404 existe et propose un retour à l’accueil', () => {
    const html = renderToStaticMarkup(createElement(NotFound));
    expect(html).toContain('404');
    expect(html).toContain('href="/"');
  });

  it('la page d’accueil porte la promesse principale', () => {
    const home = MARKETING_ROUTES.find((r) => r.path === '/')!;
    const html = renderToStaticMarkup(createElement(home.Component));
    // Le rendu statique échappe l'apostrophe (&#x27;)
    expect(html).toContain('où viennent vos clients');
  });
});
