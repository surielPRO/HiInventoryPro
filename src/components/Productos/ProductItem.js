import { Card, CardContent, Typography, CardMedia, Button } from '@mui/material';

export default function ProductItem({ product }) {
  return (
    <Card style={{ marginBottom: '15px' }}>
      <CardContent style={{ display: 'flex', gap: '20px' }}>
        {product.imagen && (
          <CardMedia
            component="img"
            image={product.imagen}
            alt={product.nombre}
            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
          />
        )}
        
        <div>
          <Typography variant="h6">{product.nombre}</Typography>
          <Typography>Código: {product.codigo}</Typography>
          <Typography style={{ marginTop: '10px' }}>
            {product.descripcion}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}