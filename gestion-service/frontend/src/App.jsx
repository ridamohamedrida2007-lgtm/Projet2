import { useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import ElementsVariables from './pages/ElementsVariables';
import Login from './pages/Login';
import Planning from './pages/Planning';

const routeTitles = {
  '/dashboard': 'Tableau de bord',
  '/agents': 'Gestion des Agents',
  '/planning': 'Tableau de Service',
  '/elements-variables': 'Éléments Variables'
};

const AppLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = routeTitles[location.pathname] || 'Gestion des Tableaux de Service';

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <Navbar title={title} onToggleSidebar={() => setSidebarOpen((current) => !current)} />
        <main className="px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/elements-variables" element={<ElementsVariables />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
