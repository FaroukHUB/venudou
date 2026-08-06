import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { MessageCircle, Search } from 'lucide-react';
import { HELP_ARTICLES, HELP_THEMES, type HelpArticle } from '@/help/content';
import { assistant, searchArticles, type AssistantAnswer } from '@/help/provider';
import { PageHeader } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Card>
      <h3 className="font-bold text-navy-900">{article.title}</h3>
      {article.body.map((p, i) => (
        <p key={i} className="mt-2 text-sm text-navy-600">
          {p}
        </p>
      ))}
      {article.link && (
        <Link
          to={article.link.to}
          className="mt-3 inline-block text-sm font-semibold text-turquoise-600 hover:underline"
        >
          {article.link.label} →
        </Link>
      )}
    </Card>
  );
}

export default function Aide() {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{ q: string; answer: AssistantAnswer }[]>([]);
  const [asking, setAsking] = useState(false);

  const results = (query ? searchArticles(query) : HELP_ARTICLES).filter(
    (a) => !theme || a.theme === theme,
  );

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    const answer = await assistant.ask(question);
    setChat((c) => [...c, { q: question, answer }]);
    setQuestion('');
    setAsking(false);
  }

  return (
    <div>
      <PageHeader
        title="Centre d'aide"
        description="Documentation, recherche et assistant guidé."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <label className="relative flex-1">
              <Search
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-300"
                aria-hidden
              />
              <input
                className="w-full rounded-xl border border-navy-200 bg-white py-2.5 pr-3 pl-9 text-sm"
                placeholder="Rechercher dans l'aide…"
                aria-label="Rechercher dans l'aide"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm"
              aria-label="Thème"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="">Tous les thèmes</option>
              {HELP_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {results.length === 0 && (
            <p className="text-sm text-navy-500">Aucun article ne correspond à votre recherche.</p>
          )}
          {results.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>

        <Card className="h-fit">
          <CardTitle>
            <span className="flex items-center gap-2">
              <MessageCircle className="size-5 text-turquoise-600" aria-hidden /> Assistant
            </span>
          </CardTitle>
          <div className="mb-3 max-h-96 space-y-3 overflow-y-auto">
            {chat.length === 0 && (
              <p className="text-sm text-navy-400">
                Posez une question, par exemple : « comment installer la tablette ? »
              </p>
            )}
            {chat.map((entry, i) => (
              <div key={i} className="space-y-2">
                <p className="rounded-xl bg-navy-800 px-3 py-2 text-sm text-white">{entry.q}</p>
                <div className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-navy-700">
                  <p>{entry.answer.text}</p>
                  {entry.answer.articles.map((a) => (
                    <p key={a.slug} className="mt-1.5">
                      {a.link ? (
                        <Link
                          to={a.link.to}
                          className="font-semibold text-turquoise-600 hover:underline"
                        >
                          {a.title}
                        </Link>
                      ) : (
                        <span className="font-semibold">{a.title}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={ask} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-navy-200 px-3 py-2 text-sm"
              placeholder="Votre question…"
              aria-label="Question à l'assistant"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button type="submit" size="sm" loading={asking}>
              Envoyer
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
