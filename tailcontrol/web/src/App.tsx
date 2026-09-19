import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ActivityPage } from './pages/ActivityPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuthKeysPage } from './pages/AuthKeysPage';
import { DnsPage } from './pages/DnsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { PolicyPage } from './pages/PolicyPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PairingPage } from './pages/PairingPage';
import { SettingsPage } from './pages/SettingsPage';
import { TelevisionsPage } from './pages/TelevisionsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="televisions" element={<TelevisionsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="dns" element={<DnsPage />} />
            <Route path="auth-keys" element={<AuthKeysPage />} />
            <Route path="policy" element={<PolicyPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pair/:code" element={<PairingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
