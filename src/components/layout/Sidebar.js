import { Box, Drawer, Toolbar, Typography, Divider, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Inventory, SwapHoriz, Assessment, Settings, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; 

import { DRAWER_WIDTH } from '../constants';  // ajusta la ruta según tu estructura

const Sidebar = () => {
  const navigate = useNavigate(); 

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Productos', icon: <Inventory />, path: '/productos' },
    { text: 'Movimientos', icon: <SwapHoriz />, path: '/movimientos/nuevo' },
    { text: 'Reportes', icon: <Assessment />, path: '/reportes' },
   /* { text: 'Usuarios', icon: <People />, path: '/usuarios' },*/
    /*{ text: 'Configuración', icon: <Settings />, path: '/configuracion' },*/
  ];

  return (
    <Box
      component="nav"
      sx={{ width: DRAWER_WIDTH, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="permanent"
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 'none',
            bgcolor: 'background.paper'
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            <Box component="span" color=" #009A9D">HISENSE</Box> INVENTORY
          </Typography>
        </Toolbar>

        <Divider />

        <List>
          {menuItems.map((item) => (
            <ListItemButton key={item.text} onClick={() => navigate(item.path)}>
              <ListItemIcon sx={{ color: ' #009A9D' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
