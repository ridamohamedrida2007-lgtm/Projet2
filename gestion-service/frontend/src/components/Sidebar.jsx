import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  {
    to: '/dashboard',
    label: 'Tableau de bord',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M4 13h6V4H4v9zM14 20h6v-7h-6v7zM14 10h6V4h-6v6zM4 20h6v-3H4v3z" />
      </svg>
    )
  },
  {
    to: '/agents',
    label: 'Agents',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11A3.5 3.5 0 1 0 9.5 4a3.5 3.5 0 0 0 0 7zm9.5 10v-2a4 4 0 0 0-3-3.87M15 4.13a3.5 3.5 0 0 1 0 6.74" />
      </svg>
    )
  },
  {
    to: '/planning',
    label: 'Planning',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    )
  },
  {
    to: '/elements-variables',
    label: 'Éléments Variables',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M4 19h16M7 16V8M12 16V5M17 16v-6" />
      </svg>
    )
  }
];

const getInitials = (user) => {
  if (!user) {
    return 'AM';
  }

  return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-blue-800 text-white transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-blue-700 px-6 py-6">
          <h1 className="text-xl font-bold">Airports of Morocco</h1>
          <p className="mt-1 text-sm text-blue-100">Aéroport Essaouira</p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-white text-blue-800' : 'text-blue-50 hover:bg-blue-700'
                }`
              }
            >
              <span className="flex w-5 items-center justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-blue-700 px-4 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-semibold">
              {getInitials(user)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </p>
              <p className="text-xs uppercase tracking-wide text-blue-200">{user?.role || 'invité'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
