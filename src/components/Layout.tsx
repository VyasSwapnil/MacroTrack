import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Paper, BottomNavigation, BottomNavigationAction, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography 
} from '@mui/material';
import { Today as TodayIcon, DateRange, RestaurantMenu, Kitchen, Group } from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Today', path: '/', icon: <TodayIcon /> },
  { label: 'Planner', path: '/planner', icon: <DateRange /> },
  { label: 'Meals', path: '/meals', icon: <RestaurantMenu /> },
  { label: 'Ingredients', path: '/ingredients', icon: <Kitchen /> },
  { label: 'Users', path: '/users', icon: <Group /> },
];

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

  const activeIndex = getNavValue();

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile, row side-by-side on laptop
      bgcolor: '#f8f9fa' 
    }}>
      
      {/* ================= LAPTOP/DESKTOP SIDEBAR ================= */}
      <Box
        component="nav"
        sx={{
          width: 240,
          flexShrink: 0,
          bgcolor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: { xs: 'none', md: 'flex' }, // Visible ONLY on laptops/desktops
          flexDirection: 'column',
          pt: 3
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', px: 3, mb: 4, color: 'primary.main', letterSpacing: '0.5px' }}>
          MacroTrack
        </Typography>

        <List disablePadding sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    px: 2,
                    bgcolor: isActive ? 'primary.light' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.light' : '#f5f5f5',
                    },
                    '& .MuiSvgIcon-root': {
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isActive ? 'bold' : 500 }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: { xs: 0, md: 3 }, // Add extra breathing room on large viewports
        pb: { xs: 9, md: 3 } // Push content above the mobile navigation bar when visible
      }}>
        <Outlet />
      </Box>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          display: { xs: 'block', md: 'none' } // Hidden completely on laptops/desktops
        }} 
        elevation={4}
      >
        <BottomNavigation
          showLabels
          value={activeIndex}
          onChange={(_, newValue) => {
            navigate(NAV_ITEMS[newValue].path);
          }}
          sx={{ height: 64 }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>

    </Box>
  );
}