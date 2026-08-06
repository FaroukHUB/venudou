import { PageShell, PageHero } from '../PageShell';
import { CheckList, CtaBanner, FaqList, KioskDemo, Section } from '../components';
import { DashboardMockup, HeroTablet, PhoneQrMockup, RewardMockup } from '../illustrations';

/** Pages produit : provenance client, avis Google, instant gagnant, tablette. */

export function ProvenanceClient() {
  return (
    <PageShell path="/provenance-client">
      <PageHero
        title="Le logiciel qui mesure la provenance de vos clients"
        subtitle="« Comment avez-vous connu notre établissement ? » — posée sur tablette au passage en caisse, cette question devient une source de données fiable pour piloter votre marketing local."
      />
      <Section
        title="Qu'est-ce que la provenance client ?"
        intro="La provenance client (ou attribution des visites physiques) désigne le canal par lequel un client a découvert votre établissement : réseaux sociaux, recherche Google, recommandation d'un proche, passage devant la vitrine… En ligne, tout se mesure ; en point de vente, il faut poser la question. VenuD'où le fait pour vous, systématiquement et sans friction."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Canaux par défaut : Facebook, Instagram, Snapchat, TikTok, Google, bouche-à-oreille, autre',
              'Ajoutez vos propres canaux : radio locale, marché, flyer, partenariat…',
              'Champ « précisez » facultatif pour la réponse « Autre »',
              'Résultats par établissement, par période, croisés par genre et par âge',
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Mesurer le bouche-à-oreille</h3>
            <p className="mt-2">
              Le bouche-à-oreille est le canal le plus difficile à suivre : il ne laisse aucune
              trace numérique. En le proposant comme réponse au même niveau que les réseaux sociaux,
              VenuD'où vous permet enfin de quantifier sa part réelle dans vos visites — et de
              savoir si elle progresse.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-xl">
          <DashboardMockup />
        </div>
      </Section>
      <CtaBanner title="Remplacez les impressions par des chiffres" />
    </PageShell>
  );
}

export function AvisGoogle() {
  return (
    <PageShell path="/avis-google">
      <PageHero
        title="Obtenez plus d'avis Google, directement en magasin"
        subtitle="Le meilleur moment pour demander un avis, c'est juste après l'expérience. La tablette VenuD'où le propose à chaque client, avec un QR code vers la page d'avis du bon établissement."
      />
      <Section
        title="Comment ça marche"
        intro="Après le questionnaire (et l'éventuel instant gagnant), la tablette affiche : « Souhaitez-vous laisser un avis sur votre expérience ? ». Si le client accepte, un QR code s'affiche ; il le scanne avec son téléphone et arrive sur votre page d'avis Google."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              "Un lien d'avis par établissement — chaque magasin collecte sur sa propre fiche",
              'Suivi mesuré : propositions affichées, acceptations, QR affichés, liens ouverts',
              'Aucun filtrage des clients selon leur satisfaction : tout le monde reçoit la même proposition',
              "La récompense éventuelle est liée au questionnaire, jamais à l'avis",
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Conforme et honnête</h3>
            <p className="mt-2">
              Google interdit de conditionner un avis à une récompense et de filtrer les clients
              insatisfaits (« review gating »). VenuD'où est construit pour respecter ces règles :
              la proposition d'avis est identique pour tous, et nous mesurons les scans — pas la
              publication, que personne ne peut garantir.
            </p>
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <PhoneQrMockup />
        </div>
      </Section>
      <CtaBanner title="Transformez plus de visites en avis" />
    </PageShell>
  );
}

export function InstantGagnant() {
  return (
    <PageShell path="/instant-gagnant">
      <PageHero
        title="L'instant gagnant qui récompense la participation"
        subtitle="Un gagnant toutes les N participations, tiré au sort de façon aléatoire et sécurisée. Le client gagnant reçoit un code unique à présenter en caisse — simple, festif et maîtrisé."
      />
      <Section
        title="Entièrement configurable, totalement facultatif"
        intro="L'instant gagnant se configure par établissement et peut être activé ou coupé à tout moment. Vous gardez le contrôle du budget grâce aux plafonds et aux limites."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Types de gains : réduction en %, réduction fixe, produit, boisson, dessert ou texte libre',
              'Fréquence : 1 gagnant toutes les N participations (vous choisissez N)',
              'Plafond de réduction, minimum de commande, durée de validité',
              'Nombre maximal de gains et établissements où le gain est accepté',
              'Codes uniques avec QR, utilisables une seule fois, vérifiables en caisse',
            ]}
          />
          <div className="rounded-2xl border border-navy-100 bg-surface-muted p-6 text-sm text-navy-700">
            <h3 className="font-bold text-navy-900">Un tirage vraiment aléatoire</h3>
            <p className="mt-2">
              Pour chaque bloc de N participations, une position gagnante est tirée avec un aléa
              cryptographique, côté serveur, et n'est jamais visible à l'avance — ni par les
              clients, ni par l'équipe. La validation en caisse marque le code comme utilisé
              définitivement.
            </p>
            <p className="mt-2">
              La récompense est liée à la participation au questionnaire — jamais à la publication
              d'un avis Google.
            </p>
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <RewardMockup />
        </div>
      </Section>
      <CtaBanner title="Ajoutez un instant gagnant à votre questionnaire" />
    </PageShell>
  );
}

export function TabletteClient() {
  return (
    <PageShell path="/tablette-client">
      <PageHero
        title="Le questionnaire client sur tablette, pensé pour la caisse"
        subtitle="Trois questions, moins de 15 secondes, des gros boutons tactiles et un retour automatique au début : l'enquête en point de vente qui ne ralentit personne."
      />
      <Section title="Le parcours client">
        <div className="mb-12 flex justify-center">
          <HeroTablet />
        </div>
        <KioskDemo />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <CheckList
            items={[
              'Plein écran, sans aucun menu accessible aux clients',
              "Passage automatique à l'étape suivante, sans bouton de validation",
              'Questions facultatives passables en un geste',
              'Progression affichée : 1/3, 2/3, 3/3',
              'Blocage des doubles appuis et animations courtes',
            ]}
          />
          <CheckList
            items={[
              'Fonctionne hors ligne : les réponses sont conservées sur la tablette',
              'Synchronisation automatique au retour du réseau, sans doublon',
              'Installation par code court : la tablette est associée au bon établissement',
              'Application installable (PWA) pour un vrai mode kiosque',
              'Compatible tablettes Android et iPad récents',
            ]}
          />
        </div>
      </Section>
      <Section title="Questions fréquentes sur la tablette" muted>
        <FaqList
          items={[
            {
              question: 'Faut-il une tablette spéciale ?',
              answer:
                "Non. Toute tablette Android ou iPad récente avec un navigateur moderne convient. Un support de comptoir et un câble d'alimentation suffisent.",
            },
            {
              question: 'Comment la tablette est-elle reliée à mon établissement ?',
              answer:
                "Depuis votre tableau de bord, vous créez la tablette et générez un code d'activation court (valable 15 minutes, à usage unique). Vous le saisissez sur la tablette : elle est associée au bon établissement et ouvre le questionnaire.",
            },
            {
              question: 'Les clients peuvent-ils sortir du questionnaire ?',
              answer:
                "Le kiosque n'affiche aucun menu d'administration et revient seul au début après chaque réponse. Pour une fermeture complète, utilisez le mode kiosque de votre tablette (épinglage d'application).",
            },
          ]}
        />
      </Section>
      <CtaBanner title="Installez votre première tablette en 2 minutes" />
    </PageShell>
  );
}
