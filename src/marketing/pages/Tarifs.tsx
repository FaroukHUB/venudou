import { PageShell, PageHero } from '../PageShell';
import { CheckList, CtaBanner, Section } from '../components';
import { PUBLIC_PLANS } from '../content/pricing';

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {PUBLIC_PLANS.map((plan) => (
        <div
          key={plan.code}
          className={`flex flex-col rounded-2xl border bg-white p-5 ${
            plan.featured ? 'border-turquoise-400 shadow-md' : 'border-navy-100'
          }`}
        >
          {plan.featured && (
            <p className="mb-2 inline-block self-start rounded-full bg-turquoise-50 px-2.5 py-0.5 text-xs font-bold text-turquoise-700">
              Le plus choisi
            </p>
          )}
          <h3 className="text-lg font-bold text-navy-900">{plan.name}</h3>
          <p className="mt-1 text-2xl font-bold text-navy-800">
            {plan.priceMonthly === null ? (
              'Sur devis'
            ) : (
              <>
                {plan.priceMonthly} €
                <span className="text-sm font-normal text-navy-400"> / mois</span>
              </>
            )}
          </p>
          <p className="text-xs text-navy-400">
            {plan.maxLocations === null
              ? "Nombre d'établissements sur mesure"
              : `${plan.maxLocations} établissement${plan.maxLocations > 1 ? 's' : ''} max.`}
          </p>
          {!compact && (
            <ul className="mt-3 space-y-1.5 text-sm text-navy-600">
              {plan.highlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
          )}
          <a
            href="/inscription"
            className={`mt-4 rounded-xl px-4 py-2 text-center text-sm font-semibold ${
              plan.featured
                ? 'bg-turquoise-500 text-white hover:bg-turquoise-600'
                : 'bg-navy-800 text-white hover:bg-navy-700'
            }`}
          >
            {plan.priceMonthly === null ? 'Nous contacter' : 'Commencer'}
          </a>
        </div>
      ))}
    </div>
  );
}

export default function Tarifs() {
  return (
    <PageShell path="/tarifs">
      <PageHero
        title="Des tarifs simples, selon votre nombre d'établissements"
        subtitle="Tarifs provisoires de lancement, sans engagement. Toutes les offres incluent le questionnaire sur tablette, les statistiques complètes et la collecte d'avis Google."
      />
      <Section>
        <PricingGrid />
      </Section>
      <Section title="Toutes les offres incluent" muted>
        <div className="grid gap-8 md:grid-cols-2">
          <CheckList
            items={[
              'Questionnaire entièrement personnalisable par établissement',
              'Tablette en mode plein écran, fonctionnement hors ligne',
              'Statistiques : provenance, genre, tranche d’âge, évolution',
              'Collecte et suivi des demandes d’avis Google',
            ]}
          />
          <CheckList
            items={[
              'Instant gagnant configurable (à partir de l’offre Pro)',
              'Gestion d’équipe et rôles par établissement',
              'Données anonymes — aucune information nominative collectée',
              'Support par e-mail inclus',
            ]}
          />
        </div>
        <p className="mt-6 text-sm text-navy-500">
          Besoin de plus de 10 établissements, d'un déploiement accompagné ou de limites
          particulières ? L'offre Entreprise est construite sur mesure —{' '}
          <a href="/inscription" className="font-semibold text-turquoise-600 hover:underline">
            contactez-nous via la création de compte
          </a>
          .
        </p>
      </Section>
      <CtaBanner />
    </PageShell>
  );
}
