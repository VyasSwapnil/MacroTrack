import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, CircularProgress, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';
import { fetchIngredients } from '../services/ingredientsService';

export default function AddMealDialog({ open, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch ingredients and pre-fill data when the dialog opens
  useEffect(() => {
    if (open) {
      const loadIngredients = async () => {
        setIsLoadingIngredients(true);
        try {
          const data = await fetchIngredients();
          setAvailableIngredients(data);
        } catch (err) {
          console.error("Failed to load ingredients for dropdown");
        } finally {
          setIsLoadingIngredients(false);
        }
      };
      loadIngredients();

      // Pre-fill the form if we are editing an existing meal
      if (initialData) {
        setName(initialData.name);
        setSelectedIngredients(initialData.ingredients || []);
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  const getCalculatedMacros = (item) => {
    const qty = parseFloat(item.quantity) || 0; 
    const multiplier = qty / 100;
    
    return {
      calories: parseFloat((item.calories * multiplier).toFixed(1)),
      protein: parseFloat((item.protein * multiplier).toFixed(1))
    };
  };

  const totals = useMemo(() => {
    return selectedIngredients.reduce(
      (acc, item) => {
        const macros = getCalculatedMacros(item);
        return {
          calories: parseFloat((acc.calories + macros.calories).toFixed(1)),
          protein: parseFloat((acc.protein + macros.protein).toFixed(1)),
        };
      },
      { calories: 0, protein: 0 }
    );
  }, [selectedIngredients]);

  const handleQuantityChange = (id, newQuantity) => {
    setSelectedIngredients(prev =>
      prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item)
    );
  };

  const handleSaveClick = async () => {
    if (!name.trim()) {
      setError('Meal name is required');
      return;
    }
    if (selectedIngredients.length === 0) {
      setError('Please select at least one ingredient');
      return;
    }
    
    const hasInvalidQuantities = selectedIngredients.some(item => (parseFloat(item.quantity) || 0) <= 0);
    if (hasInvalidQuantities) {
      setError('Please enter a valid quantity greater than 0 for all ingredients');
      return;
    }

    setError('');

    const finalIngredientsList = selectedIngredients.map(item => ({
      id: item.id,
      name: item.name,
      quantity: parseFloat(item.quantity),
      calories: item.calories,
      protein: item.protein
    }));

    // 2. Preserve the original ID if editing, otherwise generate a new one
    const newMeal = {
      id: initialData ? initialData.id : Date.now(),
      name: name.trim(),
      ingredients: finalIngredientsList,
      calories: totals.calories,
      protein: totals.protein
    };

    setIsSubmitting(true);
    try {
      await onSave(newMeal);
      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to save meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setSelectedIngredients([]);
    setError('');
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {initialData ? 'Edit Meal' : 'Create New Meal'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          
          <TextField
            label="Meal Name (e.g., Morning Tea)"
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            fullWidth
            required
            autoFocus
            disabled={isSubmitting}
          />

          <Autocomplete
            multiple
            options={availableIngredients}
            getOptionLabel={(option) => option.name}
            // Add this to prevent warnings when comparing saved data with fetched data
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedIngredients}
            onChange={(event, newValue) => {
              const updatedSelection = newValue.map(item => {
                const existing = selectedIngredients.find(i => i.id === item.id);
                return existing ? existing : { ...item, quantity: '100' };
              });
              setSelectedIngredients(updatedSelection);
              if (error) setError('');
            }}
            loading={isLoadingIngredients}
            disabled={isSubmitting}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Ingredients"
                placeholder="Search ingredients..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {isLoadingIngredients ? <CircularProgress color="inherit" size={20} /> : null}
                      {params?.InputProps?.endAdornment || null}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />

          {selectedIngredients.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ingredient</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>Qty (g)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cals</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Protein</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedIngredients.map((row) => {
                    const calculated = getCalculatedMacros(row);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="center">
                          <TextField
                            variant="standard"
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                            InputProps={{ inputProps: { min: 0 } }}
                            sx={{ width: '70px' }}
                            disabled={isSubmitting}
                          />
                        </TableCell>
                        <TableCell align="right">{calculated.calories}</TableCell>
                        <TableCell align="right">{calculated.protein}g</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ '& td': { borderBottom: 0 } }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.05rem' }}>
                      {totals.calories}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                      {totals.protein}g
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveClick} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Saving...' : 'Save Meal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}