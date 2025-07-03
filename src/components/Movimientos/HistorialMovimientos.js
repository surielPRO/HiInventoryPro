import React, { useState, useEffect } from "react";
import {
  collection, getDocs, query, where, doc, getDoc, orderBy
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, InputAdornment, Avatar,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, IconButton, Tooltip, Divider
} from "@mui/material";
import {
  Search, Inventory, Info, PictureAsPdf, FileDownload,
  FilterAlt, Refresh, Close, Timeline
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ThemeProvider } from "@mui/material/styles";
import vipTheme from "../../themes/vipTheme";

const HistorialMovimientos = () => {

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [movimientos, setMovimientos] = useState([]);
  const [productosData, setProductosData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(today.toISOString().split('T')[0]);
  const [filtroFechaFin, setFiltroFechaFin] = useState(tomorrow.toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    cargarMovimientos();
  }, [filtroNombre, filtroFechaInicio, filtroFechaFin]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));

      if (filtroNombre) {
        q = query(q, where("productoNombre", ">=", filtroNombre));
      }

      // Convertir strings de fecha a objetos Date
      const fechaInicio = new Date(filtroFechaInicio);
      const fechaFin = new Date(filtroFechaFin);
      
      q = query(
        q,
        where("fecha", ">=", fechaInicio),
        where("fecha", "<", fechaFin)
      );

      const snapshot = await getDocs(q);
      const movimientosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMovimientos(movimientosData);
      await cargarDatosProductos(movimientosData);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosProductos = async (movimientos) => {
    const productosIds = [...new Set(movimientos.map((mov) => mov.productoId))];
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

  const exportarExcel = () => {
    const data = movimientos.map((mov) => {
      const producto = productosData[mov.productoId] || {};
      return {
        Producto: mov.productoNombre,
        Código: producto.codigo || "Sin código",
        Tipo: mov.tipo.toUpperCase(),
        Cantidad: mov.cantidad,
        "Stock Actual": producto.stock ?? "N/A",
        Fecha: mov.fecha?.toDate().toLocaleString("es-ES"),
        Motivo: mov.motivo || "-",
        Usuario: mov.numeroEmpleado || "Desconocido",
      };
    });

    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Historial");
    const buffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `HistorialMovimientos_${Date.now()}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Historial de Movimientos", 14, 15);

    const data = movimientos.map((mov) => {
      const producto = productosData[mov.productoId] || {};
      return [
        mov.productoNombre,
        producto.codigo || "Sin código",
        mov.tipo.toUpperCase(),
        mov.cantidad,
        producto.stock ?? "N/A",
        mov.fecha?.toDate().toLocaleString("es-ES"),
        mov.motivo || "-",
        mov.numeroEmpleado || "Desconocido",
      ];
    });

    autoTable(doc, {
      head: [["Producto", "Código", "Tipo", "Cantidad", "Stock", "Fecha", "Motivo", "Usuario"]],
      body: data,
      startY: 20,
    });

    doc.save(`HistorialMovimientos_${Date.now()}.pdf`);
  };

  const resetFilters = () => {
    setFiltroNombre("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
  };

  return (
    <ThemeProvider theme={vipTheme}>
      <Box sx={{ 
        p: 3, 
        backgroundColor: "background.default", 
        minHeight: "100vh",
        background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e8ff 100%)'
      }}>
        {/* Encabezado VIP */}
        <Box sx={{ 
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
              Historial de Movimientos VIP
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Registro completo de todas las transacciones
            </Typography>
          </Box>
          
          <Box>
            <Tooltip title="Actualizar datos">
              <IconButton 
                color="inherit" 
                onClick={cargarMovimientos}
                sx={{ mr: 1 }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="secondary"
              startIcon={showFilters ? <Close /> : <FilterAlt />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </Box>
        </Box>

        {/* Filtros VIP */}
        {showFilters && (
          <Paper elevation={3} sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 86, 179, 0.1)'
          }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
                  sx: { borderRadius: '12px' }
                }}
                sx={{ flex: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, flex: 3, alignItems: 'center' }}>
                <TextField
                  label="Fecha inicio"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Fecha fin"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  sx={{ flex: 1 }}
                />
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Close />}
                  onClick={resetFilters}
                  sx={{ 
                    borderRadius: '12px',
                    px: 3,
                    py: 1
                  }}
                >
                  Limpiar
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Acciones VIP */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownload />}
            onClick={exportarExcel}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #00c853 0%, #009624 100%)',
              boxShadow: '0 4px 6px rgba(0, 200, 83, 0.2)'
            }}
          >
            Exportar Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdf />}
            onClick={exportarPDF}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
              boxShadow: '0 4px 6px rgba(0, 86, 179, 0.2)'
            }}
          >
            Exportar PDF
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            height: "300px"
          }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            elevation={3}
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 86, 179, 0.1)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead sx={{ 
                backgroundColor: 'primary.main',
                '& th': { 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.95rem'
                }
              }}>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Imagen</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Tipo</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientos.map((mov) => {
                  const producto = productosData[mov.productoId] || {};
                  return (
                    <TableRow 
                      key={mov.id} 
                      hover
                      sx={{ 
                        '&:nth-of-type(even)': { 
                          backgroundColor: 'action.hover' 
                        },
                        '&:last-child td': { 
                          borderBottom: 0 
                        }
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="600">{mov.productoNombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {producto.codigo || "Sin código"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={producto.imagen}
                          variant="rounded"
                          sx={{ 
                            width: 56, 
                            height: 56,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={producto.stock ?? "N/A"}
                          color={producto.stock > 5 ? "success" : producto.stock > 0 ? "warning" : "error"}
                          variant="outlined"
                          sx={{ 
                            fontWeight: 'bold',
                            minWidth: 60
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={mov.tipo.toUpperCase()}
                          color={mov.tipo === "entrada" ? "success" : "error"}
                          sx={{ 
                            fontWeight: "bold",
                            minWidth: 80
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          fontWeight="bold" 
                          color={mov.tipo === "entrada" ? "success.main" : "error.main"}
                        >
                          {mov.tipo === "entrada" ? "+" : "-"}{mov.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {mov.fecha?.toDate().toLocaleDateString("es-ES", {
                          day: "2-digit", 
                          month: "2-digit", 
                          year: "numeric",
                          hour: "2-digit", 
                          minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          startIcon={<Info />}
                          onClick={() => handleVerDetalles(mov)}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600
                          }}
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

        {/* Diálogo Detalles VIP */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
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
            Detalles del Movimiento
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedMovimiento && (
              <Box sx={{ display: "flex", gap: 4 }}>
                {/* Sección Producto */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Inventory sx={{ mr: 1 }} />
                    Información del Producto
                  </Typography>
                  
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    mb: 3,
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Avatar
                      src={productosData[selectedMovimiento.productoId]?.imagen}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mr: 3,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedMovimiento.productoNombre}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Código:</strong> {productosData[selectedMovimiento.productoId]?.codigo || "N/A"}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography sx={{ mr: 1 }}><strong>Stock actual:</strong></Typography>
                        <Chip
                          label={productosData[selectedMovimiento.productoId]?.stock ?? "N/A"}
                          color={
                            productosData[selectedMovimiento.productoId]?.stock > 5 ? "success" : 
                            productosData[selectedMovimiento.productoId]?.stock > 0 ? "warning" : "error"
                          }
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Typography sx={{ mt: 2 }}>
                    <strong>Descripción:</strong>{" "}
                    {productosData[selectedMovimiento.productoId]?.descripcion || "Sin descripción"}
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Sección Movimiento */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Timeline sx={{ mr: 1 }} />
                    Detalles del Movimiento
                  </Typography>
                  
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography><strong>Tipo:</strong></Typography>
                      <Chip
                        label={selectedMovimiento.tipo.toUpperCase()}
                        color={selectedMovimiento.tipo === "entrada" ? "success" : "error"}
                        sx={{ 
                          fontWeight: "bold",
                          fontSize: '0.9rem',
                          height: 28,
                          mt: 1
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography><strong>Cantidad:</strong></Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: selectedMovimiento.tipo === "entrada" ? "success.main" : "error.main",
                          fontWeight: 'bold'
                        }}
                      >
                        {selectedMovimiento.tipo === "entrada" ? "+" : "-"}{selectedMovimiento.cantidad}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography><strong>Fecha y hora:</strong></Typography>
                      <Typography>
                        {selectedMovimiento.fecha?.toDate().toLocaleString("es-ES", {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography><strong>Motivo:</strong></Typography>
                      <Typography sx={{ 
                        fontStyle: selectedMovimiento.motivo ? 'normal' : 'italic',
                        color: selectedMovimiento.motivo ? 'text.primary' : 'text.secondary'
                      }}>
                        {selectedMovimiento.motivo || "No especificado"}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography><strong>Registrado por:</strong></Typography>
                      <Typography>
                        {selectedMovimiento.numeroEmpleado || "Usuario desconocido"}
                      </Typography>
                    </Box>
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
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default HistorialMovimientos;