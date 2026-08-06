import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { MARKETING_ROUTES } from './routes';
import { metaForPath } from './seo';
import NotFound from './pages/NotFound';

/**
 * Montage SPA des pages publiques — utilisé en développement et comme
 * fallback. En production, ces pages sont servies pré-rendues en HTML
 * statique par Cloudflare (voir scripts/prerender.mjs).
 */
export default function MarketingRoutes() {
  const location = useLocation();
  useEffect(() => {
    const meta = metaForPath(location.pathname);
    if (meta) document.title = meta.title;
  }, [location.pathname]);

  return (
    <Routes>
      {MARKETING_ROUTES.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
