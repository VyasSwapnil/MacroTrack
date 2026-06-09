import { ref, get, set, remove } from "firebase/database";
// Adjust this path to point to where you saved your firebase.js file
import { db } from "../firebase"; 

export const fetchIngredients = async () => {
  try {
    const snapshot = await get(ref(db, 'ingredients'));
    
    if (snapshot.exists()) {
      // Firebase stores this as an object of objects. 
      // Object.values() converts it back into the flat array your UI expects.
      return Object.values(snapshot.val());
    }
    return []; // Return an empty array if no data exists yet
  } catch (error) {
    console.error("Could not fetch ingredients from Firebase:", error);
    throw error; 
  }
};

export const saveIngredients = async (ingredientsArray) => {
  try {
    // Convert the UI array into a keyed object (using the ingredient ID as the key)
    // This is the safest way to store lists in Firebase Realtime Database
    const firebasePayload = {};
    ingredientsArray.forEach((item) => {
      firebasePayload[item.id] = item;
    });

    await set(ref(db, 'ingredients'), firebasePayload);
    return ingredientsArray;
  } catch (error) {
    console.error("Could not save ingredients to Firebase:", error);
    throw error;
  }
};

export const deleteIngredient = async (id) => {
  try {
    // Target the specific ingredient by its ID and remove it
    await remove(ref(db, `ingredients/${id}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete ingredient with id ${id}:`, error);
    throw error;
  }
};