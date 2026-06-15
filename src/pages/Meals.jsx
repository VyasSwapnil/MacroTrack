import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, Fab, Paper, 
  CircularProgress, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon 
} from '@mui/icons-material';

import { fetchMeals, saveMeals, deleteMeal } from '../services/mealsService';
import AddMealDialog from '../components/AddMealDialog';
// 1. Import the View component
import ViewMealDialog from '../components/ViewMealDialog';
import { updateMealAndCascade } from '../services/ingredientsService';

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for the Add/Edit Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  // States for the Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. States for the View Dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMealForView, setSelectedMealForView] = useState(null);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMeals();
        setMeals(data);
        setError(null);
      } catch (err) {
        setError('Failed to load meals. Please make sure the server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMeals();
  }, []);

const handleSaveMeal = async (savedMeal) => {
    if (editingMeal) {
      // 1. If it is an edit, trigger the new cascading update
      await updateMealAndCascade(savedMeal);
      
      // Update local state instantly
      setMeals(meals.map((item) => (item.id === savedMeal.id ? savedMeal : item)));
    } else {
      // 2. If it is a brand new meal, add it normally (assuming saveMeals is your current function)
      const updatedList = [...meals, savedMeal];
      await saveMeals(updatedList);
      setMeals(updatedList);
    }
  };

  const handleEditClick = (meal) => {
    setEditingMeal(meal);
    setIsAddDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingMeal(null);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (meal) => {
    setMealToDelete(meal);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMeal(mealToDelete.id);
      setMeals(meals.filter((m) => m.id !== mealToDelete.id));
      setIsDeleteDialogOpen(false);
      setMealToDelete(null);
    } catch (err) {
      console.error("Failed to delete meal from DB", err);
      alert("Failed to delete meal. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMealToDelete(null);
  };

  // 3. Handler to open the View Dialog
  const handleViewMeal = (meal) => {
    setSelectedMealForView(meal);
    setIsViewDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>My Meals</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {meals.map((meal) => (
              <ListItem 
                button // Adds visual feedback on touch
                key={meal.id} 
                divider 
                sx={{ py: 1, pr: 1 }}
                onClick={() => handleViewMeal(meal)} // Triggers the view popup
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
                    color="primary" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents opening the view popup
                      handleEditClick(meal);
                    }} 
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents opening the view popup
                      handleDeleteClick(meal);
                    }} 
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

              </ListItem>
            ))}

            {meals.length === 0 && !error && (
              <ListItem sx={{ py: 2 }}>
                <Typography color="text.secondary">
                  No meals found. Start creating some!
                </Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      <Fab 
        color="secondary" 
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={openAddDialog}
      >
        <AddIcon />
      </Fab>

      <AddMealDialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onSave={handleSaveMeal} 
        initialData={editingMeal}
      />

      {/* 4. Render the View Dialog */}
      <ViewMealDialog 
        open={isViewDialogOpen} 
        onClose={() => setIsViewDialogOpen(false)} 
        meal={selectedMealForView}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={isDeleting ? undefined : handleCancelDelete}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Meal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{mealToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelDelete} color="inherit" disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}