// AppLayout.js
import { Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export const DRAWER_WIDTH = 240;

const AppLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: `${DRAWER_WIDTH}px` },
          transition: 'margin 0.3s ease',
        }}
      >
        <Outlet />
        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;
