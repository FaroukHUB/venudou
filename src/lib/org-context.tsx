import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import type { Location, Organization, OrganizationSubscription, OrgRole, Plan } from './types';

interface Membership {
  organization: Organization;
  role: OrgRole;
  memberId: string;
}

interface OrgState {
  loading: boolean;
  memberships: Membership[];
  current: Membership | null;
  subscription: (OrganizationSubscription & { plan: Plan | null }) | null;
  locations: Location[];
  locationLimit: number | null;
  isAdmin: boolean; // owner ou admin de l'organisation courante
  switchOrganization: (orgId: string) => void;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgState | null>(null);

const STORAGE_KEY = 'venudou.currentOrg';

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );
  const [subscription, setSubscription] = useState<OrgState['subscription']>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('organization_members')
      .select('id, role, organization:organizations(id, name, slug, status, created_at)')
      .eq('user_id', user.id);
    const list: Membership[] = (data ?? [])
      .filter((row) => row.organization)
      .map((row) => ({
        memberId: row.id as string,
        role: row.role as OrgRole,
        organization: row.organization as unknown as Organization,
      }));
    setMemberships(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const current =
    memberships.find((m) => m.organization.id === currentOrgId) ?? memberships[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setSubscription(null);
      setLocations([]);
      return;
    }
    const orgId = current.organization.id;
    void (async () => {
      const [subRes, locRes] = await Promise.all([
        supabase
          .from('organization_subscriptions')
          .select('*, plan:plans(*)')
          .eq('organization_id', orgId)
          .maybeSingle(),
        supabase
          .from('locations')
          .select('*')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .order('name'),
      ]);
      if (cancelled) return;
      setSubscription(
        subRes.data
          ? ({ ...subRes.data, plan: subRes.data.plan ?? null } as OrgState['subscription'])
          : null,
      );
      setLocations((locRes.data ?? []) as Location[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [current]);

  const locationLimit =
    subscription?.max_locations_override ?? subscription?.plan?.max_locations ?? null;

  const value: OrgState = {
    loading,
    memberships,
    current,
    subscription,
    locations,
    locationLimit,
    isAdmin: current ? current.role !== 'location_manager' : false,
    switchOrganization: (orgId) => {
      localStorage.setItem(STORAGE_KEY, orgId);
      setCurrentOrgId(orgId);
    },
    refresh: load,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgState {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg doit être utilisé sous OrgProvider');
  return ctx;
}
