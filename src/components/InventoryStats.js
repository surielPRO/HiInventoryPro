import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { Inventory, Warning, TrendingUp, TrendingDown } from '@mui/icons-material';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { app } from '../firebase';
import AreaFilter from './AreaFilter';

const db = getFirestore(app);

const InventoryStats = () => {
  const [area, setArea] = useState('todos');
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    monthlyEntries: 0,
    monthlyExits: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Consulta base con filtro de área
        let productsQuery = collection(db, 'productos');
        let movementsQuery = query(
          collection(db, 'movimientos'),
          where('fecha', '>=', getFirstDayOfMonth())
        );

        if (area !== 'todos') {
          productsQuery = query(productsQuery, where('area', '==', area));
          movementsQuery = query(movementsQuery, where('area', '==', area));
        }

        const [productsSnapshot, movementsSnapshot] = await Promise.all([
          getDocs(productsQuery),
          getDocs(movementsQuery)
        ]);

        // Calcular métricas
        let entries = 0;
        let exits = 0;
        let lowStockCount = 0;

        productsSnapshot.forEach(doc => {
          const product = doc.data();
          if (product.stock < (product.stockMinimo || 5)) {
            lowStockCount++;
          }
        });

        movementsSnapshot.forEach(doc => {
          const movement = doc.data();
          if (movement.tipo === 'entrada') {
            entries += Number(movement.cantidad);
          } else {
            exits += Number(movement.cantidad);
          }
        });

        setStats({
          totalProducts: productsSnapshot.size,
          lowStock: lowStockCount,
          monthlyEntries: entries,
          monthlyExits: exits,
          loading: false
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [area]);

  const statItems = [
    { 
      title: 'Productos Totales', 
      value: stats.totalProducts.toLocaleString(), 
      icon: <Inventory />, 
      color: 'success.main' 
    },
    { 
      title: 'Stock Mínimo', 
      value: stats.lowStock, 
      icon: <Warning />, 
      color: 'warning.main',
      subtitle: 'Productos bajo stock mínimo'
    },
    { 
      title: 'Entradas (Mes)', 
      value: stats.monthlyEntries.toLocaleString(), 
      icon: <TrendingUp />, 
      color: 'info.main' 
    },
    { 
      title: 'Salidas (Mes)', 
      value: stats.monthlyExits.toLocaleString(), 
      icon: <TrendingDown />, 
      color: 'error.main' 
    },
  ];

  if (stats.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AreaFilter value={area} onChange={setArea} />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ 
              p: 3,
              borderRadius: '12px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  bgcolor: `${item.color}20`,
                  p: 1.5,
                  borderRadius: '50%',
                  mr: 2
                }}>
                  {React.cloneElement(item.icon, { 
                    sx: { color: item.color, fontSize: '1.8rem' } 
                  })}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {item.value}
                  </Typography>
                  {item.subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default InventoryStats;