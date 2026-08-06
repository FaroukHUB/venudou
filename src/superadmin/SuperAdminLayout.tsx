import { lazy, Suspense } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router';
import clsx from 'clsx';
import {
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Tablet,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/misc';

const Overview = lazy(() => import('./pages/Overview'));
const Organisations = lazy(() => import('./pages/Organisations'));
const Etablissements = lazy(() => import('./pages/Etablissements'));
const Utilisateurs = lazy(() => import('./pages/Utilisateurs'));
const Plans = lazy(() => import('./pages/Plans'));
const Tablettes = lazy(() => import('./pages/Tablettes'));
const Audit = lazy(() => import('./pages/Audit'));

const nav = [
  { to: '/super-admin', label: 'Aperçu global', icon: LayoutDashboard, end: true },
  { to: '/super-admin/organisations', label: 'Organisations', icon: Building2 },
  { to: '/super-admin/etablissements', label: 'Établissements', icon: MapPin },
  { to: '/super-admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/super-admin/plans', label: 'Plans & offres', icon: CreditCard },
  { to: '/super-admin/tablettes', label: 'Tablettes', icon: Tablet },
  { to: '/super-admin/audit', label: "Journaux d'audit", icon: ClipboardList },
];

export default function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-violet-100 bg-white lg:block">
        <nav aria-label="Navigation super-admin" className="flex h-full flex-col gap-1 p-4">
          <div className="mb-1 px-2">
            <Logo />
          </div>
          <p className="mb-4 px-2 text-xs font-bold tracking-wide text-violet-600 uppercase">
            Super-administration
          </p>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-600 hover:bg-violet-50 hover:text-navy-900',
                )
              }
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
          <div className="mt-auto space-y-1 border-t border-navy-100 pt-3">
            <button
              onClick={() => navigate('/app')}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-navy-500 hover:bg-navy-50"
            >
              ← Tableau de bord client
            </button>
            <button
              onClick={() => {
                void signOut().then(() => navigate('/connexion'));
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-navy-500 hover:bg-navy-50"
            >
              <LogOut className="size-4.5" aria-hidden /> Se déconnecter
            </button>
          </div>
        </nav>
      </aside>
      <main className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="organisations" element={<Organisations />} />
            <Route path="etablissements" element={<Etablissements />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="plans" element={<Plans />} />
            <Route path="tablettes" element={<Tablettes />} />
            <Route path="audit" element={<Audit />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
