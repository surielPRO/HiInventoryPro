import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { Science, Warehouse, Inventory } from '@mui/icons-material';

const AreaFilter = ({ value, onChange }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => newValue && onChange(newValue)}
        aria-label="Área de inventario"
        fullWidth
      >
        <ToggleButton value="todos" aria-label="Todos">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory /> Todos
          </Box>
        </ToggleButton>
        <ToggleButton value="quimicos" aria-label="Químicos">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science /> Químicos
          </Box>
        </ToggleButton>
        <ToggleButton value="almacen" aria-label="Almacén">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warehouse /> Almacén
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default AreaFilter;