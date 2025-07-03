import React, { useState, useEffect } from 'react';
import {
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  addDoc, 
  doc, 
  increment, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Typography, Button, TextField, Autocomplete,
  Select, MenuItem, InputLabel, FormControl,
  Paper, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions,
  CircularProgress, Backdrop, Chip, IconButton,
  Divider, useTheme, InputAdornment
} from '@mui/material';
import {
  Inventory, Add, Remove, Search, Refresh, Close
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import vipTheme from '../../themes/vipTheme';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';

const MovimientosPage = () => {
  const theme = useTheme();
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [form, setForm] = useState({
    productoId: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    numeroEmpleado: '',
    fecha: new Date()
  });
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const productosSnapshot = await getDocs(collection(db, 'productos'));
      const productosData = productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(productosData);
      setProductosFiltrados(productosData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const filtrados = productos.filter(producto =>
      producto.nombre?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setProductosFiltrados(filtrados);
  }, [terminoBusqueda, productos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.numeroEmpleado || !/^\d+$/.test(form.numeroEmpleado)) {
      alert("Enter a valid employee number");
      return;
    }

    if (!form.cantidad || Number(form.cantidad) <= 0) {
      alert("The amount must be a number greater than zero.");
      return;
    }

    if (!form.motivo.trim()) {
      alert("You must enter a reason.");
      return;
    }

    const productoRef = doc(db, "productos", form.productoId);
    const productoSnap = await getDoc(productoRef);

    if (form.tipo === "salida") {
      if (productoSnap.exists()) {
        const stockActual = productoSnap.data().stock || 0;
        if (stockActual < Number(form.cantidad)) {
          alert(`Insufficient stock. Available: ${stockActual}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      // Registrar movimiento con fecha
      await addDoc(collection(db, "movimientos"), {
        productoId: form.productoId,
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        numeroEmpleado: form.numeroEmpleado,
        productoNombre: productoSeleccionado?.nombre || 'N/A',
        fecha: form.fecha,
        timestamp: serverTimestamp()
      });

      // Actualizar stock
      await updateDoc(productoRef, {
        stock: increment(form.tipo === "entrada" ? +form.cantidad : -form.cantidad),
      });

      // Reiniciar formulario
      setForm({
        productoId: '',
        tipo: 'entrada',
        cantidad: '',
        motivo: '',
        numeroEmpleado: '',
        fecha: new Date()
      });
      setProductoSeleccionado(null);
      setTerminoBusqueda('');

      alert("¡Movimiento registrado y stock actualizado correctamente!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleVerImagen = (producto) => {
    setProductoSeleccionado(producto);
    setOpenDialog(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <ThemeProvider theme={vipTheme}>
        <Box sx={{ 
          p: 3, 
          backgroundColor: "background.default", 
          minHeight: "100vh"
        }}>
          {/* Encabezado */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4,
            p: 3,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
            color: 'white'
          }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: '700',
                mb: 1
              }}>
                <Inventory sx={{ mr: 2, verticalAlign: 'middle' }} />
                Movements
              </Typography>
              <Typography variant="subtitle1">
                Registration and management of entries and exits
              </Typography>
            </Box>
            
            <IconButton 
              color="inherit" 
              onClick={cargarProductos}
            >
              <Refresh />
            </IconButton>
          </Box>

          {/* Formulario */}
          <Paper sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 86, 179, 0.1)'
          }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: '600', color: 'primary.main' }}>
              New Movement Registration
            </Typography>
            
            <form onSubmit={handleSubmit}>
           

              <Autocomplete
                options={productosFiltrados}
                getOptionLabel={(option) =>
                  `${option.nombre} — Code: ${option.codigo || 'N/A'}`
                }
                onChange={(e, value) => {
                  setForm({ ...form, productoId: value?.id || '' });
                  setProductoSeleccionado(value || null);
                }}
                value={productoSeleccionado}
                inputValue={terminoBusqueda}
                onInputChange={(e, newValue) => setTerminoBusqueda(newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Product" 
                    required 
                    fullWidth 
                    sx={{ mb: 2 }} 
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: '12px' }
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />

              {productoSeleccionado && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2, 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: '12px'
                }}>
                  <Avatar
                    src={productoSeleccionado.imagen}
                    alt={productoSeleccionado.nombre}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mr: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease'
                      }
                    }}
                    onClick={() => handleVerImagen(productoSeleccionado)}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {productoSeleccionado.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Código: {productoSeleccionado.codigo || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>Stock:</Typography>
                      <Chip
                        label={productoSeleccionado.stock || 0}
                        color={
                          productoSeleccionado.stock > 10 ? "success" : 
                          productoSeleccionado.stock > 0 ? "warning" : "error"
                        }
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Movement Type</InputLabel>
                  <Select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="entrada">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Add color="success" sx={{ mr: 1 }} />
                        <span>Input</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="salida">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Remove color="error" sx={{ mr: 1 }} />
                        <span>Output</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Cuantity"
                  type="number"
                  fullWidth
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  required
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <DateTimePicker
                  label="Date And Time Movement"
                  value={form.fecha}
                  onChange={(nuevaFecha) => setForm({...form, fecha: nuevaFecha})}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                />
              </Box>

              <TextField
                label="Reason"
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                required
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />

              <TextField
                label="Number Employe"
                fullWidth
                sx={{ mb: 3 }}
                value={form.numeroEmpleado}
                onChange={(e) => setForm({ ...form, numeroEmpleado: e.target.value })}
                required
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 8px rgba(0, 86, 179, 0.3)'
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Save Movement'
                  )}
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Indicador de carga */}
          <Backdrop open={loading} sx={{ 
            zIndex: 1300, 
            color: '#fff',
            backgroundColor: 'rgba(0, 86, 179, 0.8)'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress color="inherit" size={60} thickness={4} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Process Save...
              </Typography>
            </Box>
          </Backdrop>

          {/* Diálogo para ver imagen */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0, 86, 179, 0.2)'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              py: 2
            }}>
              Details Product
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {productoSeleccionado && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <Avatar
                    src={productoSeleccionado.imagen}
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {!productoSeleccionado.imagen && <Inventory sx={{ fontSize: 60 }} />}
                  </Avatar>
                  
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {productoSeleccionado.nombre}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 3, 
                    mb: 2
                  }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Number BIN</Typography>
                      <Typography fontWeight="medium">{productoSeleccionado.codigo || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Stock</Typography>
                      <Chip
                        label={productoSeleccionado.stock || 0}
                        color={
                          productoSeleccionado.stock > 10 ? "success" : 
                          productoSeleccionado.stock > 0 ? "warning" : "error"
                        }
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default MovimientosPage;