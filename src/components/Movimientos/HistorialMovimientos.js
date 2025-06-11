import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from "@mui/material";
import { Search, DateRange, Inventory, Info } from "@mui/icons-material";

const HistorialMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productosData, setProductosData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");

  useEffect(() => {
    cargarMovimientos();
  }, [filtroNombre, filtroFechaInicio, filtroFechaFin]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, "movimientos"));

      if (filtroNombre) {
        q = query(q, where("productoNombre", ">=", filtroNombre));
      }

      if (filtroFechaInicio && filtroFechaFin) {
        q = query(
          q,
          where("fecha", ">=", new Date(filtroFechaInicio)),
          where("fecha", "<=", new Date(filtroFechaFin))
        );
      }

      const snapshot = await getDocs(q);
      const movimientosData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      setMovimientos(movimientosData);
      await cargarDatosProductos(movimientosData);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosProductos = async (movimientos) => {
    const productosIds = [...new Set(movimientos.map(mov => mov.productoId))];
    const productos = {};
    
    for (const productoId of productosIds) {
      if (productoId) {
        const productoRef = doc(db, "productos", productoId);
        const productoSnap = await getDoc(productoRef);
        if (productoSnap.exists()) {
          productos[productoId] = productoSnap.data();
        }
      }
    }
    
    setProductosData(productos);
  };

  const handleVerDetalles = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        <Inventory sx={{ verticalAlign: 'middle', mr: 1 }} />
        Historial de Movimientos
      </Typography>

      {/* Barra de búsqueda */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: 'center' }}>
          <TextField
            label="Buscar producto"
            variant="outlined"
            size="small"
            fullWidth
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="Fecha inicio"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
          />
          
          <TextField
            label="Fecha fin"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
          />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: 'primary.light' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Imagen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stock Actual</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((mov) => {
                const producto = productosData[mov.productoId] || {};
                return (
                  <TableRow key={mov.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{mov.productoNombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {producto.codigo || 'Sin código'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Avatar 
                        src={producto.imagen} 
                        variant="rounded"
                        sx={{ width: 56, height: 56 }}
                      >
                        {!producto.imagen && <Inventory />}
                      </Avatar>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={producto.stock || 'N/A'} 
                        color={producto.stock > 0 ? 'success' : 'error'}
                        variant="outlined"
                        clickable={false} 
                        sx={{ pointerEvents: 'none' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={mov.tipo.toUpperCase()}
                        color={mov.tipo === 'entrada' ? 'success' : 'error'}
                        clickable={false} 
                        sx={{ pointerEvents: 'none' ,fontWeight: 'bold' }}
                        
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography fontWeight="bold">
                        {mov.cantidad}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {mov.fecha?.toDate().toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="outlined"
                        startIcon={<Info />}
                        onClick={() => handleVerDetalles(mov)}
                        size="small"
                      >
                        Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo de detalles */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>Detalles completos del movimiento</DialogTitle>
        <DialogContent dividers>
          {selectedMovimiento && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Información del Producto
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={productosData[selectedMovimiento.productoId]?.imagen} 
                    sx={{ width: 80, height: 80, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {selectedMovimiento.productoNombre}
                    </Typography>
                    <Typography color="text.secondary">
                      Código: {productosData[selectedMovimiento.productoId]?.codigo || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>Stock actual:</strong> {productosData[selectedMovimiento.productoId]?.stock || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography>
                  <strong>Descripción:</strong> {productosData[selectedMovimiento.productoId]?.descripcion || 'Sin descripción'}
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Detalles del Movimiento
                </Typography>
                
                <Typography><strong>Tipo:</strong> 
                  <Box component="span" sx={{ 
                    color: selectedMovimiento.tipo === 'entrada' ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                    ml: 1
                  }}>
                    {selectedMovimiento.tipo.toUpperCase()}
                  </Box>
                </Typography>
                
                <Typography><strong>Cantidad:</strong> {selectedMovimiento.cantidad}</Typography>
                <Typography><strong>Fecha:</strong> {selectedMovimiento.fecha?.toDate().toLocaleString()}</Typography>
                <Typography><strong>Motivo:</strong> {selectedMovimiento.motivo}</Typography>
                <Typography><strong>Usuario:</strong> {selectedMovimiento.numeroEmpleado || 'Desconocido'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistorialMovimientos;