import { ref, get, set, remove, update } from "firebase/database";
import { db } from "../firebase"; 

export const fetchDailyLogs = async (dateKey) => {
  try {
    const snapshot = await get(ref(db, `dailyLogs/${dateKey}`));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Could not fetch daily logs:", error);
    throw error; 
  }
};

export const saveDailyLogs = async (dateKey, logsArray) => {
  try {
    const firebasePayload = {};
    logsArray.forEach((log) => {
      firebasePayload[log.logId] = log;
    });

    await set(ref(db, `dailyLogs/${dateKey}`), firebasePayload);
    return logsArray;
  } catch (error) {
    console.error("Could not save daily logs:", error);
    throw error;
  }
};

// NEW: Granular update function for marking meals as Done, Cancelled, or Deviated
export const updateDailyLogMealStatus = async (dateKey, logId, updatesToApply) => {
  try {
    const updates = {};
    // We target the specific fields inside the specific meal object
    Object.keys(updatesToApply).forEach(key => {
      updates[`dailyLogs/${dateKey}/${logId}/${key}`] = updatesToApply[key];
    });
    
    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error(`Could not update log status for ${logId}:`, error);
    throw error;
  }
};

export const deleteDailyLog = async (dateKey, logId) => {
  try {
    await remove(ref(db, `dailyLogs/${dateKey}/${logId}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete log:`, error);
    throw error;
  }
};

export const fetchAllDailyLogs = async () => {
  try {
    // Fetches the entire dailyLogs node
    const snapshot = await get(ref(db, 'dailyLogs'));
    if (snapshot.exists()) {
      return snapshot.val(); // Returns an object with dateKeys as properties
    }
    return {};
  } catch (error) {
    console.error("Could not fetch all daily logs:", error);
    throw error; 
  }
};