import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, Divider, 
  Grid, IconButton, CircularProgress 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CalendarMonth } from '@mui/icons-material';

// Import MUI Date Picker components
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';

import AddDailyMealDialog from '../components/AddDailyMealDialog';
import ViewDayPlanDialog from '../components/ViewDayPlanDialog';
import { fetchAllDailyLogs, saveDailyLogs } from '../services/dailyLogsService';

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [planningQueue, setPlanningQueue] = useState([]); // Dates you are currently drafting
  
  const [allPlans, setAllPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [activeDateForMeal, setActiveDateForMeal] = useState(null);
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewDialogData, setViewDialogData] = useState({ date: null, meals: [] });

  const loadAllPlans = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllDailyLogs();
      setAllPlans(data);
    } catch (error) {
      console.error("Failed to load plans", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllPlans();
  }, []);

  // Filter to show only days that are in the future OR today, and have 'planned' meals
  const upcomingPlannedDays = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const futurePlans = {};
    
    Object.keys(allPlans).forEach(dateKey => {
      if (dateKey >= todayStr) {
        const mealsForDay = Object.values(allPlans[dateKey]);
        // Only include this day if it contains at least one meal marked as 'planned'
        if (mealsForDay.some(m => m.status === 'planned')) {
          futurePlans[dateKey] = mealsForDay;
        }
      }
    });
    
    // Sort dates chronologically
    return Object.keys(futurePlans).sort().map(dateKey => ({
      date: dateKey,
      meals: futurePlans[dateKey]
    }));
  }, [allPlans]);

  // Adds a date from the calendar into your active drafting queue
  const handleQueueDate = () => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    if (!planningQueue.includes(dateStr)) {
      setPlanningQueue(prev => [...prev, dateStr].sort());
    }
  };

  const removeDateFromQueue = (dateStr) => {
    setPlanningQueue(prev => prev.filter(d => d !== dateStr));
  };

  const openMealPickerForDate = (dateStr) => {
    setActiveDateForMeal(dateStr);
    setIsMealDialogOpen(true);
  };

  const handleAddMealsToDay = async (selectedMeals) => {
    if (!activeDateForMeal) return;

    // Inject the predictive tracking fields required for the "Today" page later
    const newLogs = selectedMeals.map((meal) => ({
      ...meal,
      logId: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'planned', 
      plannedCalories: meal.calories,
      plannedProtein: meal.protein,
      actualCalories: 0,
      actualProtein: 0
    }));

    // Get existing meals for this specific date (if any)
    const existingMeals = allPlans[activeDateForMeal] ? Object.values(allPlans[activeDateForMeal]) : [];
    const updatedDailyList = [...existingMeals, ...newLogs];

    try {
      await saveDailyLogs(activeDateForMeal, updatedDailyList);
      await loadAllPlans(); // Refresh the data to update the UI
      setIsMealDialogOpen(false);
      setActiveDateForMeal(null);
    } catch (err) {
      alert("Failed to save plan.");
    }
  };

  const openViewDialog = (date, meals) => {
    setViewDialogData({ date, meals });
    setIsViewDialogOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        
        {/* TOP SECTION: Date Selection & Queue */}
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Create Plan</Typography>
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <DateCalendar 
            value={selectedDate} 
            onChange={(newDate) => setSelectedDate(newDate)} 
            disablePast // Prevents planning for yesterday
          />
          <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              fullWidth 
              startIcon={<AddIcon />}
              onClick={handleQueueDate}
            >
              Start Planning for {selectedDate.format('DD MMM')}
            </Button>
          </Box>
        </Card>

        {/* ACTIVE DRAFTING QUEUE */}
        {planningQueue.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Planning Queue</Typography>
            {planningQueue.map(dateStr => (
              <Card key={dateStr} sx={{ mb: 1, borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Typography fontWeight="bold">{dayjs(dateStr).format('dddd, DD MMM YYYY')}</Typography>
                  <Box>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 1 }}
                      onClick={() => openMealPickerForDate(dateStr)}
                    >
                      + Add Meal
                    </Button>
                    <IconButton size="small" color="error" onClick={() => removeDateFromQueue(dateStr)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* BOTTOM SECTION: Saved Upcoming Plans */}
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Upcoming Plans</Typography>
        
        {isLoading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : upcomingPlannedDays.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            You don't have any meals planned for upcoming days.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {upcomingPlannedDays.map(({ date, meals }) => {
              const cals = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
              const pro = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
              
              return (
                <Grid item xs={12} sm={6} key={date}>
                  <Card 
                    sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                    onClick={() => openViewDialog(date, meals)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1 }} />
                        <Typography fontWeight="bold">
                          {dayjs(date).format('ddd, DD MMM')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {meals.length} {meals.length === 1 ? 'meal' : 'meals'} planned
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">{parseFloat(cals.toFixed(1))} kcal</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">{parseFloat(pro.toFixed(1))}g pro</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Dialogs */}
        <AddDailyMealDialog 
          open={isMealDialogOpen} 
          onClose={() => setIsMealDialogOpen(false)} 
          onAdd={handleAddMealsToDay} 
        />

        <ViewDayPlanDialog 
          open={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          date={viewDialogData.date}
          meals={viewDialogData.meals}
        />

      </Box>
    </LocalizationProvider>
  );
}