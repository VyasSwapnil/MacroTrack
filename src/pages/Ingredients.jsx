import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, Fab, 
  Paper, IconButton, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import AddIngredientDialog from '../components/AddIngredientDialog';

// Import the new delete function
import { fetchIngredients, saveIngredients, deleteIngredient } from '../services/ingredientsService';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for the Add/Edit Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // States for the Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setIsLoading(true);
        const data = await fetchIngredients();
        setIngredients(data);
        setError(null);
      } catch (err) {
        setError('Failed to load ingredients. Please make sure the server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    loadIngredients();
  }, []);

  const handleSaveIngredient = async (savedIngredient) => {
    let updatedList;
    if (editingIngredient) {
      updatedList = ingredients.map((item) => (item.id === savedIngredient.id ? savedIngredient : item));
    } else {
      updatedList = [...ingredients, savedIngredient];
    }

    await saveIngredients(updatedList);
    setIngredients(updatedList);
  };

  // Triggered when clicking the trash icon on the list item
  const handleDeleteClick = (ingredient) => {
    setIngredientToDelete(ingredient);
    setIsDeleteDialogOpen(true);
  };

  // Triggered when clicking "Delete" inside the confirmation popup
  const handleConfirmDelete = async () => {
    if (!ingredientToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Call the DELETE API
      await deleteIngredient(ingredientToDelete.id);
      
      // 2. Remove the item from the local UI state
      setIngredients(ingredients.filter((item) => item.id !== ingredientToDelete.id));
      
      // 3. Close the dialog
      setIsDeleteDialogOpen(false);
      setIngredientToDelete(null);
    } catch (err) {
      console.error("Failed to delete from DB", err);
      alert("Failed to delete ingredient. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setIngredientToDelete(null);
  };

  const openEditDialog = (ingredient) => {
    setEditingIngredient(ingredient);
    setIsAddDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingIngredient(null);
    setIsAddDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Ingredients</Typography>
      
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
            {ingredients.map((item) => (
              <ListItem key={item.id} divider sx={{ py: 1, pr: 1 }}>
                
                <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mr: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {item.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <Typography component="span" color="primary.main" fontWeight="bold">
                      {item.calories} kcal
                    </Typography>
                    {' • '}
                    {item.protein}g
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <IconButton color="primary" onClick={() => openEditDialog(item)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteClick(item)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

              </ListItem>
            ))}
            
            {ingredients.length === 0 && !error && (
              <ListItem sx={{ py: 2 }}>
                <Typography color="text.secondary">No ingredients found. Try adding one!</Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      <Fab color="secondary" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={openAddDialog}>
        <AddIcon />
      </Fab>

      <AddIngredientDialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onSave={handleSaveIngredient} 
        initialData={editingIngredient} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={isDeleting ? undefined : handleCancelDelete}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Ingredient</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{ingredientToDelete?.name}</strong>? This action cannot be undone.
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