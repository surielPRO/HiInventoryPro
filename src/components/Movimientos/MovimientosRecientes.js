import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta según tu archivo firebase.js

const MovimientosRecientes = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Consulta movimientos en la última hora
        const movimientosRef = collection(db, 'movimientos');
        const q = query(
          movimientosRef,
          where('fecha', '>=', Timestamp.fromDate(oneHourAgo)),
          orderBy('fecha', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);

        // Para cada movimiento, traer el nombre del producto desde colección 'productos'
        const movsConProducto = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const movData = doc.data();

            // Obtener producto por ID
            let nombreProducto = 'Desconocido';
            if (movData.productoId) {
              try {
                const productoDoc = await getDocs(collection(db, 'productos'));
                const prodSnap = await getDocs(query(collection(db, 'productos'), where('__name__', '==', movData.productoId)));
                if (!prodSnap.empty) {
                  nombreProducto = prodSnap.docs[0].data().nombre || 'Desconocido';
                }
              } catch {
                nombreProducto = 'Desconocido';
              }
            }

            return {
              id: doc.id,
              tipo: movData.tipo,
              cantidad: movData.cantidad,
              fecha: movData.fecha,
              productoNombre: nombreProducto,
            };
          })
        );

        setMovimientos(movsConProducto);
      } catch (error) {
        console.error('Error cargando movimientos:', error);
      }
      setLoading(false);
    };

    fetchMovimientos();
  }, []);

  if (loading) return <Typography align="center">Cargando...</Typography>;

  if (movimientos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center">
        No hay movimientos en la última hora.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 260, borderRadius: '12px' }}>
      <Table stickyHeader size="small" aria-label="movimientos recientes">
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Cantidad</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {movimientos.map(({ id, productoNombre, tipo, cantidad }) => (
            <TableRow key={id}>
              <TableCell>{productoNombre}</TableCell>
              <TableCell>{tipo}</TableCell>
              <TableCell>{cantidad}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MovimientosRecientes;
