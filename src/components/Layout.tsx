import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, RestaurantMenu, Kitchen } from '@mui/icons-material';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab should be active based on the URL
  const getNavValue = () => {
    if (location.pathname.startsWith('/meals')) return 1;
    if (location.pathname.startsWith('/ingredients')) return 2;
    return 0; // Default to Planner
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      {/* The Outlet is where your nested route components (DayPlanner, etc.) will render */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 7 }}>
        <Outlet />
      </Box>

      {/* Fixed Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={4}>
        <BottomNavigation
          showLabels
          value={getNavValue()}
          onChange={(_, newValue) => {
            if (newValue === 0) navigate('/');
            if (newValue === 1) navigate('/meals');
            if (newValue === 2) navigate('/ingredients');
          }}
          sx={{ height: 64 }}
        >
          <BottomNavigationAction label="Planner" icon={<Home />} />
          <BottomNavigationAction label="Meals" icon={<RestaurantMenu />} />
          <BottomNavigationAction label="Ingredients" icon={<Kitchen />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}