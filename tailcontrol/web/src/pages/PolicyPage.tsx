import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, api, type PolicyDocument, type TailnetSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function PolicyPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
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
      .getPolicy(token, tailnetId)
      .then(setPolicy)
      .catch((err) => {
        setPolicy(null);
        setError(err instanceof ApiError ? err.message : 'Politique indisponible');
      });
  }, [token, tailnetId]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const aclText =
    policy?.acl != null
      ? JSON.stringify(policy.acl, null, 2)
      : 'Aucune politique disponible';

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Politique ACL</h2>
          <p className="text-slate-400">Document de politique Tailscale.</p>
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

      {policy && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Dernière mise à jour : {policy.updatedAt ?? '—'}
          </p>
          <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
            {aclText}
          </pre>
        </div>
      )}
    </section>
  );
}
