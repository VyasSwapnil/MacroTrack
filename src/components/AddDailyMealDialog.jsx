import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, CircularProgress, Autocomplete, TextField
} from '@mui/material';
import { fetchMeals } from '../services/mealsService';

export default function AddDailyMealDialog({ open, onClose, onAdd }) {
  const [availableMeals, setAvailableMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the created meals when the dialog opens
  useEffect(() => {
    if (open) {
      const loadMeals = async () => {
        setIsLoading(true);
        try {
          const data = await fetchMeals();
          setAvailableMeals(data);
        } catch (error) {
          console.error("Failed to fetch meals for planner", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadMeals();
    }
  }, [open]);

  const handleSaveClick = () => {
    if (selectedMeals.length === 0) return;
    
    // Pass the selected meals back to the parent component
    onAdd(selectedMeals);
    
    // Reset and close
    setSelectedMeals([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedMeals([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Log Meals</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            multiple
            options={availableMeals}
            getOptionLabel={(option) => option.name}
            value={selectedMeals}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(event, newValue) => setSelectedMeals(newValue)}
            loading={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Search your meals"
                placeholder="Select meals to add..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params?.InputProps?.endAdornment || null}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveClick} 
          variant="contained" 
          color="primary"
          disabled={selectedMeals.length === 0}
        >
          Add to Planner
        </Button>
      </DialogActions>
    </Dialog>
  );
}