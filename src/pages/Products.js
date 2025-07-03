import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Button, Typography } from '@mui/material';
import { Add, List } from '@mui/icons-material';

import ProductList from '../components/Productos/ProductList';
import AddProduct from '../components/Productos/AddProduct';

export default function Products() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (location.state?.showAddForm) {
      setShowForm(true);
    }
  }, [location.state]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      
      
      <Button
        variant="contained"
        startIcon={showForm ? <List /> : <Add />}
        onClick={() => setShowForm(!showForm)}
        sx={{ mb: 1 }}
      >
        {showForm ? 'Show List' : 'Add Product'}
      </Button>

      {showForm ? (
        <AddProduct onCancel={() => setShowForm(false)} />
      ) : (
        <ProductList />
      )}
    </Container>
  );
}
