import { ref, get, set, remove } from "firebase/database";
// Adjust this path to point to where you saved your firebase.js file
import { db } from "../firebase"; 

export const fetchDailyLogs = async (dateKey) => {
  try {
    // Fetches only the logs for the specific date
    const snapshot = await get(ref(db, `dailyLogs/${dateKey}`));
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Could not fetch daily logs from Firebase:", error);
    throw error; 
  }
};

export const saveDailyLogs = async (dateKey, logsArray) => {
  try {
    // Convert array to object to prevent Firebase null slots
    const firebasePayload = {};
    logsArray.forEach((log) => {
      firebasePayload[log.logId] = log;
    });

    await set(ref(db, `dailyLogs/${dateKey}`), firebasePayload);
    return logsArray;
  } catch (error) {
    console.error("Could not save daily logs to Firebase:", error);
    throw error;
  }
};

export const deleteDailyLog = async (dateKey, logId) => {
  try {
    // Targets the specific log inside the specific date
    await remove(ref(db, `dailyLogs/${dateKey}/${logId}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete log with id ${logId}:`, error);
    throw error;
  }
};