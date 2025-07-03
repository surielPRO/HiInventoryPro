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
  TextField, MenuItem, InputAdornment, Divider, Tooltip,
  Paper, LinearProgress, Badge,CircularProgress
} from '@mui/material';
import { 
  Edit, Visibility, Delete, Search, FilterAlt,
  PictureAsPdf, FileDownload, Refresh, Lock,Inventory

} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const vipTheme = createTheme({
  palette: {
    primary: {
      main: '#0056b3',
      contrastText: '#fff'
    },
    secondary: {
      main: '#ff6d00',
      contrastText: '#fff'
  },
    background: {
      default: '#f5f7ff',
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

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({ 
    nombre: '', 
    descripcion: '', 
    codigo: '', 
    stock: '', 
    area: '' 
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);

  const cargarProductos = async () => {
  try {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'productos'));
    const productosData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Extraer áreas únicas
    const areasUnicas = [...new Set(productosData.map(p => p.area))];
    setAreas(areasUnicas);
    
    setProducts(productosData);
  } catch (error) {
    console.error('Error getting products:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
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
        console.warn('Configuration document not found');
        return false;
      }
    } catch (error) {
      console.error('Error verifying password:', error);
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
      alert('Password Incorrect');
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
        console.error('Error deleting:', error);
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
      console.error('Error Updated product:', error);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Products List", 14, 15);

    const data = filteredProducts.map(product => [
      product.codigo,
      product.nombre,
      product.descripcion,
      product.stock,
      product.area
    ]);

    autoTable(doc, {
      head: [['Code', 'Name', 'Description', 'Stock', 'Area']],
      body: data,
      startY: 20,
    });

    doc.save(`productos_${new Date().toISOString().slice(0,10)}.pdf`);
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
      headerName: 'Code',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color="primary" 
          variant='standard'
          sx={{ fontWeight: 'bold' }}
        />
      )
    },
    { 
      field: 'nombre', 
      headerName: 'Name', 
      width: 180,
      renderCell: (params) => (
        <Typography fontWeight="600">{params.value}</Typography>
      )
    },
    { 
      field: 'descripcion', 
      headerName: 'Description', 
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'Not description'}
        </Typography>
      )
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value > 10 ? "success" : params.value > 0 ? "warning" : "error"}
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
      )
    },
    { 
      field: 'area', 
      headerName: 'Area', 
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          sx={{ 
            backgroundColor: 'primary.light',
            color: 'primary.dark',
            fontWeight: 'bold'
          }}
        />
      )
    },
    {
      field: 'imagen',
      headerName: 'Image',
      width: 120,
      renderCell: (params) => (
        <Avatar 
          src={params.value} 
          alt="Producto" 
          variant="rounded" 
          sx={{ 
            width: 56, 
            height: 56,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }} 
        />
      ),
    },
    {
      field: 'qrImagen',
      headerName: 'QR',
      width: 120,
      renderCell: (params) => (
        <Avatar 
          src={params.value} 
          alt="QR" 
          variant="square" 
          sx={{ 
            width: 56, 
            height: 56,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }} 
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Details">
            <IconButton 
              color="info" 
              onClick={() => handleView(params.row)}
              sx={{ 
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.dark'
                }
              }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton 
              color="primary" 
              onClick={() => pedirContraseña(params.row, 'edit')}
              sx={{ 
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'secondary.dark'
                }
              }}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              color="error" 
              onClick={() => pedirContraseña(params.row, 'delete')}
              sx={{ 
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.dark'
                }
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <ThemeProvider theme={vipTheme}>
      <Box sx={{ 
        p: 0, 
        width: '100%', // Asegura que ocupe todo el ancho
  minHeight: '100vh',
  boxSizing: 'border-box', // Para que el padding no afecte el ancho
  background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e8ff 100%)',
  margin: 0, // Elimina márgenes por defecto
  overflowX: 'hidden' // Evita scroll horizontal no deseado
      }}>
        {/* Encabezado VIP */}
        <Box sx={{ 
           height: '120px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
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
              <Inventory sx={{ mr: 2, verticalAlign: 'middle' }} />
              Product Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Complete list of products in inventory
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Update">
              <IconButton 
                color="inherit" 
                onClick={() => {
                  setLoading(true);
                  cargarProductos();
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdf />}
              onClick={exportToPDF}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filtros VIP */}
        <Paper sx={{ p: 3, mb: 3, height: '100px', }}>
          <Box display="flex" gap={2}>
            <TextField
              label="Search for product"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px' }
              }}
            />

            <TextField
              select
              label="Filter by area"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAlt color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px' }
              }}
            >
              <MenuItem value="">All Areas</MenuItem>
              {areas.map((area) => (
                <MenuItem key={area} value={area}>
                  {area}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Tabla */}
        <Paper sx={{ p: 2, width: '100%', height: 'calc(100vh - 300px)', minHeight: '500px' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: 900
            }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : (
            <DataGrid
              rows={filteredProducts}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              autoHeight
              sx={{
                 height: '100%',
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'primary.main',
                  color: '#Black',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  borderRadius: '8px 8px 0 0'
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(even)': {
                    backgroundColor: 'action.hover',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.dark'
                  }
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: 'none'
                }
              }}
            />
          )}
        </Paper>

        {/* Diálogo de vista */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md"
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
            display: 'flex',
            alignItems: 'center',
            py: 2
          }}>
            <Inventory sx={{ mr: 1 }} />
            Product Details
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedProduct && (
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Información del Producto
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1.5,
                    mb: 3
                  }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Code</Typography>
                      <Typography fontWeight="bold">{selectedProduct.codigo}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography fontWeight="bold">{selectedProduct.nombre}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography>{selectedProduct.descripcion || 'No Description'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Stock</Typography>
                      <Chip
                        label={selectedProduct.stock}
                        color={
                          selectedProduct.stock > 10 ? "success" : 
                          selectedProduct.stock > 0 ? "warning" : "error"
                        }
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Area</Typography>
                      <Chip
                        label={selectedProduct.area}
                        sx={{ 
                          backgroundColor: 'primary.light',
                          color: 'primary.dark',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Divider orientation="vertical" flexItem />
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Multimedia
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Product Image</Typography>
                      <Avatar 
                        src={selectedProduct.imagen} 
                        variant="rounded" 
                        sx={{ 
                          width: 140, 
                          height: 140,
                          mx: 'auto',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>QR Code</Typography>
                      <Avatar 
                        src={selectedProduct.qrImagen} 
                        variant="square" 
                        sx={{ 
                          width: 140, 
                          height: 140,
                          mx: 'auto',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setOpenViewDialog(false)}
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

        {/* Diálogo de edición */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
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
            display: 'flex',
            alignItems: 'center',
            py: 2
          }}>
            <Edit sx={{ mr: 1 }} />
            Edit Product
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Code"
                value={editValues.codigo}
                fullWidth
                disabled
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
              
              <TextField
                label="Name"
                value={editValues.nombre}
                onChange={(e) => handleEditChange('Name', e.target.value)}
                fullWidth
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
              
              <TextField
                label="Description"
                value={editValues.descripcion}
                onChange={(e) => handleEditChange('Description', e.target.value)}
                fullWidth
                multiline
                rows={3}
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
              
              <TextField
                select
                label="Area"
                value={editValues.area}
                onChange={(e) => handleEditChange('Area', e.target.value)}
                fullWidth
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              >
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setOpenEditDialog(false)}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
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
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de contraseña */}
        <Dialog 
          open={passwordDialogOpen} 
          onClose={() => setPasswordDialogOpen(false)}
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
            display: 'flex',
            alignItems: 'center',
            py: 2
          }}>
            <Lock sx={{ mr: 1 }} />
            Password Please
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              label="Password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              fullWidth
              autoFocus
              InputProps={{
                sx: { borderRadius: '12px' }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setPasswordDialogOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={ejecutarAccionConContraseña} 
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
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default ProductList;