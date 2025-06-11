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
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import { 
  DateRange, 
  PictureAsPdf, 
  GridOn,
  Refresh,
  Inventory,
  Warning,
  CheckCircle
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

const db = getFirestore(app);

const ReportesPage = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filter, setFilter] = useState({
    rango: 'mes', // 'dia', 'semana', 'mes', 'anio', 'personalizado'
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fechaFin: new Date(),
    estado: 'todos', // 'todos', 'stock_minimo', 'sin_movimientos'
    area: 'todos' // 'todos', 'quimicos', 'almacen'
  });

  const generarReporte = async () => {
    setLoading(true);
    try {
      let fechaInicio = new Date(filter.fechaInicio);
      let fechaFin = new Date(filter.fechaFin);

      // Ajustar fechas según el rango seleccionado
      switch(filter.rango) {
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
          // Personalizado - usar fechas como están
          break;
      }

      // Construir consultas con filtros
      let productosQuery = collection(db, 'productos');
      let movimientosQuery = query(
        collection(db, 'movimientos'),
        where('fecha', '>=', fechaInicio),
        where('fecha', '<=', fechaFin)
      );

      // Aplicar filtro de área si no es 'todos'
      if (filter.area !== 'todos') {
        productosQuery = query(productosQuery, where('area', '==', filter.area));
        movimientosQuery = query(movimientosQuery, where('area', '==', filter.area));
      }

      const [productosSnapshot, movimientosSnapshot] = await Promise.all([
        getDocs(productosQuery),
        getDocs(movimientosQuery)
      ]);

      // Procesar datos
      const productosData = productosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const movimientosData = movimientosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aplicar filtros de estado
      let filteredData = productosData.map(producto => {
        const movimientosProducto = movimientosData.filter(
          mov => mov.productoId === producto.id
        );
        
        const entradas = movimientosProducto
          .filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + Number(m.cantidad), 0);
          
        const salidas = movimientosProducto
          .filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + Number(m.cantidad), 0);

        return {
          ...producto,
          movimientos: movimientosProducto,
          entradas,
          salidas,
          diferencia: entradas - salidas
        };
      });

      if (filter.estado === 'stock_minimo') {
        filteredData = filteredData.filter(
          p => p.stock < (p.stockMinimo || 5)
        );
      } else if (filter.estado === 'sin_movimientos') {
        filteredData = filteredData.filter(
          p => p.movimientos.length === 0
        );
      }

      setReportData(filteredData);
    } catch (error) {
      console.error("Error generando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const title = `Reporte de Inventario - ${new Date().toLocaleDateString()}`;
    
    // Encabezado
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    
    // Datos para la tabla
    const headers = [
      'Producto', 
      'Código', 
      'Área',
      'Stock', 
      'Mínimo', 
      'Entradas', 
      'Salidas',
      'Diferencia',
      'Estado'
    ];
    
    const data = reportData.map(item => [
      item.nombre,
      item.codigo || 'N/A',
      item.area === 'quimicos' ? 'Químicos' : 'Almacén',
      item.stock,
      item.stockMinimo || 'N/A',
      item.entradas,
      item.salidas,
      item.diferencia,
      item.stock < (item.stockMinimo || 5) ? 'Bajo stock' : 
      item.movimientos.length === 0 ? 'Sin movimientos' : 'Normal'
    ]);

    // Generar tabla
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 25,
      styles: {
        fontSize: 8,
        cellPadding: 1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      }
    });

    doc.save(`reporte_inventario_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reportData.map(item => ({
        'Producto': item.nombre,
        'Código': item.codigo || 'N/A',
        'Área': item.area === 'quimicos' ? 'Químicos' : 'Almacén',
        'Stock Actual': item.stock,
        'Stock Mínimo': item.stockMinimo || 'N/A',
        'Entradas': item.entradas,
        'Salidas': item.salidas,
        'Diferencia': item.diferencia,
        'Estado': item.stock < (item.stockMinimo || 5) ? 'Bajo stock' : 
                 item.movimientos.length === 0 ? 'Sin movimientos' : 'Normal',
        'Imagen': item.imagen || 'No disponible'
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `reporte_inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  useEffect(() => {
    generarReporte();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ p: 3 }}>
        <Typography color='white' textAlign={'center'} variant="h3" gutterBottom sx={{ mb: 3 }}>
          <DateRange sx={{ verticalAlign: 'middle', mr: 1 }} />
          Reportes de Inventario
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Rango de fecha</InputLabel>
                <Select
                  value={filter.rango}
                  onChange={(e) => setFilter({...filter, rango: e.target.value})}
                  label="Rango de fecha"
                >
                  <MenuItem value="dia">Día actual</MenuItem>
                  <MenuItem value="semana">Semana actual</MenuItem>
                  <MenuItem value="mes">Mes actual</MenuItem>
                  <MenuItem value="anio">Año actual</MenuItem>
                  <MenuItem value="personalizado">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {filter.rango === 'personalizado' && (
              <>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Fecha inicio"
                    value={filter.fechaInicio}
                    onChange={(newValue) => setFilter({...filter, fechaInicio: newValue})}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Fecha fin"
                    value={filter.fechaFin}
                    onChange={(newValue) => setFilter({...filter, fechaFin: newValue})}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={filter.fechaInicio}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filter.estado}
                  onChange={(e) => setFilter({...filter, estado: e.target.value})}
                  label="Estado"
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="stock_minimo">Stock mínimo</MenuItem>
                  <MenuItem value="sin_movimientos">Sin movimientos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={filter.area}
                  onChange={(e) => setFilter({...filter, area: e.target.value})}
                  label="Área"
                >
                  <MenuItem value="todos">Todas</MenuItem>
                  <MenuItem value="quimicos">Químicos</MenuItem>
                  <MenuItem value="almacen">Almacén</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                onClick={generarReporte}
                startIcon={<Refresh />}
                fullWidth
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Resumen y exportación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="subtitle1">
            Mostrando {reportData.length} productos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />}
              onClick={exportarPDF}
              disabled={reportData.length === 0 || loading}
            >
              PDF
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<GridOn />}
              onClick={exportarExcel}
              disabled={reportData.length === 0 || loading}
            >
              Excel
            </Button>
          </Box>
        </Box>

        {/* Resultados */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : reportData.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">No se encontraron resultados</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Prueba ajustando los filtros de búsqueda
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Imagen</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Área</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mínimo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Entradas</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Salidas</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Diferencia</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((producto) => (
                  <TableRow key={producto.id} hover>
                    <TableCell>
                      <Avatar 
                        src={producto.imagen} 
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        {!producto.imagen && <Inventory />}
                      </Avatar>
                    </TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.codigo || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={producto.area === 'quimicos' ? 'Químicos' : 'Almacén'} 
                        color={producto.area === 'quimicos' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell>{producto.stockMinimo || 'N/A'}</TableCell>
                    <TableCell>{producto.entradas}</TableCell>
                    <TableCell>{producto.salidas}</TableCell>
                    <TableCell>
                      <Typography color={producto.diferencia >= 0 ? 'success.main' : 'error.main'}>
                        {producto.diferencia}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {producto.stock < (producto.stockMinimo || 5) ? (
                        <Chip 
                          icon={<Warning />}
                          label="Bajo stock" 
                          color="warning"
                          size="small"
                        />
                      ) : producto.movimientos.length === 0 ? (
                        <Chip 
                          icon={<Inventory />}
                          label="Sin movimientos" 
                          color="default"
                          size="small"
                        />
                      ) : (
                        <Chip 
                          icon={<CheckCircle />}
                          label="Normal" 
                          color="success"
                          size="small"
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
    </LocalizationProvider>
  );
};

export default ReportesPage;