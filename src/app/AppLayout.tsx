import { lazy, Suspense, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router';
import {
  BarChart3,
  CircleHelp,
  CreditCard,
  Gift,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  Star,
  Tablet,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { useOrg } from '@/lib/org-context';
import { Logo } from '@/components/ui/Logo';
import { Spinner, Badge } from '@/components/ui/misc';

const Overview = lazy(() => import('./pages/Overview'));
const Etablissements = lazy(() => import('./pages/Etablissements'));
const Tablettes = lazy(() => import('./pages/Tablettes'));
const QuestionnairePage = lazy(() => import('./pages/Questionnaire'));
const Recompenses = lazy(() => import('./pages/Recompenses'));
const Avis = lazy(() => import('./pages/Avis'));
const Statistiques = lazy(() => import('./pages/Statistiques'));
const Equipe = lazy(() => import('./pages/Equipe'));
const Abonnement = lazy(() => import('./pages/Abonnement'));
const Aide = lazy(() => import('./pages/Aide'));

const nav = [
  { to: '/app', label: 'Vue générale', icon: LayoutDashboard, end: true },
  { to: '/app/etablissements', label: 'Établissements', icon: MapPin },
  { to: '/app/tablettes', label: 'Tablettes', icon: Tablet },
  { to: '/app/questionnaire', label: 'Questionnaire', icon: ListChecks },
  { to: '/app/recompenses', label: 'Récompenses', icon: Gift },
  { to: '/app/avis', label: 'Avis', icon: Star },
  { to: '/app/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/app/equipe', label: 'Équipe', icon: Users },
  { to: '/app/abonnement', label: 'Abonnement', icon: CreditCard },
  { to: '/app/aide', label: 'Aide', icon: CircleHelp },
];

export default function AppLayout() {
  const { signOut, isSuperAdmin } = useAuth();
  const { memberships, current, switchOrganization, subscription } = useOrg();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebar = (
    <nav aria-label="Navigation du tableau de bord" className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2">
        <Logo />
      </div>
      {memberships.length > 1 && (
        <label className="mb-3 block px-2 text-xs font-semibold text-navy-400">
          Organisation
          <select
            className="mt-1 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-sm font-normal text-navy-800"
            value={current?.organization.id ?? ''}
            onChange={(e) => switchOrganization(e.target.value)}
          >
            {memberships.map((m) => (
              <option key={m.organization.id} value={m.organization.id}>
                {m.organization.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {memberships.length === 1 && (
        <p className="mb-3 px-2 text-sm font-bold text-navy-800">{current?.organization.name}</p>
      )}
      {subscription?.status === 'suspended' && (
        <div className="mb-2 px-2">
          <Badge tone="red">Compte suspendu</Badge>
        </div>
      )}
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-navy-800 text-white'
                : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
            )
          }
        >
          <Icon className="size-4.5 shrink-0" aria-hidden />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto space-y-1 border-t border-navy-100 pt-3">
        {isSuperAdmin && (
          <button
            onClick={() => navigate('/super-admin')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
          >
            Super-admin
          </button>
        )}
        <button
          onClick={() => {
            void signOut().then(() => navigate('/connexion'));
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-navy-500 hover:bg-navy-50"
        >
          <LogOut className="size-4.5" aria-hidden />
          Se déconnecter
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-navy-100 bg-white lg:block">
        {sidebar}
      </aside>
      {/* Menu mobile */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-navy-100 bg-white px-4 py-2 lg:hidden">
        <Logo />
        <button
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-navy-700 hover:bg-navy-50"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-white pt-14 lg:hidden">{sidebar}</div>
      )}
      <main className="w-full flex-1 px-4 pt-16 pb-10 sm:px-6 lg:px-8 lg:pt-8">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="etablissements" element={<Etablissements />} />
            <Route path="tablettes" element={<Tablettes />} />
            <Route path="questionnaire" element={<QuestionnairePage />} />
            <Route path="recompenses" element={<Recompenses />} />
            <Route path="avis" element={<Avis />} />
            <Route path="statistiques" element={<Statistiques />} />
            <Route path="equipe" element={<Equipe />} />
            <Route path="abonnement" element={<Abonnement />} />
            <Route path="aide" element={<Aide />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
