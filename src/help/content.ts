// Base locale d'aide — aucune API d'IA payante dans le MVP.

export interface HelpArticle {
  slug: string;
  theme: string;
  title: string;
  body: string[]; // paragraphes
  link?: { to: string; label: string }; // raccourci vers le réglage concerné
  keywords: string[];
}

export const HELP_THEMES = [
  'Démarrage',
  'Tablettes',
  'Questionnaire',
  'Avis Google',
  'Récompenses',
  'Statistiques',
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'ajouter-etablissement',
    theme: 'Démarrage',
    title: 'Comment ajouter un établissement ?',
    body: [
      "Ouvrez « Établissements » puis cliquez sur « Ajouter un établissement ». Renseignez le nom et l'adresse : un questionnaire par défaut est créé automatiquement pour ce lieu.",
      "Le nombre d'établissements dépend de votre offre. Si la limite est atteinte, le bouton est désactivé et un message vous invite à passer à l'offre supérieure.",
    ],
    link: { to: '/app/etablissements', label: 'Ouvrir Établissements' },
    keywords: ['établissement', 'magasin', 'restaurant', 'ajouter', 'créer', 'limite'],
  },
  {
    slug: 'installer-tablette',
    theme: 'Tablettes',
    title: 'Comment installer la tablette ?',
    body: [
      "1. Dans « Tablettes », créez une tablette et choisissez son établissement. 2. Cliquez sur « Code d'activation » : un code court s'affiche (valable 15 minutes, à usage unique).",
      "3. Sur la tablette, ouvrez l'adresse /kiosk de votre site VenuD'où et saisissez le code. La tablette est alors associée au bon établissement et ouvre directement le questionnaire en plein écran.",
      "Astuce : ajoutez la page à l'écran d'accueil de la tablette (application installable) pour un vrai mode plein écran, et fonctionnant même en cas de coupure d'Internet.",
    ],
    link: { to: '/app/tablettes', label: 'Ouvrir Tablettes' },
    keywords: ['tablette', 'kiosque', 'installer', 'activation', 'code', 'activer'],
  },
  {
    slug: 'lien-avis-google',
    theme: 'Avis Google',
    title: "Comment récupérer mon lien d'avis Google ?",
    body: [
      'Connectez-vous à votre fiche Google Business Profile, ouvrez « Demander des avis » et copiez le lien court proposé (il ressemble à https://g.page/r/…/review).',
      "Collez ensuite ce lien dans « Avis » pour l'établissement concerné. La tablette proposera alors le QR code après le questionnaire, et chaque scan sera compté.",
    ],
    link: { to: '/app/avis', label: 'Ouvrir Avis' },
    keywords: ['avis', 'google', 'lien', 'review', 'qr'],
  },
  {
    slug: 'configurer-provenances',
    theme: 'Questionnaire',
    title: 'Comment configurer les provenances ?',
    body: [
      "Dans « Questionnaire », sélectionnez l'établissement puis la question « Comment avez-vous connu notre établissement ? ». Vous pouvez désactiver des provenances, changer leur ordre avec les flèches, modifier les libellés et choisir une icône.",
      'Vous pouvez aussi ajouter vos propres provenances (ex. : « Radio locale »). Pensez à cliquer sur « Publier sur les tablettes » pour pousser les changements.',
    ],
    link: { to: '/app/questionnaire', label: 'Ouvrir Questionnaire' },
    keywords: [
      'provenance',
      'source',
      'options',
      'facebook',
      'instagram',
      'configurer',
      'question',
    ],
  },
  {
    slug: 'modifier-tranches-age',
    theme: 'Questionnaire',
    title: "Comment modifier les tranches d'âge ?",
    body: [
      'Dans « Questionnaire », ouvrez la question « Quel âge avez-vous ? ». Les tranches sont entièrement configurables : modifiez les libellés, ajoutez ou supprimez des tranches, réordonnez-les, ou désactivez la question complètement.',
      'Publiez ensuite les changements pour les envoyer aux tablettes.',
    ],
    link: { to: '/app/questionnaire', label: 'Ouvrir Questionnaire' },
    keywords: ['âge', 'tranche', 'tranches', 'modifier', 'bornes'],
  },
  {
    slug: 'creer-recompense',
    theme: 'Récompenses',
    title: 'Comment créer une récompense (instant gagnant) ?',
    body: [
      'Dans « Récompenses », créez une campagne : choisissez le type (réduction, produit offert…), le libellé affiché au client, la fréquence (1 gagnant toutes les N participations), la validité et les éventuels plafonds.',
      "Le tirage est aléatoire et sécurisé : la position gagnante n'est jamais visible à l'avance. Le gagnant reçoit un code et un QR code uniques, utilisables une seule fois.",
      "Important : la récompense est liée à la participation au questionnaire, jamais à la publication d'un avis Google.",
    ],
    link: { to: '/app/recompenses', label: 'Ouvrir Récompenses' },
    keywords: ['récompense', 'instant gagnant', 'gain', 'campagne', 'créer', 'tirage'],
  },
  {
    slug: 'valider-gain',
    theme: 'Récompenses',
    title: 'Comment scanner et valider un gain ?',
    body: [
      'Quand un client présente son code (ou son QR code), ouvrez « Récompenses » et saisissez le code dans « Vérifier et valider un code », puis cliquez sur Valider.',
      "Si le code est valide, la récompense s'affiche et le code est immédiatement marqué comme utilisé : il ne pourra pas servir deux fois. Les codes expirés ou déjà utilisés sont refusés avec un message clair.",
    ],
    link: { to: '/app/recompenses', label: 'Ouvrir Récompenses' },
    keywords: ['valider', 'scanner', 'code', 'gain', 'récompense', 'utiliser'],
  },
  {
    slug: 'comparer-etablissements',
    theme: 'Statistiques',
    title: 'Comment comparer plusieurs établissements ?',
    body: [
      "Dans « Statistiques », laissez le filtre établissement sur « Tous » : un tableau comparatif affiche pour chaque magasin le volume de réponses, la provenance nº1, les scans d'avis et les gains.",
      "Le graphique d'évolution superpose les courbes de vos établissements pour repérer les écarts. Utilisez les filtres de période, provenance, genre et âge pour affiner la comparaison.",
    ],
    link: { to: '/app/statistiques', label: 'Ouvrir Statistiques' },
    keywords: ['comparer', 'comparaison', 'multi', 'magasins', 'établissements', 'statistiques'],
  },
];

/** Suggestions contextuelles selon la page du dashboard. */
export const CONTEXTUAL_HELP: Record<string, string[]> = {
  '/app/etablissements': ['ajouter-etablissement'],
  '/app/tablettes': ['installer-tablette'],
  '/app/questionnaire': ['configurer-provenances', 'modifier-tranches-age'],
  '/app/avis': ['lien-avis-google'],
  '/app/recompenses': ['creer-recompense', 'valider-gain'],
  '/app/statistiques': ['comparer-etablissements'],
};
