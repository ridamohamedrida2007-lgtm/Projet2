import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: 'Admin',
  superviseur: 'Superviseur',
  agent: 'Agent'
};

const Navbar = ({ title, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-md border border-gray-200 p-2 text-gray-600 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}</p>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {roleLabels[user?.role] || user?.role || 'Invité'}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Navbar;
