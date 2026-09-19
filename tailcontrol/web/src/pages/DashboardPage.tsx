import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, api, type DashboardResponse, type TailnetSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const statCards = [
  { key: 'devicesTotal', label: 'Appareils' },
  { key: 'devicesOnline', label: 'En ligne' },
  { key: 'devicesOffline', label: 'Hors ligne' },
  { key: 'pendingApproval', label: 'À approuver' },
  { key: 'exitNodes', label: 'Exit Nodes' },
  { key: 'subnetRouters', label: 'Subnet Routers' },
  { key: 'pendingRoutes', label: 'Routes en attente' },
  { key: 'users', label: 'Utilisateurs' },
] as const;

export function DashboardPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    void api.listTailnets(token).then((items) => {
      setTailnets(items);
      if (items[0]) {
        setTailnetId(items[0].id);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token || !tailnetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void api
      .getPortalDashboard(token, tailnetId)
      .then(setDashboard)
      .catch((err) => {
        setDashboard(null);
        setError(err instanceof ApiError ? err.message : 'Dashboard indisponible');
      })
      .finally(() => setLoading(false));
  }, [token, tailnetId]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-slate-400">
            {dashboard?.tailnet.displayName ?? 'Synthèse Tailnet via Tailscale API'}
          </p>
        </div>
        {tailnets.length > 0 && (
          <label className="text-sm text-slate-400">
            Tailnet actif
            <select
              className="mt-2 block rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
              value={tailnetId}
              onChange={(event) => setTailnetId(event.target.value)}
            >
              {tailnets.map((tailnet) => (
                <option key={tailnet.id} value={tailnet.id}>
                  {tailnet.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {loading && <p className="text-slate-400">Chargement du Tailnet…</p>}
      {error && (
        <p className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-amber-200">
          {error}. Configurez les credentials OAuth Tailscale dans Paramètres.
        </p>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <article
                key={stat.key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center"
              >
                <p className="text-3xl font-bold text-sky-400">
                  {dashboard.stats[stat.key]}
                </p>
                <p className="mt-2 text-sm uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>

          {dashboard.favorites.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-medium">Favoris</h3>
              <ul className="mt-4 space-y-2">
                {dashboard.favorites.map((favorite) => (
                  <li key={favorite.deviceId} className="flex items-center gap-3">
                    <span
                      className={
                        favorite.online ? 'text-emerald-400' : 'text-slate-500'
                      }
                    >
                      ●
                    </span>
                    {favorite.deviceName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
