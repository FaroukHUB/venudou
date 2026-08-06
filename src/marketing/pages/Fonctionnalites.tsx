import { BarChart3, Gift, ListChecks, Star, Tablet, Users, WifiOff, Shield } from 'lucide-react';
import { PageShell, PageHero } from '../PageShell';
import { CtaBanner, FeatureCard, KioskDemo, Section } from '../components';

export default function Fonctionnalites() {
  return (
    <PageShell path="/fonctionnalites">
      <PageHero
        title="Les fonctionnalités de VenuD'où"
        subtitle="Tout ce qu'il faut pour mesurer la provenance de vos clients en point de vente, analyser leur profil et transformer plus de visites en avis — sans collecter la moindre donnée nominative."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={Tablet} title="Kiosque tablette" href="/tablette-client">
            Plein écran, gros boutons, passage automatique à l'étape suivante et retour au début
            après chaque client. Activation par code court en 2 minutes.
          </FeatureCard>
          <FeatureCard icon={ListChecks} title="Questionnaire sur mesure">
            Activez, réordonnez et reformulez chaque question. Ajoutez vos propres provenances,
            choisissez les icônes, prévisualisez, puis publiez vers les tablettes.
          </FeatureCard>
          <FeatureCard icon={WifiOff} title="Hors ligne fiable">
            Les réponses sont conservées sur la tablette en cas de coupure et synchronisées sans
            doublon au retour du réseau.
          </FeatureCard>
          <FeatureCard icon={BarChart3} title="Statistiques complètes" href="/multi-etablissements">
            Répartition des provenances, évolution, croisements par genre et par âge, volume par
            jour et heure, taux de réponse aux questions facultatives.
          </FeatureCard>
          <FeatureCard icon={Users} title="Multi-établissements" href="/multi-etablissements">
            Statistiques séparées par magasin, vue globale centralisée, comparaison en un tableau et
            rôles d'équipe par établissement.
          </FeatureCard>
          <FeatureCard icon={Star} title="Avis Google" href="/avis-google">
            Proposition d'avis après le questionnaire, QR code par établissement et suivi des scans.
            Sans filtrage des clients, conformément aux règles Google.
          </FeatureCard>
          <FeatureCard icon={Gift} title="Instant gagnant" href="/instant-gagnant">
            Un gagnant toutes les N participations, tirage aléatoire sécurisé, codes uniques avec QR
            code et validation en caisse.
          </FeatureCard>
          <FeatureCard icon={Shield} title="Anonymat et sécurité">
            Aucune donnée nominative, pas d'adresse IP stockée, isolation stricte entre
            organisations et journalisation des actions sensibles.
          </FeatureCard>
        </div>
      </Section>
      <Section title="Le questionnaire vu par vos clients" muted>
        <KioskDemo />
      </Section>
      <CtaBanner />
    </PageShell>
  );
}
