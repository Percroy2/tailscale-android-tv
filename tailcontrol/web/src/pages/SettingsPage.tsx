import { type FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, api, type TailnetSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!tailnetId || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.saveTailscaleCredentials(token, tailnetId, {
        clientId,
        clientSecret,
      });
      setMessage('Credentials Tailscale enregistrés (secret chiffré côté serveur).');
      setClientSecret('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Paramètres Tailscale</h2>
        <p className="text-slate-400">
          Configurez un OAuth Client Tailscale pour alimenter le dashboard et la gestion du Tailnet.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <label className="block text-sm text-slate-400">
          Tailnet
          <select
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            value={tailnetId}
            onChange={(event) => setTailnetId(event.target.value)}
          >
            {tailnets.map((tailnet) => (
              <option key={tailnet.id} value={tailnet.id}>
                {tailnet.displayName} ({tailnet.name})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-400">
          OAuth Client ID
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm text-slate-400">
          OAuth Client Secret
          <input
            type="password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            required
          />
        </label>
        {message && <p className="text-emerald-400">{message}</p>}
        {error && <p className="text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !tailnetId}
          className="rounded-lg bg-sky-500 px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </section>
  );
}
