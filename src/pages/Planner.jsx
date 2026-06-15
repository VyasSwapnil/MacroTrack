import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, Divider, 
  Grid, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TextField, Paper, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CalendarMonth, Person, Group } from '@mui/icons-material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';

import AddDailyMealDialog from '../components/AddDailyMealDialog';
import ViewDayPlanDialog from '../components/ViewDayPlanDialog';
import { fetchAllDailyLogs, saveDailyLogs, deleteDailyLog, updateDailyLogMealStatus } from '../services/dailyLogsService';
import { fetchUsers } from '../services/usersService';

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [planningQueue, setPlanningQueue] = useState([]); 
  
  const [users, setUsers] = useState([]);
  const [allPlans, setAllPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSharedPlan, setIsSharedPlan] = useState(false); 

  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  const [activeQueueItem, setActiveQueueItem] = useState(null); 
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  // NOTE: We added userId to this state object so we know exactly whose meal we are editing
  const [viewDialogData, setViewDialogData] = useState({ date: null, userId: null, userName: null, meals: [] });

  const [editingMeal, setEditingMeal] = useState(null); // Tracks the meal currently being edited

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, plansData] = await Promise.all([fetchUsers(), fetchAllDailyLogs()]);
      setUsers(usersData);
      setAllPlans(plansData);
    } catch (error) {
      console.error("Failed to load planner data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const upcomingPlannedDays = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const plansList = [];
    
    Object.keys(allPlans).forEach(userId => {
      const userObj = users.find(u => u.id === userId);
      const userName = userObj ? userObj.name : 'Unknown User';
      const userDates = allPlans[userId];

      Object.keys(userDates).forEach(dateKey => {
        if (dateKey >= todayStr) {
          const mealsForDay = Object.values(userDates[dateKey]);
          if (mealsForDay.some(m => m.status === 'planned')) {
            plansList.push({ date: dateKey, userId, userName, meals: mealsForDay });
          }
        }
      });
    });
    
    return plansList.sort((a, b) => a.date.localeCompare(b.date) || a.userName.localeCompare(b.userName));
  }, [allPlans, users]);

  const handleOpenUserSelect = () => {
    if (users.length === 0) {
      alert("Please create a user in the Users tab first.");
      return;
    }
    setSelectedUserIds([]);
    setIsSharedPlan(false);
    setIsUserSelectOpen(true);
  };

  const handleQueueDatesForUsers = () => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    let newQueueItems = [];

    if (isSharedPlan && selectedUserIds.length > 1) {
      const userNamesStr = selectedUserIds.map(id => users.find(u => u.id === id)?.name).join(', ');
      newQueueItems.push({ id: `${dateStr}_shared_${selectedUserIds.join('-')}`, dateStr, userIds: selectedUserIds, userNames: userNamesStr });
    } else {
      newQueueItems = selectedUserIds.map(uId => {
        const user = users.find(u => u.id === uId);
        return { id: `${dateStr}_${uId}`, dateStr, userIds: [uId], userNames: user.name };
      });
    }

    setPlanningQueue(prev => {
      const filtered = prev.filter(q => !newQueueItems.some(n => n.id === q.id));
      return [...filtered, ...newQueueItems].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    });
    
    setIsUserSelectOpen(false);
  };

  const removeFromQueue = (queueId) => {
    setPlanningQueue(prev => prev.filter(q => q.id !== queueId));
  };

  const openMealPicker = (queueItem) => {
    setActiveQueueItem(queueItem);
    setIsMealDialogOpen(true);
  };

  const handleAddMealsToDay = async (selectedMeals) => {
    if (!activeQueueItem) return;

    try {
      await Promise.all(activeQueueItem.userIds.map(async (uId) => {
        const newLogs = selectedMeals.map((meal) => ({
          ...meal,
          logId: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'planned', 
          plannedCalories: meal.calories,
          plannedProtein: meal.protein,
          actualCalories: 0,
          actualProtein: 0
        }));

        const existingMeals = allPlans[uId]?.[activeQueueItem.dateStr] 
          ? Object.values(allPlans[uId][activeQueueItem.dateStr]) 
          : [];
          
        const updatedDailyList = [...existingMeals, ...newLogs];
        await saveDailyLogs(uId, activeQueueItem.dateStr, updatedDailyList);
      }));

      await loadData(); 
      setIsMealDialogOpen(false);
      setActiveQueueItem(null);
    } catch (err) {
      alert("Failed to save plan.");
    }
  };

  const handleUserCheckbox = (userId) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  // --- NEW HANDLERS FOR DELETING AND EDITING PLANNED MEALS ---

  const handleDeletePlannedMeal = async (meal) => {
    if (!window.confirm(`Are you sure you want to remove ${meal.name} from this plan?`)) return;
    try {
      await deleteDailyLog(viewDialogData.userId, viewDialogData.date, meal.logId);
      setViewDialogData(prev => ({ ...prev, meals: prev.meals.filter(m => m.logId !== meal.logId) }));
      await loadData();
    } catch (err) { alert("Failed to delete meal."); }
  };

  const handleSaveEditedMeal = async (logId, newCals, newPro, updatedIngredients) => {
    try {
      const updates = { plannedCalories: newCals, plannedProtein: newPro, ingredients: updatedIngredients };
      await updateDailyLogMealStatus(viewDialogData.userId, viewDialogData.date, logId, updates);
      
      setViewDialogData(prev => ({
        ...prev,
        meals: prev.meals.map(m => m.logId === logId ? { ...m, ...updates } : m)
      }));
      
      await loadData();
      setEditingMeal(null);
    } catch (err) { alert("Failed to save edited meal."); }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Create Plan</Typography>
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <DateCalendar value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} disablePast />
          <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleOpenUserSelect}>
              Start Planning for {selectedDate.format('DD MMM')}
            </Button>
          </Box>
        </Card>

        {planningQueue.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Planning Queue</Typography>
            {planningQueue.map(item => (
              <Card key={item.id} sx={{ mb: 1, borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box>
                    <Typography fontWeight="bold">{dayjs(item.dateStr).format('dddd, DD MMM')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {item.userIds.length > 1 ? <Group fontSize="small" sx={{ mr: 0.5 }} /> : <Person fontSize="small" sx={{ mr: 0.5 }} />}
                      {item.userNames}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => openMealPicker(item)}>+ Add Meal</Button>
                    <IconButton size="small" color="error" onClick={() => removeFromQueue(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Upcoming Plans</Typography>
        
        {isLoading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : upcomingPlannedDays.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No upcoming meals planned.</Typography>
        ) : (
          <Grid container spacing={2}>
            {upcomingPlannedDays.map(({ date, userId, userName, meals }) => {
              const cals = meals.reduce((acc, m) => acc + (m.plannedCalories || m.calories || 0), 0);
              const pro = meals.reduce((acc, m) => acc + (m.plannedProtein || m.protein || 0), 0);
              return (
                <Grid item xs={12} sm={6} key={`${date}_${userId}`}>
                  <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => {
                    // Injecting userId into the view dialog data so edits and deletes target the correct profile
                    setViewDialogData({ date, userId, userName, meals });
                    setIsViewDialogOpen(true);
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                          <CalendarMonth fontSize="small" sx={{ mr: 1 }} />
                          <Typography fontWeight="bold">{dayjs(date).format('ddd, DD MMM')}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ bgcolor: 'secondary.main', color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
                          {userName}
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

        <Dialog open={isUserSelectOpen} onClose={() => setIsUserSelectOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 'bold' }}>Who are you planning for?</DialogTitle>
          <DialogContent>
            <FormGroup sx={{ mt: 1 }}>
              {users.map(user => (
                <FormControlLabel key={user.id} control={
                  <Checkbox checked={selectedUserIds.includes(user.id)} onChange={() => handleUserCheckbox(user.id)} />
                } label={user.name} />
              ))}
            </FormGroup>
            {selectedUserIds.length > 1 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={isSharedPlan} onChange={(e) => setIsSharedPlan(e.target.checked)} />}
                  label={<Typography variant="body2" fontWeight="bold">Create the exact same plan for these users</Typography>}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setIsUserSelectOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={handleQueueDatesForUsers} variant="contained" color="primary" disabled={selectedUserIds.length === 0}>
              Add to Queue
            </Button>
          </DialogActions>
        </Dialog>

        <AddDailyMealDialog open={isMealDialogOpen} onClose={() => setIsMealDialogOpen(false)} onAdd={handleAddMealsToDay} />
        
        {/* Updated props sent to the View Dialog */}
        <ViewDayPlanDialog 
          open={isViewDialogOpen} 
          onClose={() => setIsViewDialogOpen(false)} 
          date={viewDialogData.date} 
          meals={viewDialogData.meals} 
          onEdit={(meal) => setEditingMeal(meal)}
          onDelete={handleDeletePlannedMeal}
        />

        {editingMeal && (
          <EditPlannedMealDialog 
            meal={editingMeal} 
            onClose={() => setEditingMeal(null)} 
            onSave={handleSaveEditedMeal} 
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}

// --- Inline Component for Editing a Planned Meal's Quantities ---
function EditPlannedMealDialog({ meal, onClose, onSave }) {
  const [ingredients, setIngredients] = useState(meal.ingredients || []);
  
  const handleQtyChange = (id, newQty) => setIngredients(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  
  const getCalculatedMacros = (item) => {
    const qty = parseFloat(item.quantity) || 0; 
    const multiplier = item.measurementType === 'count' ? qty : (qty / 100);
    return { calories: parseFloat((item.calories * multiplier).toFixed(1)), protein: parseFloat((item.protein * multiplier).toFixed(1)) };
  };

  const handleSave = () => {
    let totalCals = 0; let totalPro = 0;
    ingredients.forEach(item => { const macros = getCalculatedMacros(item); totalCals += macros.calories; totalPro += macros.protein; });
    onSave(meal.logId, parseFloat(totalCals.toFixed(1)), parseFloat(totalPro.toFixed(1)), ingredients);
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Plan: {meal.name}</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Ingredient</TableCell>
                <TableCell align="center" sx={{ width: '130px' }}>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients.map(item => {
                const isCount = item.measurementType === 'count';
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">
                      <TextField 
                        variant="outlined" 
                        size="small"
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => handleQtyChange(item.id, e.target.value)} 
                        InputProps={{ 
                          inputProps: { min: 0, style: { textAlign: 'center', padding: '6px' } },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight="bold" color={isCount ? 'secondary.main' : 'text.secondary'}>
                                {isCount ? 'items' : 'g'}
                              </Typography>
                            </InputAdornment>
                          )
                        }} 
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}