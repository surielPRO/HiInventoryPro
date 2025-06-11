import { useAuth } from '../context/AuthContext';
import { Alert } from '@mui/material';

export default function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Alert severity="error">
        No tienes permisos para acceder a esta sección
      </Alert>
    );
  }

  return (
    <div>
      <h1>Panel de Administración</h1>
      {/* Contenido exclusivo para admin */}
    </div>
  );
}