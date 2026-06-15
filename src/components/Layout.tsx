import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Today as TodayIcon, DateRange, RestaurantMenu, Kitchen } from '@mui/icons-material';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab should be active based on the URL
  const getNavValue = () => {
    if (location.pathname.startsWith('/planner')) return 1;
    if (location.pathname.startsWith('/meals')) return 2;
    if (location.pathname.startsWith('/ingredients')) return 3;
    return 0; // Default to Today (/)
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      {/* The Outlet is where your nested route components will render */}
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
            if (newValue === 1) navigate('/planner');
            if (newValue === 2) navigate('/meals');
            if (newValue === 3) navigate('/ingredients');
          }}
          sx={{ height: 64 }}
        >
          <BottomNavigationAction label="Today" icon={<TodayIcon />} />
          <BottomNavigationAction label="Planner" icon={<DateRange />} />
          <BottomNavigationAction label="Meals" icon={<RestaurantMenu />} />
          <BottomNavigationAction label="Ingredients" icon={<Kitchen />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}