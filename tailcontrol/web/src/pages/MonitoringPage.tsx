import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ApiError,
  api,
  type MonitorSummary,
  type SupervisionAgent,
  type TailnetSummary,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function MonitoringPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [monitors, setMonitors] = useState<MonitorSummary[]>([]);
  const [agents, setAgents] = useState<SupervisionAgent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    setError(null);
    void Promise.all([
      api.listMonitors(token, tailnetId),
      api.listAgents(token, tailnetId),
    ])
      .then(([monitorResponse, agentResponse]) => {
        setMonitors(monitorResponse.monitors);
        setAgents(agentResponse.agents);
      })
      .catch((err) => {
        setMonitors([]);
        setAgents([]);
        setError(err instanceof ApiError ? err.message : 'Supervision indisponible');
      });
  }, [token, tailnetId]);

  async function runAll() {
    if (!token || !tailnetId) {
      return;
    }
    setMessage(null);
    try {
      const result = await api.runAllMonitors(token, tailnetId);
      setMessage(`${result.results.length} supervision(s) exécutée(s)`);
      const refreshed = await api.listMonitors(token, tailnetId);
      setMonitors(refreshed.monitors);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Exécution impossible');
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Supervision</h2>
          <p className="text-slate-400">Moniteurs ping/port/HTTP/WoL et agents.</p>
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
      {message && <p className="text-emerald-300">{message}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
          onClick={() => void runAll()}
        >
          Exécuter toutes les supervisons
        </button>
      </div>

      <div>
        <h3 className="text-lg font-medium">Moniteurs</h3>
        <div className="mt-4 space-y-3">
          {monitors.length === 0 && (
            <p className="text-slate-400">Aucun moniteur configuré.</p>
          )}
          {monitors.map((monitor) => {
            const last = monitor.results[0];
            return (
              <article
                key={monitor.id}
                className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
              >
                <h4 className="font-medium">{monitor.name}</h4>
                <p className="text-sm text-slate-400">
                  {monitor.type} → {monitor.target}
                </p>
                {last && (
                  <p className="mt-2 text-xs text-slate-500">
                    Dernier check : {last.status}
                    {last.latencyMs != null ? ` (${last.latencyMs} ms)` : ''} —{' '}
                    {new Date(last.checkedAt).toLocaleString()}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Agents</h3>
        <div className="mt-4 space-y-3">
          {agents.length === 0 && (
            <p className="text-slate-400">Aucun agent enregistré.</p>
          )}
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
            >
              <h4 className="font-medium">{agent.name}</h4>
              <p className="text-sm text-slate-400">{agent.hostname}</p>
              <p className="mt-2 text-xs text-slate-500">
                {agent.status === 'online' ? '● En ligne' : '○ Hors ligne'} •{' '}
                {agent.capabilities.join(', ')}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
