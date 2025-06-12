import React, { useState, useEffect } from 'react';
import {
  getDoc, collection, getDocs, updateDoc, addDoc, doc, increment, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Box, Typography, Button, TextField, Autocomplete,
  Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions,
  CircularProgress, Backdrop
} from '@mui/material';
import { Inventory } from '@mui/icons-material';

const MovimientosPage = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    productoId: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    numeroEmpleado: ''
  });
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargarDatos = async () => {
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const movimientosSnapshot = await getDocs(collection(db, 'movimientos'));
    
    setProductos(productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setMovimientos(
      movimientosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.fecha?.toMillis() - a.fecha?.toMillis())
    );
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.numeroEmpleado || !/^\d+$/.test(form.numeroEmpleado)) {
      alert("Ingrese un número de empleado válido");
      return;
    }

    if (!form.cantidad || Number(form.cantidad) <= 0) {
      alert("La cantidad debe ser un número mayor a cero.");
      return;
    }

    if (!form.motivo.trim()) {
      alert("Debe ingresar un motivo.");
      return;
    }

    const productoRef = doc(db, "productos", form.productoId);
    const productoSnap = await getDoc(productoRef);

    if (form.tipo === "salida") {
      if (productoSnap.exists()) {
        const stockActual = productoSnap.data().stock || 0;
        if (stockActual < Number(form.cantidad)) {
          alert(`Stock insuficiente. Disponible: ${stockActual}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "movimientos"), {
        ...form,
        fecha: serverTimestamp(),
      });

      await updateDoc(productoRef, {
        stock: increment(form.tipo === "entrada" ? +form.cantidad : -form.cantidad),
      });

      setForm({
        productoId: '',
        tipo: 'entrada',
        cantidad: '',
        motivo: '',
        numeroEmpleado: ''
      });
      setSelectedProducto(null);

      await cargarDatos(); // Actualiza la lista sin recargar la página
      alert("Movimiento registrado y stock actualizado!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleVerImagen = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    setSelectedProducto(producto);
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography color='white' variant="h4" gutterBottom>Registro de Movimientos</Typography>

      {/* Spinner */}
      <Backdrop open={loading} sx={{ zIndex: 1300, color: '#fff' }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ ml: 2 }}>Guardando movimiento...</Typography>
      </Backdrop>

      {/* Formulario */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={productos}
            getOptionLabel={(option) =>
              `${option.nombre} — Bin: ${option.codigo || 'N/A'}`
            }
            onChange={(e, value) => {
              setForm({ ...form, productoId: value?.id || '' });
              setSelectedProducto(value || null);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Buscar producto" required fullWidth sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          {selectedProducto && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
              <Avatar
                src={selectedProducto.imagen}
                alt={selectedProducto.nombre}
                sx={{ width: 56, height: 56, mr: 2 }}
              />
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {selectedProducto.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bin: {selectedProducto.codigo || 'N/A'} — Stock: {selectedProducto.stock || 0}
                </Typography>
                <Typography variant="body2">
                  {selectedProducto.descripcion || 'Sin descripción'}
                </Typography>
              </Box>
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Cantidad"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            required
          />

          <TextField
            label="Motivo"
            fullWidth
            sx={{ mb: 2 }}
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            required
          />

          <TextField
            label="Número de Empleado"
            fullWidth
            sx={{ mb: 2 }}
            value={form.numeroEmpleado}
            onChange={(e) => setForm({ ...form, numeroEmpleado: e.target.value })}
            required
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />

          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            Guardar Movimiento
          </Button>
        </form>
      </Paper>

      {/* Tabla de movimientos */}
      <Typography variant="h6" gutterBottom>Historial</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Empleado</TableCell>
              <TableCell>Motivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movimientos.map((mov) => {
              const producto = productos.find(p => p.id === mov.productoId);
              return (
                <TableRow key={mov.id}>
                  <TableCell>{producto?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    <Avatar
                      src={producto?.imagen}
                      sx={{ width: 40, height: 40, cursor: 'pointer' }}
                      onClick={() => handleVerImagen(mov.productoId)}
                    >
                      {!producto?.imagen && <Inventory />}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Box component="span" sx={{ color: mov.tipo === 'entrada' ? 'green' : 'red', fontWeight: 'bold' }}>
                      {mov.tipo.toUpperCase()}
                    </Box>
                  </TableCell>
                  <TableCell>{mov.cantidad}</TableCell>
                  <TableCell>{mov.fecha?.toDate().toLocaleString()}</TableCell>
                  <TableCell>{mov.numeroEmpleado || 'N/A'}</TableCell>
                  <TableCell>{mov.motivo}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para ver imagen */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Imagen del Producto</DialogTitle>
        <DialogContent>
          {selectedProducto && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar
                src={selectedProducto.imagen}
                sx={{ width: 200, height: 200, mb: 2 }}
              >
                {!selectedProducto.imagen && <Inventory sx={{ fontSize: 60 }} />}
              </Avatar>
              <Typography variant="h6">{selectedProducto.nombre}</Typography>
              <Typography>Código: {selectedProducto.codigo || 'N/A'}</Typography>
              <Typography>Stock: {selectedProducto.stock || 0}</Typography>
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

export default MovimientosPage;
