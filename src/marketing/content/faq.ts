export interface FaqItem {
  question: string;
  answer: string;
}

// FAQ écrite pour aider réellement — pas pour un résultat enrichi.
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment installe-t-on la tablette VenuD'où ?",
    answer:
      "Vous créez la tablette dans votre tableau de bord, vous obtenez un code d'activation court, puis vous le saisissez sur la tablette (page /kiosk). En moins de deux minutes, le questionnaire s'affiche en plein écran, associé au bon établissement. N'importe quelle tablette Android ou iPad récente avec un navigateur convient.",
  },
  {
    question: 'Quelles questions sont posées aux clients ?',
    answer:
      "Par défaut : comment ils ont connu l'établissement (Facebook, Instagram, Snapchat, TikTok, Google, bouche-à-oreille, autre), leur genre et leur tranche d'âge. Chaque question est paramétrable : vous pouvez modifier les libellés, l'ordre, les options, rendre une question facultative ou la désactiver.",
  },
  {
    question: 'Les données des clients sont-elles anonymes ?',
    answer:
      "Oui. Aucune donnée nominative n'est demandée : ni nom, ni e-mail, ni téléphone. Les adresses IP des visiteurs ne sont pas stockées. Les réponses sont des statistiques anonymes rattachées à un établissement, pas à une personne.",
  },
  {
    question: 'Que se passe-t-il si la connexion Internet coupe ?',
    answer:
      'Le questionnaire continue de fonctionner : les réponses sont conservées localement sur la tablette et synchronisées automatiquement dès le retour du réseau, sans doublon.',
  },
  {
    question: "Comment fonctionne la collecte d'avis Google ?",
    answer:
      "Après le questionnaire, la tablette demande au client s'il souhaite laisser un avis. S'il accepte, un QR code s'affiche et pointe vers la page d'avis Google de l'établissement. Nous comptons les propositions, les acceptations et les scans — nous ne prétendons pas mesurer la publication réelle de l'avis, et nous ne filtrons jamais les clients selon leur satisfaction.",
  },
  {
    question: "L'instant gagnant est-il obligatoire ?",
    answer:
      "Non, c'est une option par établissement. Vous définissez la récompense, la fréquence (1 gagnant toutes les N participations), la validité et les plafonds. Le tirage est aléatoire et sécurisé, et la récompense est liée à la participation au questionnaire — jamais à la publication d'un avis.",
  },
  {
    question: 'Puis-je comparer plusieurs établissements ?',
    answer:
      "Oui, c'est le cœur des offres Pro et supérieures : chaque établissement a ses statistiques séparées, et une vue centralisée compare les volumes, les provenances et les profils entre vos magasins.",
  },
  {
    question: "Combien coûte VenuD'où ?",
    answer:
      "Les offres démarrent à 29 € par mois pour un établissement (tarifs provisoires de lancement). Le prix dépend du nombre d'établissements : voir la page Tarifs pour le détail.",
  },
];
