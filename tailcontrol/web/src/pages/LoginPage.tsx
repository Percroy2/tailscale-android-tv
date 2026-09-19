import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { token, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Administrateur');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">TailControl</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <div className="mt-8 space-y-4">
          {mode === 'register' && (
            <label className="block text-sm text-slate-400">
              Nom affiché
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          )}
          <label className="block text-sm text-slate-400">
            E-mail
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-slate-400">
            Mot de passe
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-sky-500 px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Connexion…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
        </button>
        <button
          type="button"
          className="mt-4 w-full text-sm text-slate-400 hover:text-white"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login'
            ? 'Pas encore de compte ? Créer un compte'
            : 'Déjà un compte ? Se connecter'}
        </button>
        <Link to="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-300">
          Retour à l&apos;accueil
        </Link>
      </form>
    </div>
  );
}
