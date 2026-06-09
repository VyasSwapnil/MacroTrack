import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, 
  IconButton, Fab, Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AddDailyMealDialog from '../components/AddDailyMealDialog';

export default function DayPlanner() {
  // 1. Dynamic Date Generation
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short' 
  }); // Outputs: "8 Jun"

  // State to hold the meals logged for today
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 2. Dynamic Totals Calculation
  const totals = useMemo(() => {
    return loggedMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
      }),
      { calories: 0, protein: 0 }
    );
  }, [loggedMeals]);

  // Handles receiving the selected meals from the Dialog
  const handleAddMeals = (selectedMeals) => {
    // Generate unique log IDs so we can add the same meal multiple times on different occasions
    const newLogs = selectedMeals.map((meal) => ({
      ...meal,
      logId: Date.now() + Math.random() // Unique identifier for this specific log entry
    }));
    
    setLoggedMeals((prev) => [...prev, ...newLogs]);
  };

  // 5. Handles deleting a meal from today's log
  const handleDeleteLog = (logIdToRemove) => {
    setLoggedMeals((prev) => prev.filter((meal) => meal.logId !== logIdToRemove));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Dynamic Date Header */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        Today, {formattedDate}
      </Typography>

      {/* Simplified Summary Card */}
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
      
      {/* 4. Displaying added meals exactly like the Meals List page */}
      <Paper sx={{ borderRadius: 3 }}>
        <List disablePadding>
          {loggedMeals.map((meal) => (
            <ListItem key={meal.logId} divider sx={{ py: 1, pr: 1 }}>
              
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
                {/* Delete Icon Only */}
                <IconButton 
                  color="error" 
                  onClick={() => handleDeleteLog(meal.logId)} 
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

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setIsDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 3. The Meals Selection Popup */}
      <AddDailyMealDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onAdd={handleAddMeals} 
      />
    </Box>
  );
}