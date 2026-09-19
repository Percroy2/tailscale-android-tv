import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, api, type DnsConfig, type TailnetSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function DnsPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [dns, setDns] = useState<DnsConfig | null>(null);
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
      .getDns(token, tailnetId)
      .then(setDns)
      .catch((err) => {
        setDns(null);
        setError(err instanceof ApiError ? err.message : 'DNS indisponible');
      });
  }, [token, tailnetId]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">DNS Tailnet</h2>
          <p className="text-slate-400">Nameservers et MagicDNS.</p>
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

      {dns && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            MagicDNS : {dns.magicDns ? 'activé' : 'désactivé'}
          </p>
          <h3 className="mt-4 font-medium">Nameservers</h3>
          <ul className="mt-2 space-y-1 text-slate-300">
            {dns.nameservers.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          {dns.searchPaths.length > 0 && (
            <>
              <h3 className="mt-4 font-medium">Search paths</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                {dns.searchPaths.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
