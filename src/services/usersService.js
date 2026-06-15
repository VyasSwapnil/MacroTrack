import { ref, get, set } from "firebase/database";
import { db } from "../firebase"; 

export const fetchUsers = async () => {
  try {
    const snapshot = await get(ref(db, 'users'));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Could not fetch users:", error);
    throw error;
  }
};

export const saveUser = async (user) => {
  try {
    await set(ref(db, `users/${user.id}`), user);
    return user;
  } catch (error) {
    console.error("Could not save user:", error);
    throw error;
  }
};

export const saveUserWeight = async (userId, dateKey, weight) => {
  try {
    await set(ref(db, `users/${userId}/weights/${dateKey}`), parseFloat(weight));
    return true;
  } catch (error) {
    console.error("Could not save user weight:", error);
    throw error;
  }
};