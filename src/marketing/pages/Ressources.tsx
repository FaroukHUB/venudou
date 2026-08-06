import { PageShell, PageHero } from '../PageShell';
import { CtaBanner, FaqList, Section } from '../components';
import { FAQ_ITEMS } from '../content/faq';

/** FAQ, structure éditoriale (guides, blog) et cas clients. */

export function Faq() {
  return (
    <PageShell path="/faq">
      <PageHero
        title="Questions fréquentes"
        subtitle="Installation, données, avis Google, offres : les réponses directes aux questions que l'on nous pose le plus souvent."
      />
      <Section>
        <FaqList items={FAQ_ITEMS} />
        <p className="mt-6 text-sm text-navy-500">
          Une autre question ? Le centre d'aide intégré au tableau de bord contient des guides pas à
          pas, et l'équipe répond par e-mail à tous les comptes.
        </p>
      </Section>
      <CtaBanner />
    </PageShell>
  );
}

// Catégories éditoriales prévues (guides, blog, glossaire, comparatifs…).
export const EDITORIAL_CATEGORIES = [
  'Connaissance client',
  'Marketing local',
  'Restaurants',
  'Commerces et magasins',
  'Avis Google',
  'Expérience client',
  'Réseaux multi-établissements',
  'Fidélisation',
  'Questionnaires en point de vente',
] as const;

function EditorialIndex({
  path,
  title,
  subtitle,
  emptyMessage,
}: {
  path: string;
  title: string;
  subtitle: string;
  emptyMessage: string;
}) {
  return (
    <PageShell path={path}>
      <PageHero title={title} subtitle={subtitle} />
      <Section title="Les thèmes que nous couvrons" intro={emptyMessage}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EDITORIAL_CATEGORIES.map((c) => (
            <li
              key={c}
              className="rounded-2xl border border-navy-100 bg-white px-4 py-3 font-semibold text-navy-800"
            >
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-navy-500">
          En attendant, l'étude de cas de notre client pilote est disponible :{' '}
          <a
            href="/cas-clients/trust-industrie"
            className="font-semibold text-turquoise-600 hover:underline"
          >
            Trust Industrie, 3 magasins sur VenuD'où →
          </a>
        </p>
      </Section>
      <CtaBanner />
    </PageShell>
  );
}

export function Guides() {
  return (
    <EditorialIndex
      path="/guides"
      title="Guides pratiques"
      subtitle="Des guides concrets pour mesurer la provenance de vos clients, obtenir plus d'avis Google et exploiter vos statistiques en point de vente."
      emptyMessage="Les premiers guides sont en cours de rédaction — nous privilégions quelques contenus solides et vérifiables plutôt que des dizaines de pages creuses. Voici les catégories qui structureront cette bibliothèque :"
    />
  );
}

export function Blog() {
  return (
    <EditorialIndex
      path="/blog"
      title="Le blog VenuD'où"
      subtitle="Connaissance client, marketing local, expérience en point de vente : analyses et retours de terrain, signés et datés."
      emptyMessage="Les premiers articles arrivent bientôt. Chaque article sera signé, daté, sourcé lorsqu'il cite des chiffres externes, et rangé dans l'une de ces catégories :"
    />
  );
}

export function CasClients() {
  return (
    <PageShell path="/cas-clients">
      <PageHero
        title="Ils mesurent la provenance de leurs clients"
        subtitle="Des déploiements réels, décrits sans chiffres inventés : le contexte, l'installation, les usages."
      />
      <Section>
        <article className="max-w-2xl rounded-2xl border border-navy-100 bg-white p-6">
          <p className="text-xs font-bold tracking-wide text-turquoise-600 uppercase">
            Client pilote — Réseaux multi-établissements
          </p>
          <h2 className="mt-2 text-xl font-bold text-navy-900">
            <a href="/cas-clients/trust-industrie" className="hover:underline">
              Trust Industrie : 3 magasins comparés depuis un seul tableau de bord
            </a>
          </h2>
          <p className="mt-2 text-sm text-navy-600">
            Premier déploiement VenuD'où : une tablette par magasin, des questionnaires adaptés à
            chaque point de vente et une comparaison centralisée des provenances.
          </p>
          <a
            href="/cas-clients/trust-industrie"
            className="mt-3 inline-block text-sm font-semibold text-turquoise-600 hover:underline"
          >
            Lire l'étude de cas →
          </a>
        </article>
      </Section>
      <CtaBanner />
    </PageShell>
  );
}

export function CasClientTrustIndustrie() {
  return (
    <PageShell path="/cas-clients/trust-industrie">
      <article>
        <PageHero
          title="Trust Industrie : 3 magasins pilotes sur VenuD'où"
          subtitle="Comment notre client pilote déploie une tablette dans chacun de ses trois magasins pour comprendre, chiffres à l'appui, comment ses clients le découvrent."
        />
        <Section>
          <div className="mx-auto max-w-3xl space-y-8 text-navy-700">
            <p className="text-sm text-navy-400">
              Par l'équipe VenuD'où — publié le 6 août 2026, mis à jour le 6 août 2026.{' '}
              <strong>Trust Industrie est le client pilote de VenuD'où</strong> : cette page décrit
              le déploiement réel, sans résultats inventés ; les chiffres seront ajoutés lorsque le
              pilote aura produit des données consolidées.
            </p>
            <div>
              <h2 className="text-xl font-bold text-navy-900">Le contexte</h2>
              <p className="mt-2">
                Trust Industrie exploite trois magasins dans trois villes différentes. Chaque
                magasin a sa propre zone de chalandise, sa propre fiche Google et ses propres
                actions locales — mais l'enseigne ne disposait d'aucune mesure fiable de la façon
                dont ses clients la découvraient, ni d'un moyen de comparer ses magasins entre eux.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">Le déploiement</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Une organisation VenuD'où, trois établissements, une tablette par magasin.</li>
                <li>
                  Activation de chaque tablette par code court, directement en caisse, en moins de
                  deux minutes par magasin.
                </li>
                <li>
                  Questionnaire standard (provenance, genre, tranche d'âge), ajusté par magasin :
                  chaque responsable peut réordonner les provenances selon sa réalité locale.
                </li>
                <li>
                  Lien d'avis Google propre à chaque magasin, avec suivi des scans par
                  établissement.
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">Ce que le siège consulte</h2>
              <p className="mt-2">
                Le tableau de bord central affiche les trois magasins côte à côte : volume de
                réponses, provenance nº1, scans d'avis et gains distribués, avec des courbes
                superposées pour repérer les écarts. Chaque responsable de magasin, lui, n'accède
                qu'aux données de son établissement grâce aux rôles d'équipe.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">Fonctionnalités utilisées</h2>
              <p className="mt-2">
                <a
                  href="/tablette-client"
                  className="font-semibold text-turquoise-600 hover:underline"
                >
                  Questionnaire sur tablette
                </a>
                {' · '}
                <a
                  href="/multi-etablissements"
                  className="font-semibold text-turquoise-600 hover:underline"
                >
                  Comparaison multi-établissements
                </a>
                {' · '}
                <a href="/avis-google" className="font-semibold text-turquoise-600 hover:underline">
                  Suivi des avis Google
                </a>
                {' · '}
                <a
                  href="/instant-gagnant"
                  className="font-semibold text-turquoise-600 hover:underline"
                >
                  Instant gagnant
                </a>
              </p>
            </div>
          </div>
        </Section>
        <CtaBanner title="Vous aussi, comparez vos établissements" />
      </article>
    </PageShell>
  );
}
