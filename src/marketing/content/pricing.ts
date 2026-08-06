/**
 * Tarifs provisoires affichés sur le site public (générés au build).
 * La source de vérité à l'exécution est la table `plans` (éditable depuis le
 * super-admin) — ces valeurs doivent rester alignées avec le seed des plans.
 */
export interface PublicPlan {
  code: string;
  name: string;
  priceMonthly: number | null; // euros ; null = sur devis
  maxLocations: number | null; // null = sur mesure
  highlights: string[];
  featured?: boolean;
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    code: 'essentiel',
    name: 'Essentiel',
    priceMonthly: 29,
    maxLocations: 1,
    highlights: ['1 établissement', '1 tablette incluse', 'Statistiques complètes', 'Avis Google'],
  },
  {
    code: 'pro',
    name: 'Pro',
    priceMonthly: 69,
    maxLocations: 3,
    highlights: [
      "Jusqu'à 3 établissements",
      'Comparaison multi-sites',
      'Instant gagnant',
      'Équipe illimitée',
    ],
    featured: true,
  },
  {
    code: 'reseau',
    name: 'Réseau',
    priceMonthly: 109,
    maxLocations: 5,
    highlights: ["Jusqu'à 5 établissements", 'Tout Pro inclus', 'Support prioritaire'],
  },
  {
    code: 'reseau_plus',
    name: 'Réseau Plus',
    priceMonthly: 199,
    maxLocations: 10,
    highlights: ["Jusqu'à 10 établissements", 'Tout Réseau inclus', 'Accompagnement dédié'],
  },
  {
    code: 'entreprise',
    name: 'Entreprise',
    priceMonthly: null,
    maxLocations: null,
    highlights: ['Sur mesure', 'Limites personnalisées', 'Déploiement accompagné'],
  },
];
