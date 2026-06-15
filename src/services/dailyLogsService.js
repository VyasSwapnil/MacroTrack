import { ref, get, set, remove, update } from "firebase/database";
import { db } from "../firebase"; 

// Target specific user's logs
export const fetchDailyLogs = async (userId, dateKey) => {
  if (!userId) return [];
  try {
    const snapshot = await get(ref(db, `dailyLogs/${userId}/${dateKey}`));
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Could not fetch daily logs:", error);
    throw error; 
  }
};

export const saveDailyLogs = async (userId, dateKey, logsArray) => {
  try {
    const firebasePayload = {};
    logsArray.forEach((log) => {
      firebasePayload[log.logId] = log;
    });
    await set(ref(db, `dailyLogs/${userId}/${dateKey}`), firebasePayload);
    return logsArray;
  } catch (error) {
    console.error("Could not save daily logs:", error);
    throw error;
  }
};

export const updateDailyLogMealStatus = async (userId, dateKey, logId, updatesToApply) => {
  try {
    const updates = {};
    Object.keys(updatesToApply).forEach(key => {
      updates[`dailyLogs/${userId}/${dateKey}/${logId}/${key}`] = updatesToApply[key];
    });
    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error(`Could not update log status for ${logId}:`, error);
    throw error;
  }
};

export const deleteDailyLog = async (userId, dateKey, logId) => {
  try {
    await remove(ref(db, `dailyLogs/${userId}/${dateKey}/${logId}`));
    return true; 
  } catch (error) {
    console.error(`Could not delete log:`, error);
    throw error;
  }
};

// Fetches all logs for ALL users to populate the Planner summary
export const fetchAllDailyLogs = async () => {
  try {
    const snapshot = await get(ref(db, 'dailyLogs'));
    if (snapshot.exists()) {
      return snapshot.val(); 
    }
    return {};
  } catch (error) {
    console.error("Could not fetch all daily logs:", error);
    throw error; 
  }
};