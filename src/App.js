import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";  // Ajusta la ruta según tu estructura

// Páginas
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Products from "./pages/Products";
import MovimientosPage from './components/Movimientos/MovimientosPage';
import ReportesPage from './pages/ReportesPage';
import AdminUsuarios from './pages/AdminUsuarios';
import ConfiguracionPage from './pages/ConfiguracionPage';
import AdminPanel from './pages/AdminPanel';
import HistorialMovimientos from './components/Movimientos/HistorialMovimientos';

// Componente para rutas protegidas
function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Cargando...
      </div>
    );
    
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/movimientos/nuevo" element={<MovimientosPage />} />
        <Route path="/movimientos/historial" element={<HistorialMovimientos />} />
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute adminOnly={false} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/movimientos" element={<MovimientosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/usuarios" element={<AdminUsuarios />} />
        </Route>

        {/* Rutas solo para admin */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
