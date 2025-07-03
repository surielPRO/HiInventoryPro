import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  TextField,
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Avatar,
  Chip,
  Fade,
  Zoom,
  Slide
} from '@mui/material';
import { 
  DateRange, 
  PictureAsPdf, 
  GridOn,
  Refresh,
  Inventory,
  Warning,
  CheckCircle,
  FilterAlt,
  Dashboard
} from '@mui/icons-material';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../firebase';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const db = getFirestore(app);

// Tema personalizado con diseño premium
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 20px',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
          }
        }
      }
    }
  }
});

const ReportesPage = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    rango: 'mes',
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fechaFin: new Date(),
    estado: 'todos',
    area: 'todos'
  });

  // Efecto para cargar datos automáticamente cuando cambian los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      generarReporte();
    }, 500); // Debounce para evitar múltiples llamadas

    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generarReporte = async () => {
    setLoading(true);
    try {
      // Preparar fechas según el filtro seleccionado
      let fechaInicio = new Date(filters.fechaInicio);
      let fechaFin = new Date(filters.fechaFin);

      switch(filters.rango) {
        case 'dia':
          fechaInicio.setHours(0, 0, 0, 0);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        case 'semana':
          fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay());
          fechaFin.setDate(fechaInicio.getDate() + 6);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        case 'mes':
          fechaInicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
          fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        case 'anio':
          fechaInicio = new Date(fechaInicio.getFullYear(), 0, 1);
          fechaFin = new Date(fechaInicio.getFullYear(), 11, 31);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        default:
          fechaInicio.setHours(0, 0, 0, 0);
          fechaFin.setHours(23, 59, 59, 999);
      }

      // Construccion de consultas con filtros aplicados
      const productosQuery = filters.area !== 'todos' 
        ? query(collection(db, 'productos'), where('area', '==', filters.area))
        : collection(db, 'productos');

      let movimientosQuery = query(
        collection(db, 'movimientos'),
        where('fecha', '>=', fechaInicio),
        where('fecha', '<=', fechaFin)
      );

      if (filters.area !== 'todos') {
        movimientosQuery = query(movimientosQuery, where('area', '==', filters.area));
      }

      // Ejecutar consultas
      const [productosSnapshot, movimientosSnapshot] = await Promise.all([
        getDocs(productosQuery),
        getDocs(movimientosQuery)
      ]);

      // Procesar datos
      const productosData = productosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        stock: Number(doc.data().stock) || 0,
        stockMinimo: Number(doc.data().stockMinimo) || 0
      }));

      const movimientosData = movimientosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        cantidad: Number(doc.data().cantidad) || 0
      }));

      // Combinar y filtrar datos
      let filteredData = productosData.map(producto => {
        const movimientosProducto = movimientosData.filter(mov => mov.productoId === producto.id);
        
        const entradas = movimientosProducto
          .filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0);
          
        const salidas = movimientosProducto
          .filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0);

        return {
          ...producto,
          movimientos: movimientosProducto,
          entradas,
          salidas,
          diferencia: entradas - salidas
        };
      });

      // Aplicar filtro de estado
      if (filters.estado === 'stock_minimo') {
        filteredData = filteredData.filter(p => p.stock < p.stockMinimo);
      } else if (filters.estado === 'sin_movimientos') {
        filteredData = filteredData.filter(p => p.movimientos.length === 0);
      }

      setReportData(filteredData);
    } catch (error) {
      console.error("Error generando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    if (reportData.length === 0) return;
    
    const doc = new jsPDF();
    const title = `Reporte de Inventario - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    
    const headers = ['Producto', 'Código', 'Área', 'Stock', 'Mínimo', 'Entradas', 'Salidas', 'Diferencia', 'Estado'];
    
    const data = reportData.map(item => [
      item.nombre,
      item.codigo || 'N/A',
      item.area === 'quimicos' ? 'Químicos' : item.area === 'almacen' ? 'Almacén' : 'MRO',
      item.stock,
      item.stockMinimo || 'N/A',
      item.entradas,
      item.salidas,
      item.diferencia,
      item.stock < (item.stockMinimo || 0) ? 'Bajo stock' : 
      item.movimientos.length === 0 ? 'Sin movimientos' : 'Normal'
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    doc.save(`reporte_inventario_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportarExcel = () => {
    if (reportData.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(
      reportData.map(item => ({
        'Producto': item.nombre,
        'Código': item.codigo || 'N/A',
        'Área': item.area === 'quimicos' ? 'Químicos' : item.area === 'almacen' ? 'Almacén' : 'MRO',
        'Stock Actual': item.stock,
        'Stock Mínimo': item.stockMinimo || 'N/A',
        'Entradas': item.entradas,
        'Salidas': item.salidas,
        'Diferencia': item.diferencia,
        'Estado': item.stock < (item.stockMinimo || 0) ? 'Bajo stock' : 
                 item.movimientos.length === 0 ? 'Sin movimientos' : 'Normal'
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `reporte_inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
          minHeight: '100vh'
        }}>
          <Slide direction="down" in={true} mountOnEnter unmountOnExit>
            <Typography 
              color='text.primary' 
              textAlign={'center'} 
              variant="h3" 
              gutterBottom 
              sx={{ 
                mb: 3,
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              <Dashboard sx={{ verticalAlign: 'middle', mr: 2, fontSize: '2.5rem' }} />
              Reportes de Inventario
            </Typography>
          </Slide>

          {/* Sección de Filtros con diseño premium */}
          <Fade in={true} timeout={800}>
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              background: 'white',
              borderLeft: '5px solid #3f51b5'
            }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel><FilterAlt sx={{ mr: 1, fontSize: '1rem' }} /> Rango</InputLabel>
                    <Select
                      value={filters.rango}
                      onChange={(e) => handleFilterChange('rango', e.target.value)}
                      label="Rango"
                      sx={{ background: 'white' }}
                    >
                      <MenuItem value="dia">Día actual</MenuItem>
                      <MenuItem value="semana">Semana actual</MenuItem>
                      <MenuItem value="mes">Mes actual</MenuItem>
                      <MenuItem value="anio">Año actual</MenuItem>
                      <MenuItem value="personalizado">Personalizado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {filters.rango === 'personalizado' && (
                  <>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Fecha inicio"
                        value={filters.fechaInicio}
                        onChange={(newValue) => handleFilterChange('fechaInicio', newValue)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            sx={{ background: 'white' }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Fecha fin"
                        value={filters.fechaFin}
                        onChange={(newValue) => handleFilterChange('fechaFin', newValue)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            sx={{ background: 'white' }}
                          />
                        )}
                        minDate={filters.fechaInicio}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel><FilterAlt sx={{ mr: 1, fontSize: '1rem' }} /> Estado</InputLabel>
                    <Select
                      value={filters.estado}
                      onChange={(e) => handleFilterChange('estado', e.target.value)}
                      label="Estado"
                      sx={{ background: 'white' }}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="stock_minimo">Stock mínimo</MenuItem>
                      <MenuItem value="sin_movimientos">Sin movimientos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel><FilterAlt sx={{ mr: 1, fontSize: '1rem' }} /> Área</InputLabel>
                    <Select
                      value={filters.area}
                      onChange={(e) => handleFilterChange('area', e.target.value)}
                      label="Área"
                      sx={{ background: 'white' }}
                    >
                      <MenuItem value="todos">Todas las áreas</MenuItem>
                      <MenuItem value="quimicos">Químicos</MenuItem>
                      <MenuItem value="almacen">Almacén</MenuItem>
                      <MenuItem value="mro">MRO</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Button 
                    variant="contained" 
                    onClick={generarReporte}
                    startIcon={<Refresh />}
                    fullWidth
                    disabled={loading}
                    sx={{ 
                      height: '56px',
                      background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    {loading ? 'Generando...' : 'Actualizar'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Fade>

          {/* Sección de Resultados */}
          <Zoom in={!loading} style={{ transitionDelay: !loading ? '200ms' : '0ms' }}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 3,
                alignItems: 'center'
              }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  Mostrando {reportData.length} productos
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<PictureAsPdf />}
                    onClick={exportarPDF}
                    disabled={reportData.length === 0}
                    sx={{
                      background: 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<GridOn />}
                    onClick={exportarExcel}
                    disabled={reportData.length === 0}
                    sx={{
                      background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Exportar Excel
                  </Button>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
                </Box>
              ) : reportData.length === 0 ? (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  background: 'linear-gradient(45deg, #ffffff 0%, #f5f7fa 100%)'
                }}>
                  <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                    No se encontraron resultados
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Prueba ajustando los filtros de búsqueda
                  </Typography>
                </Paper>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    maxHeight: 'calc(100vh - 300px)', 
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#3f51b5',
                      borderRadius: '4px'
                    }
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Imagen</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Producto</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Código</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Área</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Stock</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Mínimo</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Entradas</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Salidas</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Diferencia</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 'bold', 
                          background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
                          color: 'white !important'
                        }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.map((producto) => (
                        <TableRow 
                          key={producto.id} 
                          hover
                          sx={{ 
                            '&:nth-of-type(odd)': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)'
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(63, 81, 181, 0.08)'
                            }
                          }}
                        >
                          <TableCell>
                            <Avatar 
                              src={producto.imagen} 
                              variant="rounded"
                              sx={{ 
                                width: 50, 
                                height: 50,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {!producto.imagen && <Inventory />}
                            </Avatar>
                          </TableCell>
                          <TableCell sx={{ fontWeight: '500' }}>{producto.nombre}</TableCell>
                          <TableCell>{producto.codigo || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                producto.area === 'quimicos' ? 'Químicos' : 
                                producto.area === 'almacen' ? 'Almacén' : 'MRO'
                              } 
                              color={
                                producto.area === 'quimicos' ? 'primary' : 
                                producto.area === 'almacen' ? 'default' : 'secondary'
                              }
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                minWidth: '80px'
                              }}
                            />
                          </TableCell>
                          <TableCell>{producto.stock}</TableCell>
                          <TableCell>{producto.stockMinimo || 'N/A'}</TableCell>
                          <TableCell>{producto.entradas}</TableCell>
                          <TableCell>{producto.salidas}</TableCell>
                          <TableCell>
                            <Typography 
                              color={producto.diferencia >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {producto.diferencia}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {producto.stock < (producto.stockMinimo || 0) ? (
                              <Chip 
                                icon={<Warning />}
                                label="Bajo stock" 
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            ) : producto.movimientos.length === 0 ? (
                              <Chip 
                                icon={<Inventory />}
                                label="Sin movimientos" 
                                color="default"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            ) : (
                              <Chip 
                                icon={<CheckCircle />}
                                label="Normal" 
                                color="success"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Zoom>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default ReportesPage;