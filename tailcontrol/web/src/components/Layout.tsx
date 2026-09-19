import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Accueil' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/televisions', label: 'Télévisions' },
  { to: '/alerts', label: 'Alertes' },
  { to: '/activity', label: 'Activité' },
  { to: '/dns', label: 'DNS' },
  { to: '/auth-keys', label: 'Clés' },
  { to: '/policy', label: 'Politique' },
  { to: '/monitoring', label: 'Supervision' },
  { to: '/settings', label: 'Paramètres' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400">TailControl</p>
            <h1 className="text-xl font-semibold">Portail Web</h1>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm transition ${
                  isActive
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              Connexion
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
