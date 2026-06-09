import { ref, get, set, remove } from "firebase/database";
// Adjust this path to point to where you saved your firebase.js file
import { db } from "../firebase"; 

export const fetchMeals = async () => {
  try {
    const snapshot = await get(ref(db, 'meals'));
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Could not fetch meals from Firebase:", error);
    throw error; 
  }
};

export const saveMeals = async (mealsArray) => {
  try {
    const firebasePayload = {};
    mealsArray.forEach((meal) => {
      firebasePayload[meal.id] = meal;
    });

    await set(ref(db, 'meals'), firebasePayload);
    return mealsArray;
  } catch (error) {
    console.error("Could not save meals to Firebase:", error);
    throw error;
  }
};

export const deleteMeal = async (id) => {
  try {
    await remove(ref(db, `meals/${id}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete meal with id ${id}:`, error);
    throw error;
  }
};