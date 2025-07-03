// src/components/charts/StockChart.js
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function StockChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const productosSnapshot = await getDocs(collection(db, 'productos'));
        const productos = productosSnapshot.docs.map(doc => doc.data());

        const stockPorArea = {};

        productos.forEach((producto) => {
          const area = producto.area || 'Not Area';
          const stock = Number(producto.stock) || 0;

          stockPorArea[area] = (stockPorArea[area] || 0) + stock;
        });

        const labels = Object.keys(stockPorArea);
        const values = Object.values(stockPorArea);

        setData({
          labels,
          datasets: [
            {
              label: 'Total Stock',
              data: values,
              backgroundColor: [
                '#3f51b5', '#4caf50', '#ff9800', '#f44336',
                '#00bcd4', '#9c27b0', '#607d8b', '#795548'
              ]
            }
          ]
        });
      } catch (error) {
        console.error("Error Load Products:", error);
      }
    };

    fetchStockData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false }
    }
  };

  if (!data) {
    return <p>Cargando gráfico de stock por área...</p>;
  }

  return <Bar data={data} options={options} />;
}

export default StockChart;