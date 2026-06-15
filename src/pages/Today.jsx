import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, 
  IconButton, Fab, Paper, CircularProgress, Alert, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TextField
} from '@mui/material';
import { Add as AddIcon, CheckCircle, Cancel, Edit, Delete } from '@mui/icons-material';
import AddDailyMealDialog from '../components/AddDailyMealDialog';
import { fetchDailyLogs, saveDailyLogs, updateDailyLogMealStatus, deleteDailyLog } from '../services/dailyLogsService';
import { Grid } from '@mui/material';

export default function Today() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deviateMeal, setDeviateMeal] = useState(null);

  useEffect(() => {
    const loadToday = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDailyLogs(dateKey);
        setLogs(data);
      } catch (err) {
        setError('Failed to load today\'s plan.');
      } finally {
        setIsLoading(false);
      }
    };
    loadToday();
  }, [dateKey]);

  // --- Calculations ---
  const totals = useMemo(() => {
    let plannedCals = 0;
    let plannedPro = 0;
    let actualCals = 0;
    let actualPro = 0;

    logs.forEach(meal => {
      // Unplanned meals don't count towards the original "Plan" baseline
      if (meal.status !== 'unplanned') {
        plannedCals += (meal.plannedCalories || 0);
        plannedPro += (meal.plannedProtein || 0);
      }
      
      // Only "Done", "Unplanned", or "Deviated" meals count towards Actuals
      if (meal.status === 'done' || meal.status === 'unplanned') {
        actualCals += (meal.actualCalories || 0);
        actualPro += (meal.actualProtein || 0);
      }
    });

    return {
      plannedCals, plannedPro,
      actualCals, actualPro,
      calVariance: actualCals - plannedCals,
      proVariance: actualPro - plannedPro
    };
  }, [logs]);

  // --- Handlers ---
  const handleMarkDone = async (meal) => {
    try {
      const updates = { 
        status: 'done', 
        actualCalories: meal.plannedCalories, 
        actualProtein: meal.plannedProtein 
      };
      await updateDailyLogMealStatus(dateKey, meal.logId, updates);
      setLogs(logs.map(m => m.logId === meal.logId ? { ...m, ...updates } : m));
    } catch (err) { alert("Failed to update status."); }
  };

  const handleCancelMeal = async (meal) => {
    try {
      const updates = { status: 'cancelled', actualCalories: 0, actualProtein: 0 };
      await updateDailyLogMealStatus(dateKey, meal.logId, updates);
      setLogs(logs.map(m => m.logId === meal.logId ? { ...m, ...updates } : m));
    } catch (err) { alert("Failed to cancel meal."); }
  };

  const handleDeleteUnplanned = async (logId) => {
    try {
      await deleteDailyLog(dateKey, logId);
      setLogs(logs.filter(m => m.logId !== logId));
    } catch (err) { alert("Failed to delete meal."); }
  };

  const handleAddUnplannedMeals = async (selectedMeals) => {
    const newLogs = selectedMeals.map((meal) => ({
      ...meal,
      logId: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'unplanned', 
      plannedCalories: 0,
      plannedProtein: 0,
      actualCalories: meal.calories,
      actualProtein: meal.protein
    }));
    
    try {
      const updatedList = [...logs, ...newLogs];
      await saveDailyLogs(dateKey, updatedList);
      setLogs(updatedList);
    } catch (err) { alert("Failed to add unplanned meals."); }
  };

  const handleSaveDeviation = async (logId, newActualCals, newActualPro, updatedIngredients) => {
    try {
      const updates = { 
        status: 'done', 
        actualCalories: newActualCals, 
        actualProtein: newActualPro,
        ingredients: updatedIngredients
      };
      await updateDailyLogMealStatus(dateKey, logId, updates);
      setLogs(logs.map(m => m.logId === logId ? { ...m, ...updates } : m));
      setDeviateMeal(null);
    } catch (err) { alert("Failed to save deviation."); }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Today, {formattedDate}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Dashboard */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">PLANNED</Typography>
              <Typography variant="h5" fontWeight="bold">{parseFloat(totals.plannedCals.toFixed(1))} kcal</Typography>
              <Typography variant="body2" color="text.secondary">{parseFloat(totals.plannedPro.toFixed(1))}g protein</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" color="text.secondary">ACTUAL</Typography>
              <Typography variant="h5" fontWeight="bold">{parseFloat(totals.actualCals.toFixed(1))} kcal</Typography>
              <Typography variant="body2" color="text.secondary">{parseFloat(totals.actualPro.toFixed(1))}g protein</Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: totals.calVariance > 0 ? '#ffebee' : '#e8f5e9', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="bold" color={totals.calVariance > 0 ? 'error.main' : 'success.main'}>
              {totals.calVariance > 0 ? '+' : ''}{parseFloat(totals.calVariance.toFixed(1))} kcal Variance
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={totals.proVariance >= 0 ? 'success.main' : 'error.main'}>
              {totals.proVariance > 0 ? '+' : ''}{parseFloat(totals.proVariance.toFixed(1))}g Pro Variance
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Meals List */}
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Your Meals</Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {logs.map((meal) => (
              <ListItem key={meal.logId} divider sx={{ py: 2, flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {meal.name}
                      {meal.status === 'unplanned' && <Chip label="Unplanned" size="small" color="warning" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {meal.status === 'planned' || meal.status === 'cancelled' 
                        ? `${meal.plannedCalories} kcal planned`
                        : <Typography component="span" fontWeight="bold" color="primary.main">{meal.actualCalories} kcal</Typography>
                      }
                    </Typography>
                  </Box>

                  {/* Dynamic Status Badges */}
                  {meal.status === 'done' && <Chip icon={<CheckCircle />} label="Done" color="success" size="small" variant="outlined" />}
                  {meal.status === 'cancelled' && <Chip icon={<Cancel />} label="Cancelled" color="error" size="small" variant="outlined" />}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {meal.status === 'planned' && (
                    <>
                      <Button size="small" variant="contained" color="success" onClick={() => handleMarkDone(meal)}>Done</Button>
                      <Button size="small" variant="outlined" color="primary" onClick={() => setDeviateMeal(meal)}>Deviate</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleCancelMeal(meal)}>Cancel</Button>
                    </>
                  )}
                  {meal.status === 'unplanned' && (
                    <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => handleDeleteUnplanned(meal.logId)}>
                      Remove
                    </Button>
                  )}
                </Box>
              </ListItem>
            ))}

            {logs.length === 0 && (
              <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                <Typography color="text.secondary">Nothing planned or logged yet.</Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Floating Action Button for Unplanned Meals */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={() => setIsAddDialogOpen(true)}>
        <AddIcon />
      </Fab>

      <AddDailyMealDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAdd={handleAddUnplannedMeals} />
      
      {deviateMeal && (
        <DeviateDialog meal={deviateMeal} onClose={() => setDeviateMeal(null)} onSave={handleSaveDeviation} />
      )}
    </Box>
  );
}

// --- Inline Deviate Dialog Component ---
function DeviateDialog({ meal, onClose, onSave }) {
  // Local state to track modified quantities
  const [ingredients, setIngredients] = useState(meal.ingredients || []);

  const handleQtyChange = (id, newQty) => {
    setIngredients(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const getCalculatedMacros = (item) => {
    const qty = parseFloat(item.quantity) || 0; 
    const multiplier = item.measurementType === 'count' ? qty : (qty / 100);
    return {
      calories: parseFloat((item.calories * multiplier).toFixed(1)),
      protein: parseFloat((item.protein * multiplier).toFixed(1))
    };
  };

  const handleSave = () => {
    let totalCals = 0;
    let totalPro = 0;
    
    ingredients.forEach(item => {
      const macros = getCalculatedMacros(item);
      totalCals += macros.calories;
      totalPro += macros.protein;
    });

    onSave(meal.logId, parseFloat(totalCals.toFixed(1)), parseFloat(totalPro.toFixed(1)), ingredients);
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Deviate: {meal.name}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1, mb: 2 }}>Update the quantities to reflect what you actually ate.</Alert>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Ingredient</TableCell>
                <TableCell align="center" sx={{ width: '100px' }}>Actual Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="center">
                    <TextField
                      variant="standard" type="number"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save Actuals</Button>
      </DialogActions>
    </Dialog>
  );
}