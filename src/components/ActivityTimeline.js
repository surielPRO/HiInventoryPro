import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { FiberManualRecord as DotIcon } from '@mui/icons-material';

const activities = [
  { time: '5 min ago', action: 'New product added', user: 'Admin' },
  { time: '1 hour ago', action: 'Actualización de stock', user: 'Juan Pérez' },
  { time: '3 hours ago', action: 'Reporte generado', user: 'María García' },
  { time: 'Yesterday', action: 'Inventario completado', user: 'Admin' }
];

const ActivityTimeline = () => {
  return (
    <List sx={{ width: '100%' }}>
      {activities.map((activity, index) => (
        <ListItem key={index} sx={{ px: 0 }}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <DotIcon color="primary" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight="500">
                {activity.action}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.user}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ActivityTimeline;