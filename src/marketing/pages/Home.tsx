import { BarChart3, Gift, MapPin, MessagesSquare, Star, Tablet, Users } from 'lucide-react';
import { PageShell } from '../PageShell';
import { CheckList, CtaBanner, FaqList, FeatureCard, KioskDemo, Section } from '../components';
import { FAQ_ITEMS } from '../content/faq';
import { PricingGrid } from './Tarifs';

export default function Home() {
  return (
    <PageShell path="/">
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold text-navy-900 sm:text-5xl">
            Comprenez d'où viennent vos clients.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-navy-600">
            Découvrez les canaux qui attirent réellement vos clients, comparez vos établissements et
            transformez davantage de visites en avis. Une tablette à la caisse, trois questions, des
            statistiques fiables.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/inscription"
              className="rounded-xl bg-navy-800 px-6 py-3 font-semibold text-white hover:bg-navy-700"
            >
              Créer mon compte
            </a>
            <a
              href="/fonctionnalites"
              className="rounded-xl border border-navy-200 px-6 py-3 font-semibold text-navy-800 hover:bg-navy-50"
            >
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      <Section
        title="Le parcours tablette, en 15 secondes"
        intro="À l'encaissement, vos clients répondent à trois questions rapides sur une tablette en libre-service. Passage automatique d'une étape à l'autre, gros boutons tactiles, fonctionnement même hors ligne."
        muted
      >
        <KioskDemo />
      </Section>

      <Section
        title="Pourquoi mesurer la provenance de vos clients ?"
        intro="Sans mesure, impossible de savoir si votre budget Instagram, votre fiche Google ou le bouche-à-oreille remplit réellement votre salle ou votre boutique. VenuD'où remplace les impressions par des chiffres, collectés directement auprès de vos clients."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={MessagesSquare} title="Provenance mesurée" href="/provenance-client">
            Facebook, Instagram, Snapchat, TikTok, Google, bouche-à-oreille ou vos propres canaux :
            chaque réponse est rattachée au bon établissement.
          </FeatureCard>
          <FeatureCard icon={Users} title="Profil client anonyme" href="/tablette-client">
            Genre et tranche d'âge, sans aucune donnée nominative. Vous connaissez votre clientèle
            sans collecter d'informations personnelles.
          </FeatureCard>
          <FeatureCard
            icon={BarChart3}
            title="Statistiques par établissement"
            href="/multi-etablissements"
          >
            Filtres par période, établissement, tablette, provenance, genre et âge. Comparaison
            claire entre vos magasins.
          </FeatureCard>
          <FeatureCard icon={Star} title="Plus d'avis Google" href="/avis-google">
            Après le questionnaire, un QR code propose de laisser un avis. Chaque scan est compté,
            établissement par établissement.
          </FeatureCard>
          <FeatureCard icon={Gift} title="Instant gagnant" href="/instant-gagnant">
            Récompensez la participation : un gagnant toutes les N réponses, tiré au sort de façon
            sécurisée, avec des codes à usage unique.
          </FeatureCard>
          <FeatureCard icon={Tablet} title="Installation en 2 minutes" href="/tablette-client">
            Un code d'activation court associe la tablette au bon établissement. Plein écran, hors
            ligne, synchronisation automatique.
          </FeatureCard>
        </div>
      </Section>

      <Section title="Comment ça fonctionne" muted>
        <ol className="grid gap-5 md:grid-cols-4">
          {[
            [
              '1. Créez votre compte',
              'Ajoutez votre organisation et vos établissements en quelques minutes.',
            ],
            [
              '2. Activez la tablette',
              'Un code court associe chaque tablette au bon établissement.',
            ],
            [
              '3. Collectez les réponses',
              'Vos clients répondent en caisse ; tout est anonyme et automatique.',
            ],
            [
              '4. Décidez avec des chiffres',
              'Analysez les provenances, comparez vos magasins, ajustez vos actions.',
            ],
          ].map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-navy-100 bg-white p-5">
              <p className="font-bold text-navy-900">{title}</p>
              <p className="mt-2 text-sm text-navy-600">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Pensé pour les réseaux multi-établissements"
        intro="Chaque magasin a ses statistiques ; le siège a la vue d'ensemble. Notre client pilote Trust Industrie compare ainsi ses 3 magasins depuis un seul tableau de bord."
      >
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Statistiques séparées par établissement',
              'Vue globale centralisée et comparaison en un tableau',
              "Rôles d'équipe : propriétaire, administrateur, responsable d'établissement",
              "Limites d'établissements selon votre offre, ajustables",
            ]}
          />
          <p className="rounded-2xl border border-navy-100 bg-surface-muted p-5 text-sm text-navy-600">
            <MapPin className="mb-2 size-6 text-turquoise-600" aria-hidden />
            <a
              href="/cas-clients/trust-industrie"
              className="font-semibold text-turquoise-700 hover:underline"
            >
              Découvrir le déploiement pilote Trust Industrie →
            </a>
            <br />
            Trois magasins équipés, des questionnaires adaptés à chaque point de vente et une
            comparaison hebdomadaire des provenances.
          </p>
        </div>
      </Section>

      <Section title="Des offres selon votre nombre d'établissements" muted>
        <PricingGrid compact />
        <p className="mt-6 text-center">
          <a href="/tarifs" className="font-semibold text-turquoise-600 hover:underline">
            Voir le détail des tarifs →
          </a>
        </p>
      </Section>

      <Section title="Questions fréquentes">
        <FaqList items={FAQ_ITEMS.slice(0, 5)} />
        <p className="mt-4">
          <a href="/faq" className="font-semibold text-turquoise-600 hover:underline">
            Toutes les questions fréquentes →
          </a>
        </p>
      </Section>

      <CtaBanner />
    </PageShell>
  );
}
