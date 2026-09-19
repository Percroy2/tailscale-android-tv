import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ApiError, api, type TailnetSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const profiles = [
  { value: 'ADMIN', label: 'Administration' },
  { value: 'OPERATOR', label: 'Opérateur' },
  { value: 'READ_ONLY', label: 'Lecture seule' },
];

export function PairingPage() {
  const { code } = useParams();
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [profile, setProfile] = useState('ADMIN');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof code !== 'string' || token == null) {
      return;
    }
    const pairingCode = code;
    const authToken = token;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pairing = await api.getPairingByCode(pairingCode);
        setDeviceName(pairing.device?.name ?? 'TailControl TV');
        const items = await api.listTailnets(authToken);
        setTailnets(items);
        if (items[0]) {
          setTailnetId(items[0].id);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Code invalide');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [code, token]);

  if (!token) {
    return <Navigate to={`/login?next=/pair/${code ?? ''}`} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code || !tailnetId || !token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.authorizePairing(token, code, {
        tailnetId,
        profile,
        deviceName,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Autorisation impossible');
    } finally {
      setSubmitting(false);
    }
  }

  async function createDemoTailnet() {
    if (!token) {
      return;
    }
    const created = await api.createTailnet(token, {
      name: 'demo',
      displayName: 'Démonstration',
    });
    setTailnets((current) => [...current, created]);
    setTailnetId(created.id);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Jumelage TV</p>
        <h1 className="mt-2 text-3xl font-semibold">Autoriser cet appareil</h1>
        <p className="mt-4 text-slate-300">
          Code : <span className="font-mono text-sky-300">{code}</span>
        </p>

        {loading && <p className="mt-6 text-slate-400">Chargement…</p>}
        {error && <p className="mt-6 text-red-400">{error}</p>}
        {success && (
          <p className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-emerald-300">
            Télévision autorisée. Retournez à la TV pour continuer.
          </p>
        )}

        {!loading && !success && (
          <>
            <div className="mt-8 space-y-4">
              <label className="block text-sm text-slate-400">
                Nom de la télévision
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-400">
                Tailnet
                <select
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  value={tailnetId}
                  onChange={(event) => setTailnetId(event.target.value)}
                >
                  <option value="">Sélectionner un Tailnet</option>
                  {tailnets.map((tailnet) => (
                    <option key={tailnet.id} value={tailnet.id}>
                      {tailnet.displayName}
                    </option>
                  ))}
                </select>
              </label>
              {tailnets.length === 0 && (
                <button
                  type="button"
                  onClick={() => void createDemoTailnet()}
                  className="text-sm text-sky-400 hover:text-sky-300"
                >
                  Créer un Tailnet de démonstration
                </button>
              )}
              <label className="block text-sm text-slate-400">
                Profil
                <select
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                  value={profile}
                  onChange={(event) => setProfile(event.target.value)}
                >
                  {profiles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={submitting || !tailnetId}
                className="rounded-lg bg-sky-500 px-5 py-3 font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Autorisation…' : 'Autoriser'}
              </button>
              <Link
                to="/televisions"
                className="rounded-lg border border-slate-700 px-5 py-3 text-slate-300"
              >
                Annuler
              </Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
