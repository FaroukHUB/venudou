import { describe, expect, it } from 'vitest';
import { LocalAssistantProvider, searchArticles } from '@/help/provider';
import { HELP_ARTICLES } from '@/help/content';

describe('centre d’aide local', () => {
  const assistant = new LocalAssistantProvider();

  it('répond aux questions clés avec l’article pertinent', async () => {
    const cases: [string, string][] = [
      ['Comment installer la tablette ?', 'installer-tablette'],
      ['Comment ajouter un établissement ?', 'ajouter-etablissement'],
      ['Où trouver mon lien d’avis Google ?', 'lien-avis-google'],
      ['Comment créer une récompense instant gagnant ?', 'creer-recompense'],
      ['Comment comparer mes magasins ?', 'comparer-etablissements'],
      ['modifier les tranches d’âge', 'modifier-tranches-age'],
    ];
    for (const [question, slug] of cases) {
      const answer = await assistant.ask(question);
      expect(
        answer.articles.map((a) => a.slug),
        `question « ${question} »`,
      ).toContain(slug);
    }
  });

  it('répond proprement quand rien ne correspond', async () => {
    const answer = await assistant.ask('xyzzy plugh');
    expect(answer.articles).toHaveLength(0);
    expect(answer.text.length).toBeGreaterThan(10);
  });

  it('la recherche renvoie tout par défaut et filtre sinon', () => {
    expect(searchArticles('')).toHaveLength(HELP_ARTICLES.length);
    const results = searchArticles('tablette activation');
    expect(results[0].slug).toBe('installer-tablette');
  });
});
