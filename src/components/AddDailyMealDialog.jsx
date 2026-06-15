import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, Autocomplete, CircularProgress,
  Typography, ToggleButtonGroup, ToggleButton, Paper, Divider
} from '@mui/material';
import { RestaurantMenu, Kitchen, Fastfood } from '@mui/icons-material';
import { fetchIngredients } from '../services/ingredientsService';
import { ref, get } from "firebase/database";
import { db } from "../firebase";

export default function AddDailyMealDialog({ open, onClose, onAdd, mode = 'today' }) {
  const [activeTab, setActiveTab] = useState('meal'); 
  
  const [availableMeals, setAvailableMeals] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // States now store Arrays to support multiple selections
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');

  const isMulti = mode === 'planner';

  useEffect(() => {
    if (open) {
      const loadDialogData = async () => {
        setIsLoading(true);
        try {
          const ingSnapshot = await get(ref(db, 'ingredients'));
          const ingData = ingSnapshot.exists() ? Object.values(ingSnapshot.val()) : [];
          setAvailableIngredients(ingData);

          const mealsSnapshot = await get(ref(db, 'meals'));
          const mealsData = mealsSnapshot.exists() ? Object.values(mealsSnapshot.val()) : [];
          setAvailableMeals(mealsData);
        } catch (err) {
          console.error("Failed to load dialog options", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadDialogData();
      resetSelection();
    }
  }, [open]);

  const resetSelection = () => {
    setSelectedMeals([]);
    setSelectedIngredients([]);
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
  };

  const handleTabChange = (event, newTab) => {
    if (newTab !== null) {
      setActiveTab(newTab);
      resetSelection();
    }
  };

  const handleIngredientQtyChange = (id, newQty) => {
    setSelectedIngredients(prev => 
      prev.map(ing => ing.id === id ? { ...ing, quantity: newQty } : ing)
    );
  };

  // Dynamically sum up the macros for all selected ingredients
  const calculatedIngredientMacros = useMemo(() => {
    let cals = 0; let pro = 0;
    selectedIngredients.forEach(ing => {
      const qty = parseFloat(ing.quantity) || 0;
      const multiplier = ing.measurementType === 'count' ? qty : (qty / 100);
      cals += (ing.calories * multiplier);
      pro += (ing.protein * multiplier);
    });
    return { calories: parseFloat(cals.toFixed(1)), protein: parseFloat(pro.toFixed(1)) };
  }, [selectedIngredients]);

  // Dynamically sum up the macros for all selected meals
  const calculatedMealMacros = useMemo(() => {
    let cals = 0; let pro = 0;
    selectedMeals.forEach(meal => {
      cals += (meal.calories || 0);
      pro += (meal.protein || 0);
    });
    return { calories: parseFloat(cals.toFixed(1)), protein: parseFloat(pro.toFixed(1)) };
  }, [selectedMeals]);

  const isSubmitDisabled = () => {
    if (activeTab === 'meal') return selectedMeals.length === 0;
    if (activeTab === 'ingredient') {
      return selectedIngredients.length === 0 || selectedIngredients.some(i => !i.quantity || parseFloat(i.quantity) <= 0);
    }
    if (activeTab === 'custom') return (!customName.trim() || customCalories === '');
    return true;
  };

  const handleSubmit = () => {
    if (activeTab === 'meal' && selectedMeals.length > 0) {
      // Pass the array of selected meals directly
      onAdd(selectedMeals);
      onClose();
    } 
    else if (activeTab === 'ingredient' && selectedIngredients.length > 0) {
      // Convert all selected ingredients into standard meal-format objects
      const standardizedItems = selectedIngredients.map(ing => {
        const qty = parseFloat(ing.quantity) || 0;
        const multiplier = ing.measurementType === 'count' ? qty : (qty / 100);
        return {
          id: `raw_${Date.now()}_${ing.id}`,
          name: ing.name,
          calories: parseFloat((ing.calories * multiplier).toFixed(1)),
          protein: parseFloat((ing.protein * multiplier).toFixed(1)),
          ingredients: [{
            id: ing.id,
            name: ing.name,
            quantity: qty,
            calories: ing.calories,
            protein: ing.protein,
            measurementType: ing.measurementType || '100g'
          }]
        };
      });
      onAdd(standardizedItems);
      onClose();
    }
    else if (activeTab === 'custom' && customName.trim() && customCalories !== '') {
      const cals = parseFloat(customCalories) || 0;
      const pro = parseFloat(customProtein) || 0;
      const customMealItem = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        calories: cals,
        protein: pro,
        ingredients: [{
          id: `custom_ing_${Date.now()}`,
          name: customName.trim(),
          quantity: 1, 
          calories: cals,
          protein: pro,
          measurementType: 'count' 
        }]
      };
      onAdd([customMealItem]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
        {mode === 'planner' ? 'Add Items to Plan' : 'Log Unplanned Item'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 3 }}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={handleTabChange}
            size="small"
            color="primary"
            sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <ToggleButton value="meal" sx={{ px: 2, gap: 0.5, fontSize: '0.8rem' }}>
              <RestaurantMenu fontSize="small" /> Saved Meal
            </ToggleButton>
            <ToggleButton value="ingredient" sx={{ px: 2, gap: 0.5, fontSize: '0.8rem' }}>
              <Kitchen fontSize="small" /> Raw Ingredient
            </ToggleButton>
            <ToggleButton value="custom" sx={{ px: 2, gap: 0.5, fontSize: '0.8rem' }}>
              <Fastfood fontSize="small" /> Quick Add
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ minHeight: '120px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            
            {/* VIEW 1: PREMADE MEALS */}
            {activeTab === 'meal' && (
              <Autocomplete
                multiple={isMulti}
                disableCloseOnSelect={isMulti}
                options={availableMeals}
                getOptionLabel={(option) => option.name}
                value={isMulti ? selectedMeals : (selectedMeals[0] || null)}
                onChange={(event, newValue) => {
                  if (isMulti) setSelectedMeals(newValue);
                  else setSelectedMeals(newValue ? [newValue] : []);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label={isMulti ? "Search Meals..." : "Search Meal..."} variant="outlined" fullWidth />
                )}
              />
            )}

            {/* VIEW 2: RAW INGREDIENTS */}
            {activeTab === 'ingredient' && (
              <>
                <Autocomplete
                  multiple={isMulti}
                  disableCloseOnSelect={isMulti}
                  options={availableIngredients}
                  getOptionLabel={(option) => option.name}
                  value={isMulti ? selectedIngredients : (selectedIngredients[0] || null)}
                  onChange={(event, newValue) => {
                    if (isMulti) {
                      // Merge new selections with existing ones to preserve quantities the user already typed
                      const merged = newValue.map(item => {
                        const existing = selectedIngredients.find(i => i.id === item.id);
                        return existing || { ...item, quantity: item.measurementType === 'count' ? '1' : '100' };
                      });
                      setSelectedIngredients(merged);
                    } else {
                      setSelectedIngredients(newValue ? [{ ...newValue, quantity: newValue.measurementType === 'count' ? '1' : '100' }] : []);
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.measurementType === 'count' ? 'per item' : 'per 100g'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label={isMulti ? "Search Ingredients..." : "Search Ingredient..."} variant="outlined" fullWidth />
                  )}
                />

                {/* Display Quantity Inputs for all selected ingredients */}
                {selectedIngredients.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1, maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
                    {selectedIngredients.map((ing, idx) => (
                      <React.Fragment key={ing.id}>
                        {idx > 0 && <Divider />}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{ing.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="number"
                              variant="outlined"
                              size="small"
                              value={ing.quantity}
                              onChange={(e) => handleIngredientQtyChange(ing.id, e.target.value)}
                              inputProps={{ min: 0, style: { textAlign: 'center', padding: '6px' } }}
                              sx={{ width: '80px' }}
                            />
                            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: '35px' }}>
                              {ing.measurementType === 'count' ? 'items' : 'g'}
                            </Typography>
                          </Box>
                        </Box>
                      </React.Fragment>
                    ))}
                  </Box>
                )}
              </>
            )}

            {/* VIEW 3: CUSTOM ONE-OFF ENTRY (Always Single Entry) */}
            {activeTab === 'custom' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Item Name (e.g., Chocolate Bar)"
                  variant="outlined"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  fullWidth
                  size="small"
                  autoFocus
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Calories (kcal)"
                    type="number"
                    variant="outlined"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Protein (g) - Optional"
                    type="number"
                    variant="outlined"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>
            )}

            {/* Live Macro Tracker Preview Box */}
            {((activeTab === 'meal' && selectedMeals.length > 0) || 
              (activeTab === 'ingredient' && selectedIngredients.length > 0) ||
              (activeTab === 'custom' && customName.trim() && customCalories !== '')) && (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafafa', borderRadius: 2, mt: 'auto' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                  TOTAL VALUE OF SELECTED ITEMS:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Calories: <Box component="span" color="primary.main">
                      {activeTab === 'meal' ? calculatedMealMacros.calories : 
                       activeTab === 'ingredient' ? calculatedIngredientMacros.calories : 
                       parseFloat(customCalories) || 0} kcal
                    </Box>
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Protein: <Box component="span" color="text.primary">
                      {activeTab === 'meal' ? calculatedMealMacros.protein : 
                       activeTab === 'ingredient' ? calculatedIngredientMacros.protein : 
                       parseFloat(customProtein) || 0}g
                    </Box>
                  </Typography>
                </Box>
              </Paper>
            )}

          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitDisabled()}
        >
          {mode === 'planner' ? 'Add to Plan' : 'Add to Log'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}