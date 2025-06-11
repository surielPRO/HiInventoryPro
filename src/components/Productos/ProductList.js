import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, deleteDoc, doc, updateDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  DataGrid
} from '@mui/x-data-grid';
import {
  Chip, IconButton, Box, Typography, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem
} from '@mui/material';
import { Edit, Visibility, Delete } from '@mui/icons-material';
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import InputAdornment from "@mui/material/InputAdornment";
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({ nombre: '', descripcion: '', codigo: '', stock: '', area: '' });

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  
const theme = createTheme({
  palette: {
    primary: {
      main: '#009688', // tu color personalizado
    },
    secondary: {
      main: '#f50057',
    },
  },
});
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'productos'));
        const productosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productosData);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      }
    };

    cargarProductos();
  }, []);

  const verificarContraseña = async () => {
    try {
      const docRef = doc(db, 'configuracion', 'controlAcceso');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const claveReal = docSnap.data().clave;
        return passwordInput === claveReal;
      } else {
        console.warn('No se encontró el documento de configuración');
        return false;
      }
    } catch (error) {
      console.error('Error al verificar la contraseña:', error);
      return false;
    }
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setOpenViewDialog(true);
  };

  const pedirContraseña = (product, action) => {
    setSelectedProduct(product);
    setPendingAction(action);
    setPasswordInput('');
    setPasswordDialogOpen(true);
  };

  const ejecutarAccionConContraseña = async () => {
    const esValida = await verificarContraseña();
    if (!esValida) {
      alert('Contraseña incorrecta');
      return;
    }

    if (pendingAction === 'edit') {
      setEditValues({
        nombre: selectedProduct.nombre,
        descripcion: selectedProduct.descripcion,
        codigo: selectedProduct.codigo,
        stock: selectedProduct.stock,
        area: selectedProduct.area
      });
      setOpenEditDialog(true);
    } else if (pendingAction === 'delete') {
      try {
        await deleteDoc(doc(db, 'productos', selectedProduct.id));
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }

    setPasswordDialogOpen(false);
  };

  const handleEditChange = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      await updateDoc(doc(db, 'productos', selectedProduct.id), {
        nombre: editValues.nombre,
        descripcion: editValues.descripcion,
        codigo: editValues.codigo,
        stock: editValues.stock,
        area: editValues.area,
      });

      setProducts(prev =>
        prev.map(p => p.id === selectedProduct.id ? { ...p, ...editValues } : p)
      );
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = selectedArea ? product.area === selectedArea : true;

    return matchesSearch && matchesArea;
  });

  const columns = [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color="primary" variant="outlined" />
      )
    },
    { field: 'nombre', headerName: 'Nombre', width: 180 },
    { field: 'descripcion', headerName: 'Descripción', width: 250 },
    { field: 'stock', headerName: 'Stock', width: 80 },
    { field: 'area', headerName: 'Área', width: 140 },
    {
      field: 'imagen',
      headerName: 'Imagen',
      width: 120,
      renderCell: (params) => (
        <Avatar src={params.value} alt="Producto" variant="rounded" sx={{ width: 60, height: 50 }} />
      ),
    },
    {
      field: 'qrImagen',
      headerName: 'QR',
      width: 120,
      renderCell: (params) => (
        <Avatar src={params.value} alt="QR" variant="square" sx={{ width: 56, height: 56 }} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 160,
      renderCell: (params) => (
        <>
          <IconButton color="info" onClick={() => handleView(params.row)}>
            <Visibility />
          </IconButton>
          <IconButton color="primary" onClick={() => pedirContraseña(params.row, 'edit')}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => pedirContraseña(params.row, 'delete')}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', mt: 2 }}>
      {/* Buscador y filtro por área */}
      <Box display="flex" gap={2} mb={3} >
  <TextField
    label=""
    variant="outlined"
    
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    fullWidth
    sx={{
      "& .MuiInputLabel-root": { color: "#000000", fontWeight: "bold" },
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        backgroundColor: 'background.paper',
        "& fieldset": { borderColor: "#ffffff" },
        "&:hover fieldset": { borderColor: "#115293" }
      }
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon color="primary" />
        </InputAdornment>
      )
    }}
  />

  <TextField
  select
  value={selectedArea}
  onChange={(e) => setSelectedArea(e.target.value)}
  fullWidth
  displayEmpty
  sx={{
    "& .MuiInputLabel-root": {
      color: "#1976d2",
      fontWeight: "bold"
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "background.paper",
      "& fieldset": { borderColor: "#1976d2" },
      "&:hover fieldset": { borderColor: "#009A9D" }
    }
  }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <FilterAltIcon color="primary" />
      </InputAdornment>
    )
  }}
>
  <MenuItem value="" disabled>
    Elige un área
  </MenuItem>
  <MenuItem value="almacen">Almacén</MenuItem>
  <MenuItem value="quimicos">Químicos</MenuItem>
  {/* Agrega más opciones si deseas */}
</TextField>

</Box>

      {/* Tabla */}
      <DataGrid
        rows={filteredProducts}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.paper',
            fontWeight: 700,
          },
        }}
      />

      {/* Diálogo de vista */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles del Producto</DialogTitle>
        <DialogContent dividers>
          {selectedProduct && (
            <Box>
              <Typography><strong>Código:</strong> {selectedProduct.codigo}</Typography>
              <Typography><strong>Nombre:</strong> {selectedProduct.nombre}</Typography>
              <Typography><strong>Descripción:</strong> {selectedProduct.descripcion}</Typography>
              <Typography><strong>Stock:</strong> {selectedProduct.stock}</Typography>
              <Typography><strong>Área:</strong> {selectedProduct.area}</Typography>
              <Box mt={2} display="flex" gap={2}>
                <Avatar src={selectedProduct.imagen} variant="rounded" sx={{ width: 140, height: 140 }} />
                <Avatar src={selectedProduct.qrImagen} variant="square" sx={{ width: 130, height: 130 }} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de edición */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Producto</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Código"
              value={editValues.codigo}
              onChange={(e) => handleEditChange('codigo', e.target.value)}
              fullWidth
              clickable={false} 
                        sx={{ pointerEvents: 'none' }}
            />
            <TextField
              label="Nombre"
              value={editValues.nombre}
              onChange={(e) => handleEditChange('nombre', e.target.value)}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={editValues.descripcion}
              onChange={(e) => handleEditChange('descripcion', e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Área"
              value={editValues.area}
              onChange={(e) => handleEditChange('area', e.target.value)}
              fullWidth
            >
              <MenuItem value="almacen">Almacén</MenuItem>
              <MenuItem value="quimicos">Químicos</MenuItem>
              
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveChanges} variant="contained" color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de contraseña */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Confirmar contraseña</DialogTitle>
        <DialogContent>
          <TextField
            label="Contraseña"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button onClick={ejecutarAccionConContraseña} variant="contained">Aceptar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
