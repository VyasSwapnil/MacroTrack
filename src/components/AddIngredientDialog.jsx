import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

export default function AddIngredientDialog({ open, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const [errors, setErrors] = useState({ name: '', calories: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCalories(initialData.calories);
      setProtein(initialData.protein);
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const handleSaveClick = async () => {
    let isValid = true;
    let newErrors = { name: '', calories: '' };

    if (!name.trim()) {
      newErrors.name = 'Ingredient name is required';
      isValid = false;
    }

    if (calories === '') {
      newErrors.calories = 'Calories value is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    const newIngredient = {
      id: initialData ? initialData.id : Date.now(),
      name: name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0
    };

    setIsSubmitting(true);
    try {
      await onSave(newIngredient);
      
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save to DB", error);
      alert("Failed to save ingredient. Please try again.");
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
    setCalories('');
    setProtein('');
    setErrors({ name: '', calories: '' });
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {initialData ? 'Edit Ingredient' : 'Add Ingredient'}
      </DialogTitle>
      
      <DialogContent>
        {/* Added Alert to instruct the user about the 100g standard */}
        <Alert severity="info" sx={{ mt: 1, mb: 2, borderRadius: 2 }}>
          Please enter nutritional values based on <strong>100 grams</strong> of this ingredient.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Ingredient Name"
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            fullWidth
            required
            autoFocus
            error={!!errors.name}
            helperText={errors.name}
            disabled={isSubmitting}
          />
          <TextField
            label="Calories (per 100g)"
            variant="outlined"
            type="number"
            value={calories}
            onChange={(e) => {
              setCalories(e.target.value);
              if (errors.calories) setErrors({ ...errors, calories: '' });
            }}
            fullWidth
            required
            InputProps={{ inputProps: { min: 0 } }}
            error={!!errors.calories}
            helperText={errors.calories}
            disabled={isSubmitting}
          />
          <TextField
            label="Protein (g per 100g)"
            variant="outlined"
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            fullWidth
            InputProps={{ inputProps: { min: 0 } }}
            disabled={isSubmitting}
          />
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}