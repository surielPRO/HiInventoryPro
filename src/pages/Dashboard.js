import { 
  Box, Typography, Button, Grid, Paper, IconButton, useTheme, 
  Avatar, Badge, Chip, LinearProgress, Tooltip 
} from '@mui/material';
import { 
  Inventory, Assessment, AddBox, Timeline, BarChart, 
  Notifications, QrCode2, Category, Refresh, 
  TrendingUp, TrendingDown,ChevronRight , FilterAlt, Search 
} from '@mui/icons-material';
import { 
  collection, getDocs, query, where, 
  orderBy, limit, startAfter 
} from 'firebase/firestore';
import { db, auth } from "../firebase";
import { Link } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { blue, green, orange, deepPurple, grey } from '@mui/material/colors';
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import MovimientosRecientes from '../components/Movimientos/MovimientosRecientes';

import { Doughnut, Bar } from 'react-chartjs-2';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';
// ✅ Importa ESTOS componentes exactamente (¡no olvides los nuevos!)
import { 
  Chart as ChartJS,  // Nota el alias 'ChartJS'
  LinearScale,
  CategoryScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend 
} from 'chart.js';

// Registro correcto usando el alias
ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend
);

// Configuración de dayjs
dayjs.locale('es');
dayjs.extend(relativeTime);


// Tema VIP personalizado
const vipTheme = createTheme({
  palette: {
    primary: {
      main: '#0056b3', // Azul corporativo Hisense
      contrastText: '#fff'
    },
    secondary: {
      main: '#ff6d00', // Naranja vibrante
      contrastText: '#fff'
    },
    success: {
      main: '#00c853', // Verde éxito
      contrastText: '#fff'
    },
    warning: {
      main: '#ffab00', // Amarillo advertencia
      contrastText: '#fff'
    },
    background: {
      default: '#f5f7ff', // Fondo azul claro
      paper: '#ffffff'
    },
    text: {
      primary: '#1a237e',
      secondary: '#283593'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 86, 179, 0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 40px rgba(0, 86, 179, 0.15)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '0.9rem',
          letterSpacing: '0.5px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
          boxShadow: '0 4px 6px rgba(0, 86, 179, 0.2)'
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ff6d00 0%, #e65100 100%)',
          boxShadow: '0 4px 6px rgba(255, 109, 0, 0.2)'
        }
      }
    }
  }
});

// Componente de tarjeta de estadísticas mejorada
const VipStatCard = ({ icon, title, value, trend, color }) => {
  const trendColor = trend >= 0 ? 'success.main' : 'error.main';
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ 
          bgcolor: `${color}.light`, 
          color: `${color}.dark`,
          mr: 2,
          width: 48,
          height: 48
        }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="800">
            {value}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TrendIcon sx={{ color: trendColor, mr: 0.5 }} />
        <Typography variant="body2" sx={{ color: trendColor }}>
          {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          vs. last month
        </Typography>
      </Box>
    </Paper>
  );
};

// Componente de gráfico de productos por área
const AreaDistributionChart = ({ data }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        '#0056b3',
        '#ff6d00',
        '#00c853',
        '#ffab00',
        '#9c27b0'
      ],
      borderWidth: 0,
      cutout: '70%'
    }]
  };

  return (
    <Box sx={{ position: 'relative', height: '200px', width: '100%' }}>
      <Doughnut 
        data={chartData}
        options={{
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          maintainAspectRatio: false
        }}
      />
    </Box>
  );
};

// Componente de gráfico de tendencia de movimientos
const MovementTrendChart = ({ data }) => {
  // Datos procesados (sin cambios)
  const chartData = {
    labels: data.map(item => dayjs(item.fecha).format('DD MMM')),
    datasets: [
      {
        label: 'Entradas',
        data: data.filter(m => m.tipo === 'entrada').map(item => item.cantidad),
        backgroundColor: '#00c853',
        borderRadius: 6
      },
      {
        label: 'Salidas',
        data: data.filter(m => m.tipo === 'salida').map(item => item.cantidad),
        backgroundColor: '#ff3d00',
        borderRadius: 6
      }
    ]
  };

  return (
    <Box sx={{ height: '300px', mt: 2 }}>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
          },
          // ✅ Escalas EXPLÍCITAS (key fix!)
          scales: {
            y: {
              type: 'linear', // Declarado manualmente
              beginAtZero: true,
              grid: { drawBorder: false }
            },
            x: {
              type: 'category', // Para ejes con etiquetas
              grid: { display: false }
            }
          }
        }}
      />
    </Box>
  );
};

function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    movimientosHoy: 0,
    areas: {}
  });
  const [movimientos, setMovimientos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Obtener productos
        const productosSnapshot = await getDocs(collection(db, 'productos'));
        const productosData = productosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calcular estadísticas
        const areas = {};
        let productosBajoStock = 0;
        
        productosData.forEach(producto => {
          // Contar por área
          areas[producto.area] = (areas[producto.area] || 0) + 1;
          
          // Verificar stock bajo (asumiendo que menos de 5 es bajo)
          if (producto.stock < 5) {
            productosBajoStock++;
          }
        });

        // Obtener movimientos recientes (últimos 7 días)
        const sieteDiasAtras = new Date();
        sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
        
        const movimientosQuery = query(
          collection(db, 'movimientos'),
          where('fecha', '>=', sieteDiasAtras),
          orderBy('fecha', 'desc'),
          limit(50)
        );
        
        const movimientosSnapshot = await getDocs(movimientosQuery);
        const movimientosData = movimientosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha.toDate()
        }));

        // Obtener movimientos de hoy para el contador
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const movimientosHoyQuery = query(
          collection(db, 'movimientos'),
          where('fecha', '>=', hoy)
        );
        
        const movimientosHoySnapshot = await getDocs(movimientosHoyQuery);

      

        // Actualizar estado
        setStats({
          totalProductos: productosData.length,
          productosBajoStock,
          movimientosHoy: movimientosHoySnapshot.size,
          areas
        });
        
        setMovimientos(movimientosData);
       
        
        // Simular notificaciones
        setNotifications([
          {
            id: 1,
            message: 'Inventario semanal pendiente',
            time: 'Hace 2 horas',
            read: false
          },
          {
            id: 2,
            message: '5 productos con stock bajo',
            time: 'Hace 1 día',
            read: false
          }
        ]);

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => console.log("Sesión cerrada"))
      .catch(error => console.error("Error al cerrar sesión:", error));
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e8ff 100%)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <img 
            src="https://www.hisense.com/images/logo-hisense.svg" 
            alt="Hisense" 
            style={{ height: 60, marginBottom: 20 }} 
          />
          <LinearProgress sx={{ width: 300, height: 8, borderRadius: 4 }} />
          <Typography variant="h6" sx={{ mt: 3, color: 'primary.main' }}>
            Cargando Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={vipTheme}>
      <Box sx={{ 
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e8ff 100%)'
      }}>
        <Navbar />
        <Sidebar />
        
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: 4, 
          pt: '80px',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}>
          {/* Encabezado premium */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            background: 'linear-gradient(90deg, #0056b3 0%, #003d82 100%)',
            p: 3,
            borderRadius: '16px',
            color: 'white'
          }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: '800',
                mb: 1,
                letterSpacing: '-0.5px'
              }}>
                Control Panel
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Hisense Advanced Inventory Management
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
             
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                sx={{
                  borderRadius: '50px',
                  px: 3,
                  py: 1
                }}
              >
                Update
              </Button>
            </Box>
          </Box>

          {/* Tarjetas de estadísticas premium */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <VipStatCard
                icon={<Inventory />}
                title="Total Material"
                value={stats.totalProductos}
                trend={5.2}
                color="primary"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <VipStatCard
                icon={<Assessment />}
                title="Low Stock"
                value={stats.productosBajoStock}
                trend={-2.4}
                color="warning"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <VipStatCard
                icon={<Timeline />}
                title="Movements Today"
                value={stats.movimientosHoy}
                trend={12.8}
                color="secondary"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <VipStatCard
                icon={<Category />}
                title="Active Areas"
                value={Object.keys(stats.areas).length}
                trend={0}
                color="success"
              />
            </Grid>
          </Grid>

          {/* Acciones Rápidas VIP */}
          <Typography variant="h5" sx={{ 
            mt: 4, 
            mb: 1, 
            fontWeight: '700',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Box component="span" sx={{ 
              width: '4px', 
              height: '24px', 
              bgcolor: 'primary.main', 
              mr: 2, 
              borderRadius: '2px' 
            }} />
            Quick Actions
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
                  py: 2.5,
                  fontSize: '1rem',
                  borderRadius: '12px'
                }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Manage</Typography>
                  <Typography variant="h6">Products</Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/productos"
                state={{ showAddForm: true }}
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<AddBox />}
                sx={{
                  py: 2.5,
                  fontSize: '1rem',
                  borderRadius: '12px'
                }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Add</Typography>
                  <Typography variant="h6">New Product</Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/movimientos/historial"
                variant="contained"
                color="success"
                fullWidth
                startIcon={<Timeline />}
                sx={{
                  py: 2.5,
                  fontSize: '1rem',
                  borderRadius: '12px'
                }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Show</Typography>
                  <Typography variant="h6">Full History</Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/reportes"
                variant="contained"
                color="warning"
                fullWidth
                startIcon={<Assessment />}
                sx={{
                  py: 2.5,
                  fontSize: '1rem',
                  borderRadius: '12px'
                }}
              >
                <Box textAlign="left">
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Generate</Typography>
                  <Typography variant="h6">Reports</Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>

          {/* Contenido principal premium */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 3
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Movement Trends
                      </Typography>
                      <Chip 
                        icon={<FilterAlt />}
                        label="Last 7 days"
                        color="primary"
                      />
                    </Box>
                    <MovementTrendChart data={movimientos} />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                      Distribution by Area
                    </Typography>
                    <AreaDistributionChart data={stats.areas} />
                  </Paper>
                </Grid>
                
                
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Activity
                  </Typography>
                  <Tooltip title="Search activity">
                    <IconButton color="primary">
                      <Search />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Box sx={{ maxHeight: '290px', overflowY: 'auto', pr: 1 }}>
                  {movimientos.slice(0, 8).map((movimiento, index) => (
                    <Box 
                      key={movimiento.id} 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: index % 2 === 0 ? 'action.hover' : 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" fontWeight="600">
                          {movimiento.tipo === 'entrada' ? 'Input' : 'Exit'} product
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(movimiento.fecha).fromNow()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Cuantity: <strong>{movimiento.cantidad}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Reason: {movimiento.motivo || 'No especificado'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Employee: {movimiento.numeroEmpleado || 'N/A'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Latest Movements
                  </Typography>
                  <Button 
                    component={Link}
                    to="/movimientos/historial"
                    variant="text"
                    color="primary"
                    endIcon={<ChevronRight  />}
                  >
                  Show All
                  </Button>
                </Box>
                <MovimientosRecientes />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default Dashboard;