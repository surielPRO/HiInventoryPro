import { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Avatar, 
  Dialog, 
  DialogTitle, 
  DialogActions, 
  Button,
  Typography,
  Badge
} from '@mui/material';
import { Notifications, Menu, Logout } from '@mui/icons-material';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { DRAWER_WIDTH } from '../constants';

const Navbar = ({ handleDrawerToggle }) => {
  const [userInitial, setUserInitial] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      setUserInitial(user.email.charAt(0).toUpperCase());
    }
  }, []);

  const handleLogoutClick = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const confirmLogout = () => {
    signOut(auth)
      .then(() => console.log("Sesión cerrada"))
      .catch((error) => console.error("Error al cerrar sesión:", error));
    setOpenDialog(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(111% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          backgroundColor: '#ffffff',
          color: '#0056b3',
          boxShadow: '0 2px 10px rgba(0, 86, 179, 0.1)',
          borderBottom: '1px solid rgba(0, 86, 179, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 15px rgba(0, 86, 179, 0.15)'
          }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: '#0056b3'
              }}
            >
              <Menu />
            </IconButton>
            <Typography 
  variant="h6" 
  noWrap 
  component="div"
  sx={{
    fontWeight: 600,
    background: 'linear-gradient(90deg,rgb(255, 187, 0),rgb(255, 123, 0),rgb(255, 115, 0))',
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'moveGradient 6s ease infinite'
  }}
>
Phrase of the day: With enthusiasm and humor, we always give our best!
</Typography>
<style>
{`
  @keyframes moveGradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`}
</style>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" sx={{ color: '#0056b3' }}>
              <Badge badgeContent={8} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Avatar 
              sx={{ 
                bgcolor: '#ff6d00',
                color: 'white',
                fontWeight: 'bold',
                width: 36, 
                height: 36,
                boxShadow: '0 2px 8px rgba(255, 109, 0, 0.3)'
              }}
            >
              {userInitial}
            </Avatar>

            <IconButton 
              onClick={handleLogoutClick}
              sx={{
                color: '#ff6d00',
                '&:hover': {
                  backgroundColor: 'rgba(255, 109, 0, 0.1)'
                }
              }}
            >
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '20px',
            minWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#0056b3' }}>
          Confirmar cierre de sesión
        </DialogTitle>
        
        <Typography variant="body1" sx={{ px: 3, pb: 2 }}>
          ¿Estás seguro que deseas cerrar tu sesión?
        </Typography>

        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: '#0056b3',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(0, 86, 179, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmLogout} 
            variant="contained"
            sx={{
              backgroundColor: '#ff6d00',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#e65100'
              }
            }}
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;