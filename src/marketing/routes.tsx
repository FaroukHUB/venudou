import type { ComponentType } from 'react';
import Home from './pages/Home';
import Fonctionnalites from './pages/Fonctionnalites';
import Tarifs from './pages/Tarifs';
import { Restaurants, Magasins, MultiEtablissements } from './pages/Secteurs';
import { ProvenanceClient, AvisGoogle, InstantGagnant, TabletteClient } from './pages/Produit';
import { Faq, Guides, Blog, CasClients, CasClientTrustIndustrie } from './pages/Ressources';

/** Registre des pages publiques : partagé entre le pré-rendu et la SPA dev. */
export const MARKETING_ROUTES: { path: string; Component: ComponentType }[] = [
  { path: '/', Component: Home },
  { path: '/fonctionnalites', Component: Fonctionnalites },
  { path: '/tarifs', Component: Tarifs },
  { path: '/restaurants', Component: Restaurants },
  { path: '/magasins', Component: Magasins },
  { path: '/multi-etablissements', Component: MultiEtablissements },
  { path: '/provenance-client', Component: ProvenanceClient },
  { path: '/avis-google', Component: AvisGoogle },
  { path: '/instant-gagnant', Component: InstantGagnant },
  { path: '/tablette-client', Component: TabletteClient },
  { path: '/faq', Component: Faq },
  { path: '/guides', Component: Guides },
  { path: '/blog', Component: Blog },
  { path: '/cas-clients', Component: CasClients },
  { path: '/cas-clients/trust-industrie', Component: CasClientTrustIndustrie },
];
