import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const MiniStatisticsCard = ({ icon, title, value, color = 'primary', percentage }) => {
  const colors = {
    primary: '#3f51b5',
    secondary: '#9c27b0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{
          backgroundColor: `${colors[color]}20`,
          color: colors[color],
          p: 1.5,
          borderRadius: '12px',
          mr: 2,
          display: 'flex'
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="600">
            {value}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ 
        mt: 1,
        display: 'block',
        color: percentage.startsWith('+') ? 'success.main' : 'error.main'
      }}>
        {percentage} this month
      </Typography>
    </Paper>
  );
};

export default MiniStatisticsCard;