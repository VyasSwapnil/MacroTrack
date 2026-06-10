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

// Used for adding new ingredients or bulk saves
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

// NEW FUNCTION: Updates the ingredient and recalculates all downstream meals and logs
export const updateIngredientAndCascade = async (updatedIngredient) => {
  try {
    const updates = {};

    // 1. Queue the update for the main ingredient list
    updates[`ingredients/${updatedIngredient.id}`] = updatedIngredient;

    // Helper function to recalculate a meal/log's total macros based on its ingredient list
    const recalculateTotals = (ingredientsList) => {
      let totalCals = 0;
      let totalPro = 0;
      ingredientsList.forEach(ing => {
        const multiplier = (parseFloat(ing.quantity) || 0) / 100;
        totalCals += parseFloat((ing.calories * multiplier).toFixed(1));
        totalPro += parseFloat((ing.protein * multiplier).toFixed(1));
      });
      return {
        calories: parseFloat(totalCals.toFixed(1)),
        protein: parseFloat(totalPro.toFixed(1))
      };
    };

    // 2. Fetch meals, check if they contain the updated ingredient, and recalculate
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
              return {
                ...ing,
                name: updatedIngredient.name, 
                calories: updatedIngredient.calories,
                protein: updatedIngredient.protein
              };
            }
            return ing;
          });

          if (mealModified) {
            const newTotals = recalculateTotals(meal.ingredients);
            meal.calories = newTotals.calories;
            meal.protein = newTotals.protein;
            updates[`meals/${mealId}`] = meal; // Queue the meal update
          }
        }
      });
    }

    // 3. Fetch daily logs, check if they contain the ingredient, and recalculate
    const logsSnapshot = await get(ref(db, 'dailyLogs'));
    if (logsSnapshot.exists()) {
      const dailyLogs = logsSnapshot.val();
      Object.keys(dailyLogs).forEach(dateKey => {
        const logsForDate = dailyLogs[dateKey];
        Object.keys(logsForDate).forEach(logId => {
          const log = logsForDate[logId];
          let logModified = false;

          if (log.ingredients) {
            log.ingredients = log.ingredients.map(ing => {
              if (ing.id === updatedIngredient.id) {
                logModified = true;
                return {
                  ...ing,
                  name: updatedIngredient.name,
                  calories: updatedIngredient.calories,
                  protein: updatedIngredient.protein
                };
              }
              return ing;
            });

            if (logModified) {
              const newTotals = recalculateTotals(log.ingredients);
              log.calories = newTotals.calories;
              log.protein = newTotals.protein;
              updates[`dailyLogs/${dateKey}/${logId}`] = log; // Queue the log update
            }
          }
        });
      });
    }

    // 4. Execute all updates across the database simultaneously
    await update(ref(db), updates);
    return true;

  } catch (error) {
    console.error("Cascade update failed:", error);
    throw error;
  }
};