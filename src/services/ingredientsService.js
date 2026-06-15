import { ref, get, set, remove, update } from "firebase/database";
import { db } from "../firebase"; 

export const fetchIngredients = async () => {
  try {
    const snapshot = await get(ref(db, 'ingredients'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return []; 
  } catch (error) {
    console.error("Could not fetch ingredients:", error);
    throw error; 
  }
};

export const saveIngredients = async (ingredientsArray) => {
  try {
    const firebasePayload = {};
    ingredientsArray.forEach((item) => {
      firebasePayload[item.id] = item;
    });
    await set(ref(db, 'ingredients'), firebasePayload);
    return ingredientsArray;
  } catch (error) {
    console.error("Could not save ingredients:", error);
    throw error;
  }
};

export const deleteIngredient = async (id) => {
  try {
    await remove(ref(db, `ingredients/${id}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete ingredient:`, error);
    throw error;
  }
};

// UPDATED CASCADE FUNCTION: Now perfectly handles 'Done' and 'Cancelled' planned baselines
export const updateIngredientAndCascade = async (updatedIngredient) => {
  try {
    const updates = {};
    updates[`ingredients/${updatedIngredient.id}`] = updatedIngredient;

    const recalculateTotals = (ingredientsList) => {
      let totalCals = 0; let totalPro = 0;
      ingredientsList.forEach(ing => {
        const qty = parseFloat(ing.quantity) || 0;
        const multiplier = ing.measurementType === 'count' ? qty : (qty / 100);
        totalCals += parseFloat((ing.calories * multiplier).toFixed(1));
        totalPro += parseFloat((ing.protein * multiplier).toFixed(1));
      });
      return { calories: parseFloat(totalCals.toFixed(1)), protein: parseFloat(totalPro.toFixed(1)) };
    };

    // Update global meal templates
    const mealsSnapshot = await get(ref(db, 'meals'));
    if (mealsSnapshot.exists()) {
      const meals = mealsSnapshot.val();
      Object.keys(meals).forEach(mealId => {
        const meal = meals[mealId];
        let mealModified = false;
        if (meal.ingredients) {
          meal.ingredients = meal.ingredients.map(ing => {
            if (ing.id === updatedIngredient.id) {
              mealModified = true;
              return { ...ing, name: updatedIngredient.name, calories: updatedIngredient.calories, protein: updatedIngredient.protein, measurementType: updatedIngredient.measurementType || '100g' };
            }
            return ing;
          });
          if (mealModified) {
            const newTotals = recalculateTotals(meal.ingredients);
            meal.calories = newTotals.calories;
            meal.protein = newTotals.protein;
            updates[`meals/${mealId}`] = meal; 
          }
        }
      });
    }

    // Update all users' daily logs
    const logsSnapshot = await get(ref(db, 'dailyLogs'));
    if (logsSnapshot.exists()) {
      const allUsersLogs = logsSnapshot.val();
      Object.keys(allUsersLogs).forEach(userId => {
        const userDates = allUsersLogs[userId];
        Object.keys(userDates).forEach(dateKey => {
          const logsForDate = userDates[dateKey];
          Object.keys(logsForDate).forEach(logId => {
            const log = logsForDate[logId];
            let logModified = false;

            if (log.ingredients) {
              // Capture pre-update macros to check if the user had manually deviated the meal
              const oldActualCals = log.actualCalories || 0;
              const oldActualPro = log.actualProtein || 0;
              const oldPlannedCals = log.plannedCalories || 0;
              const oldPlannedPro = log.plannedProtein || 0;
              
              const isDeviated = (log.status === 'done' && (oldPlannedCals !== oldActualCals || oldPlannedPro !== oldActualPro));

              log.ingredients = log.ingredients.map(ing => {
                if (ing.id === updatedIngredient.id) {
                  logModified = true;
                  return { ...ing, name: updatedIngredient.name, calories: updatedIngredient.calories, protein: updatedIngredient.protein, measurementType: updatedIngredient.measurementType || '100g' };
                }
                return ing;
              });

              if (logModified) {
                const newTotals = recalculateTotals(log.ingredients);
                
                log.calories = newTotals.calories;
                log.protein = newTotals.protein;

                // Apply the new totals differently depending on the meal's status
                if (log.status === 'planned' || log.status === 'cancelled') {
                   // Only the plan changes
                   log.plannedCalories = newTotals.calories;
                   log.plannedProtein = newTotals.protein;
                } else if (log.status === 'unplanned') {
                   // Only the actuals change
                   log.actualCalories = newTotals.calories;
                   log.actualProtein = newTotals.protein;
                } else if (log.status === 'done') {
                   if (!isDeviated) {
                       // If they ate exactly what was planned, update both identically
                       log.plannedCalories = newTotals.calories;
                       log.plannedProtein = newTotals.protein;
                       log.actualCalories = newTotals.calories;
                       log.actualProtein = newTotals.protein;
                   } else {
                       // If they deviated, the new totals represent the ACTUAL new calories.
                       // We mathematically adjust the original plan by the difference the ingredient made.
                       const calDelta = newTotals.calories - oldActualCals;
                       const proDelta = newTotals.protein - oldActualPro;
                       
                       log.actualCalories = newTotals.calories;
                       log.actualProtein = newTotals.protein;
                       log.plannedCalories = Math.max(0, parseFloat((oldPlannedCals + calDelta).toFixed(1)));
                       log.plannedProtein = Math.max(0, parseFloat((oldPlannedPro + proDelta).toFixed(1)));
                   }
                }
                
                updates[`dailyLogs/${userId}/${dateKey}/${logId}`] = log; 
              }
            }
          });
        });
      });
    }

    await update(ref(db), updates);
    return true;

  } catch (error) {
    console.error("Cascade update failed:", error);
    throw error;
  }
};


export const updateMealAndCascade = async (updatedMeal) => {
  try {
    const updates = {};
    
    // 1. Update the master meal template
    updates[`meals/${updatedMeal.id}`] = updatedMeal;

    // 2. Fetch all users' daily logs
    const logsSnapshot = await get(ref(db, 'dailyLogs'));
    
    if (logsSnapshot.exists()) {
      const allUsersLogs = logsSnapshot.val();

      // Loop through Users
      Object.keys(allUsersLogs).forEach(userId => {
        const userDates = allUsersLogs[userId];
        
        // Loop through Dates
        Object.keys(userDates).forEach(dateKey => {
          const logsForDate = userDates[dateKey];
          
          // Loop through individual Meals
          Object.keys(logsForDate).forEach(logId => {
            const log = logsForDate[logId];

            // Check if this logged item is an instance of the meal we are updating
            // Note: log.id represents the original meal template ID, while log.logId is the unique daily instance
            if (log.id === updatedMeal.id) {
              
              const oldActualCals = log.actualCalories || 0;
              const oldActualPro = log.actualProtein || 0;
              const oldPlannedCals = log.plannedCalories || 0;
              const oldPlannedPro = log.plannedProtein || 0;
              
              // Check if the user had manually deviated this specific meal while eating it
              const isDeviated = (log.status === 'done' && (oldPlannedCals !== oldActualCals || oldPlannedPro !== oldActualPro));

              // Update the core meal data
              log.name = updatedMeal.name;
              log.ingredients = updatedMeal.ingredients;
              log.calories = updatedMeal.calories;
              log.protein = updatedMeal.protein;

              const newCals = updatedMeal.calories;
              const newPro = updatedMeal.protein;

              // Apply the new totals based on the meal's current status
              if (log.status === 'planned' || log.status === 'cancelled') {
                 log.plannedCalories = newCals;
                 log.plannedProtein = newPro;
              } else if (log.status === 'unplanned') {
                 log.actualCalories = newCals;
                 log.actualProtein = newPro;
              } else if (log.status === 'done') {
                 if (!isDeviated) {
                     // They ate exactly what was planned, so update both identically
                     log.plannedCalories = newCals;
                     log.plannedProtein = newPro;
                     log.actualCalories = newCals;
                     log.actualProtein = newPro;
                 } else {
                     // They deviated. We update the plan, but adjust the actuals by the difference the template change made
                     const calDelta = newCals - oldPlannedCals;
                     const proDelta = newPro - oldPlannedPro;
                     
                     log.plannedCalories = newCals;
                     log.plannedProtein = newPro;
                     log.actualCalories = Math.max(0, parseFloat((oldActualCals + calDelta).toFixed(1)));
                     log.actualProtein = Math.max(0, parseFloat((oldActualPro + proDelta).toFixed(1)));
                 }
              }
              
              // Queue the update for this specific daily log
              updates[`dailyLogs/${userId}/${dateKey}/${logId}`] = log; 
            }
          });
        });
      });
    }

    // Execute the massive update across the entire database simultaneously
    await update(ref(db), updates);
    return true;

  } catch (error) {
    console.error("Cascade update failed:", error);
    throw error;
  }
};