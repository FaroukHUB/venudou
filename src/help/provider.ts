import { HELP_ARTICLES, type HelpArticle } from './content';

/**
 * Interface abstraite de l'assistant. Le MVP embarque un fournisseur local à
 * base de règles (aucune API d'IA payante). Pour brancher plus tard un
 * fournisseur d'IA, implémenter cette interface et remplacer l'instance
 * exportée — l'UI n'a pas à changer.
 */
export interface AssistantProvider {
  ask(question: string, context?: { page?: string }): Promise<AssistantAnswer>;
}

export interface AssistantAnswer {
  text: string;
  articles: HelpArticle[];
}

function score(article: HelpArticle, terms: string[]): number {
  let s = 0;
  const haystack = `${article.title} ${article.keywords.join(' ')} ${article.body.join(' ')}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const t of terms) {
    if (t.length < 3) continue;
    if (haystack.includes(t)) s += article.keywords.some((k) => normalize(k).includes(t)) ? 3 : 1;
  }
  return s;
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export class LocalAssistantProvider implements AssistantProvider {
  async ask(question: string): Promise<AssistantAnswer> {
    const terms = normalize(question)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const ranked = HELP_ARTICLES.map((a) => ({ a, s: score(a, terms) }))
      .filter((r) => r.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 3)
      .map((r) => r.a);
    if (ranked.length === 0) {
      return {
        text: "Je n'ai pas trouvé de réponse précise. Reformulez votre question (ex. : « installer la tablette », « lien d'avis Google ») ou parcourez les thèmes ci-dessous.",
        articles: [],
      };
    }
    return {
      text: ranked[0].body[0],
      articles: ranked,
    };
  }
}

export function searchArticles(query: string): HelpArticle[] {
  const terms = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (terms.length === 0) return HELP_ARTICLES;
  return HELP_ARTICLES.map((a) => ({ a, s: score(a, terms) }))
    .filter((r) => r.s > 0)
    .sort((x, y) => y.s - x.s)
    .map((r) => r.a);
}

export const assistant: AssistantProvider = new LocalAssistantProvider();
