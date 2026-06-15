import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Today as TodayIcon, DateRange, RestaurantMenu, Kitchen, Group } from '@mui/icons-material';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavValue = () => {
    if (location.pathname.startsWith('/planner')) return 1;
    if (location.pathname.startsWith('/meals')) return 2;
    if (location.pathname.startsWith('/ingredients')) return 3;
    if (location.pathname.startsWith('/users')) return 4;
    return 0; // Default to Today
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pb: 7 }}>
        <Outlet />
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={4}>
        <BottomNavigation
          showLabels
          value={getNavValue()}
          onChange={(_, newValue) => {
            if (newValue === 0) navigate('/');
            if (newValue === 1) navigate('/planner');
            if (newValue === 2) navigate('/meals');
            if (newValue === 3) navigate('/ingredients');
            if (newValue === 4) navigate('/users'); // Added this missing line!
          }}
          sx={{ height: 64 }}
        >
          <BottomNavigationAction label="Today" icon={<TodayIcon />} />
          <BottomNavigationAction label="Planner" icon={<DateRange />} />
          <BottomNavigationAction label="Meals" icon={<RestaurantMenu />} />
          <BottomNavigationAction label="Ingredients" icon={<Kitchen />} />
          <BottomNavigationAction label="Users" icon={<Group />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}