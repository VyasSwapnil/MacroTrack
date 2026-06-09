import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper
} from '@mui/material';

export default function ViewMealDialog({ open, onClose, meal }) {
  if (!meal) return null;

  // Helper function to calculate the macros based on the saved quantity
  const getCalculatedMacros = (item) => {
    const qty = parseFloat(item.quantity) || 0; 
    const multiplier = qty / 100;
    
    return {
      calories: parseFloat((item.calories * multiplier).toFixed(1)),
      protein: parseFloat((item.protein * multiplier).toFixed(1))
    };
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {meal.name} Details
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ingredient</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty (g)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cals</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Protein</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Loop through ingredients and display their calculated values */}
                {meal.ingredients?.map((row, index) => {
                  const calculated = getCalculatedMacros(row);
                  return (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="center">{row.quantity}</TableCell>
                      <TableCell align="right">{calculated.calories}</TableCell>
                      <TableCell align="right">{calculated.protein}g</TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Totals Row remains the same since meal totals are already accurate */}
                <TableRow sx={{ '& td': { borderBottom: 0 } }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                    TOTAL
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.05rem' }}>
                    {meal.calories}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                    {meal.protein}g
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}