import { PageShell, PageHero } from '../PageShell';
import { CheckList, CtaBanner, FaqList, Section } from '../components';
import { DashboardMockup, Photo, StoresMockup } from '../illustrations';

/** Pages sectorielles : restaurants, magasins, multi-établissements. */

export function Restaurants() {
  return (
    <PageShell path="/restaurants">
      <PageHero
        title="Statistiques clients pour votre restaurant"
        subtitle="Sachez si vos couverts viennent d'Instagram, de Google Maps ou du bouche-à-oreille — mesuré à la caisse, service après service, sans déranger vos équipes."
      />
      <Section
        title="Ce que VenuD'où change pour un restaurant"
        intro="La provenance des clients d'un restaurant se devine souvent (« on nous trouve sur Google »), mais se mesure rarement. Avec une tablette au comptoir ou à l'encaissement, chaque client peut répondre en quelques secondes, et vous obtenez des chiffres exploitables dès la première semaine."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Identifiez le canal qui remplit réellement votre salle (réseaux sociaux, Google, bouche-à-oreille)',
              'Adaptez vos publications et votre budget aux canaux qui fonctionnent',
              'Connaissez le profil de votre clientèle par service et par saison',
              "Proposez un avis Google au bon moment : juste après l'expérience",
              'Offrez un dessert ou une boisson via l’instant gagnant pour encourager la participation',
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Exemple concret</h3>
            <p className="mt-2">
              Un restaurant constate que 40 % de ses nouveaux clients cochent « Instagram » le
              week-end, mais presque aucun en semaine. Il concentre ses publications le jeudi et le
              vendredi, et suit l'évolution directement dans ses statistiques VenuD'où.
            </p>
            <p className="mt-2 text-navy-500">
              (Exemple d'usage illustratif — vos chiffres viendront de vos propres clients.)
            </p>
          </div>
        </div>
      </Section>
      <Section muted>
        <Photo
          src="/images/restaurant-tablette.webp"
          alt="Tablette VenuD'où sur le comptoir d'un restaurant, une cliente répond au questionnaire"
          className="mx-auto max-w-3xl"
        />
      </Section>
      <Section title="Questions fréquentes des restaurateurs">
        <FaqList
          items={[
            {
              question: 'Où placer la tablette dans un restaurant ?',
              answer:
                "Au comptoir d'encaissement ou à la sortie, là où le client patiente quelques secondes. Le questionnaire dure moins de 15 secondes et s'enchaîne automatiquement d'un client à l'autre.",
            },
            {
              question: 'Mes serveurs doivent-ils intervenir ?',
              answer:
                'Non. Le kiosque est en libre-service, revient tout seul au début et ne comporte aucun menu accessible aux clients. Une phrase suffit : « Vous pouvez répondre à 3 questions sur la tablette si vous avez 15 secondes ».',
            },
            {
              question: 'Et si ma connexion coupe pendant le service ?',
              answer:
                'Le questionnaire continue de fonctionner hors ligne ; les réponses se synchronisent automatiquement au retour du réseau, sans doublon.',
            },
          ]}
        />
      </Section>
      <CtaBanner title="Mesurez la provenance de vos clients dès ce week-end" />
    </PageShell>
  );
}

export function Magasins() {
  return (
    <PageShell path="/magasins">
      <PageHero
        title="Analysez les visiteurs de votre magasin"
        subtitle="À la caisse de votre boutique, une tablette VenuD'où mesure comment vos clients vous ont découvert et dessine le profil de votre clientèle — anonymement."
      />
      <Section
        title="Pour les commerces et boutiques"
        intro="Entre la vitrine, Google Maps, les réseaux sociaux et la recommandation, difficile de savoir ce qui déclenche une visite en boutique. VenuD'où pose la question directement à vos clients, au moment du passage en caisse."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Mesurez la part du bouche-à-oreille, souvent sous-estimée',
              'Vérifiez si vos campagnes locales génèrent des visites réelles',
              'Comprenez les tranches d’âge qui fréquentent chaque boutique',
              'Collectez des avis Google à la caisse, sans solliciter par e-mail',
              'Comparez vos boutiques si vous en avez plusieurs',
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Adapté au rythme d'une caisse</h3>
            <p className="mt-2">
              Gros boutons tactiles, aucune saisie obligatoire, question facultative passable en un
              geste : le questionnaire n'allonge pas la file. Le commerçant garde la main sur les
              questions posées et peut les ajuster à tout moment depuis son tableau de bord.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl items-center gap-8 lg:grid-cols-2">
          <Photo
            src="/images/boutique-tablette.webp"
            alt="Tablette VenuD'où à la caisse d'une boutique, la commerçante remet son achat à une cliente"
          />
          <DashboardMockup />
        </div>
      </Section>
      <CtaBanner title="Sachez enfin comment vos clients ont connu votre boutique" />
    </PageShell>
  );
}

export function MultiEtablissements() {
  return (
    <PageShell path="/multi-etablissements">
      <PageHero
        title="Comparez vos établissements, pilotez votre réseau"
        subtitle="Franchises, réseaux et multi-boutiques : chaque établissement a ses statistiques, le siège a la vue d'ensemble. Les écarts de provenance entre magasins deviennent visibles et actionnables."
      />
      <Section
        title="Une vue par magasin, une vue d'ensemble"
        intro="Chaque tablette est rattachée à un établissement précis. Les réponses alimentent à la fois les statistiques locales (pour le responsable du magasin) et la comparaison centralisée (pour la direction)."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Statistiques séparées par établissement, filtrables par période',
              'Tableau comparatif : volume, provenance nº1, scans d’avis, gains',
              'Courbes superposées pour repérer les écarts entre magasins',
              'Questionnaires adaptés à chaque point de vente si besoin',
              "Rôles d'équipe : le responsable ne voit que son établissement",
              "Limites d'établissements selon l'offre, ajustables sur mesure",
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Le pilote Trust Industrie</h3>
            <p className="mt-2">
              Trust Industrie, client pilote de VenuD'où, équipe ses 3 magasins d'une tablette
              chacun : statistiques par magasin, comparaison centralisée et validation des gains en
              caisse.{' '}
              <a
                href="/cas-clients/trust-industrie"
                className="font-semibold text-turquoise-700 hover:underline"
              >
                Lire l'étude de cas →
              </a>
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-2xl">
          <StoresMockup />
        </div>
      </Section>
      <Section title="Combien d'établissements pouvez-vous connecter ?" muted>
        <p className="max-w-3xl text-navy-600">
          Les offres couvrent 1, 3, 5 ou 10 établissements, et l'offre Entreprise s'adapte aux
          réseaux plus grands avec des limites personnalisées.{' '}
          <a href="/tarifs" className="font-semibold text-turquoise-600 hover:underline">
            Voir les tarifs par nombre d'établissements →
          </a>
        </p>
      </Section>
      <CtaBanner title="Donnez à chaque magasin ses chiffres, et à votre réseau sa vue d'ensemble" />
    </PageShell>
  );
}
