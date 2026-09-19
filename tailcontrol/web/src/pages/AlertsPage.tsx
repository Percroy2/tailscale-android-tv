import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ApiError,
  api,
  type AlertSummary,
  type TailnetSummary,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function AlertsPage() {
  const { token } = useAuth();
  const [tailnets, setTailnets] = useState<TailnetSummary[]>([]);
  const [tailnetId, setTailnetId] = useState('');
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
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
      .listAlertsPortal(token, tailnetId)
      .then((response) => setAlerts(response.alerts))
      .catch((err) => {
        setAlerts([]);
        setError(err instanceof ApiError ? err.message : 'Alertes indisponibles');
      });
  }, [token, tailnetId]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Alertes</h2>
          <p className="text-slate-400">Centre de notifications TailControl.</p>
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
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
          >
            <h3 className="font-medium">{alert.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(alert.createdAt).toLocaleString()}
              {alert.readAt ? ' • Lu' : ' • Non lu'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
