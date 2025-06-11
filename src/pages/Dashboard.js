import { Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material';
import { Inventory, ExitToApp, Assessment, AddBox, Timeline } from '@mui/icons-material';
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import InventoryStats from "../components/InventoryStats";
import { Link } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import MovimientosRecientes from '../components/Movimientos/MovimientosRecientes';
import AddProduct from '../components/Productos/AddProduct';

function Dashboard() {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Sesión cerrada");
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Sidebar />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {/* Encabezado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}>
          <Typography variant="h5" component="h1" sx={{ 
            fontWeight: 'bold',
            color: 'white',
            textTransform: 'uppercase'
          }}>
            Panel de Control
          </Typography> 
        </Box>

        {/* Estadísticas */}
        <InventoryStats />

        {/* Acciones Rápidas */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
          Acciones Rápidas
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/productos"
              variant="contained"
              fullWidth
              startIcon={<Inventory />}
              sx={{
                py: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Gestionar Productos
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
        <Button
          component={Link}
          to="/productos"
          state={{ showAddForm: true }} // <--- aquí
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<AddBox />}
          sx={{
            py: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          Nuevo Producto  
        </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/movimientos/historial"
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<Timeline />}
              sx={{
                py: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Historial
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/reportes"
              variant="contained"
              color="success"
              fullWidth
              startIcon={<Assessment />}
              sx={{
                py: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Generar Reportes
            </Button>
          </Grid>
        </Grid>

        {/* Gráficos y Datos Recientes */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: '16px',
              boxShadow: '0px 4px 20px rgba(0, 103, 204, 0.1)'
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Stock por Categoría
              </Typography>
              {/* Aquí iría un gráfico de barras */}
              <Box sx={{ 
                height: '300px', 
                bgcolor: 'background.paper',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography color="text.secondary">
                  Gráfico de categorías
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
  <Paper sx={{ 
    p: 3, 
    borderRadius: '16px',
    boxShadow: '0px 4px 20px rgba(0, 103, 204, 0.1)'
  }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Movimientos Recientes
    </Typography>
    
    <MovimientosRecientes />
    
  </Paper>
</Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;