import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ApiError,
  api,
  type AuthKeySummary,
  type TailnetSummary,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function AuthKeysPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [keys, setKeys] = useState<AuthKeySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    void api.listTailnets(token).then((entries) => {
      setTailnets(entries);
      if (entries[0]) {
        setTailnetId(entries[0].id);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token || !tailnetId) {
      return;
    }
    void api
      .listAuthKeys(token, tailnetId)
      .then((response) => setKeys(response.keys))
      .catch((err) => {
        setKeys([]);
        setError(err instanceof ApiError ? err.message : 'Clés indisponibles');
      });
  }, [token, tailnetId]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Clés d&apos;authentification</h2>
          <p className="text-slate-400">Clés Tailscale du Tailnet.</p>
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

      {error && <p className="text-amber-200">{error}</p>}

      <div className="space-y-3">
        {keys.map((key) => (
          <article
            key={key.id}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
          >
            <h3 className="font-medium">{key.description || key.id}</h3>
            <p className="mt-1 font-mono text-sm text-slate-400">{key.key}</p>
            <p className="mt-2 text-xs text-slate-500">
              {key.revoked ? 'Révoquée' : 'Active'} •{' '}
              {key.reusable ? 'Réutilisable' : 'Éphémère'} • {key.created}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
