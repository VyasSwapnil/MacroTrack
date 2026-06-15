import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Chip, IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

export default function ViewDayPlanDialog({ open, onClose, date, meals, onEdit, onDelete }) {
  if (!date || !meals) return null;

  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || meal.plannedCalories || 0),
      protein: acc.protein + (meal.protein || meal.plannedProtein || 0)
    }), { calories: 0, protein: 0 });
  }, [meals]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
        Plan for {formattedDate}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1 }}>
          <Chip label={`${parseFloat(totals.calories.toFixed(1))} kcal`} color="primary" variant="outlined" />
          <Chip label={`${parseFloat(totals.protein.toFixed(1))}g Protein`} color="secondary" variant="outlined" />
        </Box>

        {meals.map((meal) => (
          <Box key={meal.logId} sx={{ mb: 3 }}>
            
            {/* Meal Header with Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {meal.name}
              </Typography>
              <Box>
                <IconButton size="small" color="primary" onClick={() => onEdit(meal)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(meal)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Ingredient</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Cals</TableCell>
                    <TableCell align="right">Protein</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meal.ingredients?.map((ing, idx) => {
                    const qty = parseFloat(ing.quantity) || 0;
                    const multiplier = ing.measurementType === 'count' ? qty : (qty / 100);
                    const cals = parseFloat((ing.calories * multiplier).toFixed(1));
                    const pro = parseFloat((ing.protein * multiplier).toFixed(1));
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell>{ing.name}</TableCell>
                        <TableCell align="center">
                          {qty}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                            {ing.measurementType === 'count' ? 'items' : 'g'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{cals}</TableCell>
                        <TableCell align="right">{pro}g</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}