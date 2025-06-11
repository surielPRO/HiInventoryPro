import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Badge, Avatar, Dialog, DialogTitle, DialogActions, Button } from '@mui/material';
import { Notifications, Menu, Logout } from '@mui/icons-material';
import { auth } from '../../firebase'; // Ajusta según tu archivo firebase.js
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

  const handleLogoutClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const confirmLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Sesión cerrada");
        // Aquí puedes redirigir si usas react-router, por ejemplo:
        // navigate('/login');
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
    setOpenDialog(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <Menu />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton color="inherit">
            <Badge badgeContent={8} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton sx={{ ml: 2 }}>
            <Avatar>{userInitial}</Avatar>
          </IconButton>

          <IconButton color="error" sx={{ ml: 1 }} onClick={handleLogoutClick}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>¿Estás seguro que deseas cerrar sesión?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmLogout} color="error" variant="contained" autoFocus>
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
