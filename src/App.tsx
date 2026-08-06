import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { OrgProvider, useOrg } from '@/lib/org-context';
import { Spinner } from '@/components/ui/misc';

// Espaces privés (SPA)
const Connexion = lazy(() => import('@/auth/Connexion'));
const Inscription = lazy(() => import('@/auth/Inscription'));
const MotDePasseOublie = lazy(() => import('@/auth/MotDePasseOublie'));
const Onboarding = lazy(() => import('@/auth/Onboarding'));
const AppLayout = lazy(() => import('@/app/AppLayout'));
const KioskActivation = lazy(() => import('@/kiosk/Activation'));
const KioskSession = lazy(() => import('@/kiosk/Session'));
const SuperAdminLayout = lazy(() => import('@/superadmin/SuperAdminLayout'));

// Pages publiques : pré-rendues statiquement en production ;
// montées ici pour le développement et comme fallback SPA.
const MarketingRoutes = lazy(() => import('@/marketing/MarketingRoutes'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

function RequireOrg({ children }: { children: ReactNode }) {
  const { loading, current } = useOrg();
  if (loading) return <Spinner />;
  if (!current) return <Navigate to="/bienvenue" replace />;
  return <>{children}</>;
}

function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route
            path="/bienvenue"
            element={
              <RequireAuth>
                <OrgProvider>
                  <Onboarding />
                </OrgProvider>
              </RequireAuth>
            }
          />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <OrgProvider>
                  <RequireOrg>
                    <AppLayout />
                  </RequireOrg>
                </OrgProvider>
              </RequireAuth>
            }
          />
          <Route path="/kiosk" element={<KioskActivation />} />
          <Route path="/kiosk/session" element={<KioskSession />} />
          <Route
            path="/super-admin/*"
            element={
              <RequireSuperAdmin>
                <SuperAdminLayout />
              </RequireSuperAdmin>
            }
          />
          <Route path="/*" element={<MarketingRoutes />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
