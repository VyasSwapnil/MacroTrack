import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, 
  IconButton, Fab, Paper, CircularProgress, Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

import AddDailyMealDialog from '../components/AddDailyMealDialog';
import ViewMealDialog from '../components/ViewMealDialog';

// Import our new service
import { fetchDailyLogs, saveDailyLogs, deleteDailyLog } from '../services/dailyLogsService';

export default function DayPlanner() {
  const today = new Date();
  
  // Visual date for the header (e.g., "8 Jun")
  const formattedDate = today.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short' 
  });
  
  // Database key (e.g., "2026-06-08"). We pad with zeros so the format is always stable YYYY-MM-DD
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [loggedMeals, setLoggedMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMealForView, setSelectedMealForView] = useState(null);

  // Fetch today's logged meals when the component loads
  useEffect(() => {
    const loadTodayLogs = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDailyLogs(dateKey);
        setLoggedMeals(data);
        setError(null);
      } catch (err) {
        setError('Failed to load today\'s planner. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayLogs();
  }, [dateKey]);

  const totals = useMemo(() => {
    return loggedMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
      }),
      { calories: 0, protein: 0 }
    );
  }, [loggedMeals]);

  // Updated to make the API call when meals are selected
  const handleAddMeals = async (selectedMeals) => {
    const newLogs = selectedMeals.map((meal) => ({
      ...meal,
      // Create a highly unique ID so you can log the same meal twice in one day without clashes
      logId: `${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    }));
    
    const updatedList = [...loggedMeals, ...newLogs];
    
    try {
      // Pass the dateKey and the combined array to Firebase
      await saveDailyLogs(dateKey, updatedList);
      setLoggedMeals(updatedList);
    } catch (err) {
      alert("Failed to save to your daily planner.");
    }
  };

  // Updated to make the API call when a meal is deleted
  const handleDeleteLog = async (logIdToRemove) => {
    try {
      // Pass the dateKey and the specific log ID to delete it from Firebase
      await deleteDailyLog(dateKey, logIdToRemove);
      setLoggedMeals((prev) => prev.filter((meal) => meal.logId !== logIdToRemove));
    } catch (err) {
      alert("Failed to delete log.");
    }
  };

  const handleViewMeal = (meal) => {
    setSelectedMealForView(meal);
    setIsViewDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        Today, {formattedDate}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Total Consumed
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Box>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: '700' }}>
                {parseFloat(totals.calories.toFixed(1))} <Typography component="span" variant="h6" color="text.secondary">kcal</Typography>
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Protein</Typography>
              <Typography variant="h5" sx={{ fontWeight: '700' }}>
                {parseFloat(totals.protein.toFixed(1))}g
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Logged Meals</Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {loggedMeals.map((meal) => (
              <ListItem 
                button 
                key={meal.logId} 
                divider 
                sx={{ py: 1, pr: 1 }}
                onClick={() => handleViewMeal(meal)}
              >
                
                <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mr: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {meal.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <Typography component="span" color="primary.main" fontWeight="bold">
                      {meal.calories} kcal
                    </Typography>
                    {' • '}
                    {meal.protein}g
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <IconButton 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleDeleteLog(meal.logId);
                    }} 
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

              </ListItem>
            ))}

            {loggedMeals.length === 0 && (
              <ListItem sx={{ py: 2 }}>
                <Typography color="text.secondary">
                  No meals logged yet today. Click the + button to add!
                </Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setIsAddDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <AddDailyMealDialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onAdd={handleAddMeals} 
      />

      <ViewMealDialog 
        open={isViewDialogOpen} 
        onClose={() => setIsViewDialogOpen(false)} 
        meal={selectedMealForView}
      />
    </Box>
  );
}