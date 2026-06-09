// src/services/mealsService.js

const API_BASE_URL = 'http://localhost:3000/api';

export const fetchMeals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/meals`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not fetch meals:", error);
    throw error; 
  }
};

export const saveMeals = async (mealsArray) => {
  try {
    const response = await fetch(`${API_BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mealsArray),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not save meals:", error);
    throw error;
  }
};

// New function to handle the DELETE request
export const deleteMeal = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/meals/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true; 
  } catch (error) {
    console.error(`Could not delete meal with id ${id}:`, error);
    throw error;
  }
};