import { Box, Drawer, Toolbar, Typography, Divider, List, ListItemButton, ListItemIcon, ListItemText, styled } from '@mui/material';
import { Inventory, SwapHoriz, Assessment } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from '../constants';

// Componente estilizado para los items del menú
const StyledListItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: 12,
  margin: '4px 8px',
  padding: '8px 12px',
  minHeight: 48,
  justifyContent: 'center',
  backgroundColor: selected ? 'rgba(0, 154, 157, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(0, 154, 157, 0.08)',
  },
  transition: theme.transitions.create(['background-color', 'width'], {
    duration: theme.transitions.duration.shortest,
  }),
  overflow: 'hidden',
}));

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Products', icon: <Inventory />, path: '/productos' },
    { text: 'Movements', icon: <SwapHoriz />, path: '/movimientos/nuevo' },
    { text: 'Reports', icon: <Assessment />, path: '/reportes' },
  ];

  return (
    <Box
      component="nav"
      sx={{
        position: 'relative',
        width: { sm: COLLAPSED_DRAWER_WIDTH },
        flexShrink: 0,
        '&:hover': {
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
          },
        },
        transition: 'width 0.2s ease',
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: COLLAPSED_DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 'none',
            bgcolor: 'background.paper',
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
            overflowX: 'hidden',
            '&:hover': {
              width: DRAWER_WIDTH,
              '& .menu-text': {
                opacity: 1,
                display: 'block',
              },
              '& .logo-text': {
                opacity: 1,
              },
            },
            transition: 'width 0.2s ease',
          },
        }}
        open
      >
        <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />

        {/* Menú de navegación */}
        <List sx={{ px: 0.15, py: 2 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname.includes(item.path);
            return (
              <StyledListItem 
                key={item.text} 
                onClick={() => navigate(item.path)}
                selected={isSelected}
                sx={{
                  justifyContent: 'flex-start',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 20,
                  color: isSelected ? '#009A9D' : 'text.secondary',
                  justifyContent: 'center',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  className="menu-text"
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'text.primary' : 'text.secondary',
                    fontSize: '0.9rem',
                  }}
                  sx={{
                    opacity: 0,
                    display: 'none',
                    transition: 'opacity 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                />
              </StyledListItem>
            );
          })}
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;