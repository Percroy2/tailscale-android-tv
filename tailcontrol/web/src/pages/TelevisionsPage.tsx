import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, api, type TailnetSummary, type TvDeviceSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function TelevisionsPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [tvs, setTvs] = useState<TvDeviceSummary[]>([]);
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
    void api
      .listTvs(token, tailnetId)
      .then((response) => setTvs(response.tvs))
      .catch((err) => {
        setTvs([]);
        setError(err instanceof ApiError ? err.message : 'Chargement impossible');
      })
      .finally(() => setLoading(false));
  }, [token, tailnetId]);

  async function revoke(tvDeviceId: string) {
    if (!token || !tailnetId) {
      return;
    }
    await api.revokeTv(token, tailnetId, tvDeviceId);
    setTvs((current) => current.filter((tv) => tv.id !== tvDeviceId));
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Télévisions autorisées</h2>
          <p className="text-slate-400">
            Gérez les appareils TailControl, leurs profils et leur révocation immédiate.
          </p>
        </div>
        {tailnets.length > 0 && (
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
            value={tailnetId}
            onChange={(event) => setTailnetId(event.target.value)}
          >
            {tailnets.map((tailnet) => (
              <option key={tailnet.id} value={tailnet.id}>
                {tailnet.displayName}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <p className="text-slate-400">Chargement…</p>}
      {error && <p className="text-amber-200">{error}</p>}

      {!loading && tvs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-400">
          Aucune télévision jumelée pour ce Tailnet.
        </div>
      )}

      <div className="grid gap-4">
        {tvs.map((tv) => (
          <article
            key={tv.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <div>
              <h3 className="text-lg font-medium">{tv.name}</h3>
              <p className="text-sm text-slate-400">
                {tv.platform ?? 'Android TV'} •{' '}
                {tv.permissions[0]?.profile ?? 'READ_ONLY'}
              </p>
              <p className="text-xs text-slate-500">
                Dernière activité :{' '}
                {tv.lastSeenAt
                  ? new Date(tv.lastSeenAt).toLocaleString()
                  : '—'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium hover:bg-rose-500"
              onClick={() => void revoke(tv.id)}
            >
              Révoquer
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
