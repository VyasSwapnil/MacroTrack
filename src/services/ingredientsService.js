// src/services/api.js

const API_BASE_URL = 'http://localhost:3000/api';

export const fetchIngredients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredients`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Could not fetch ingredients:", error);
    throw error; 
  }
};

export const saveIngredients = async (ingredientsArray) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingredientsArray),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Could not save ingredients:", error);
    throw error;
  }
};

// New function to handle the DELETE request
export const deleteIngredient = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Returning true indicates success, even if the API sends an empty response body
    return true; 
  } catch (error) {
    console.error(`Could not delete ingredient with id ${id}:`, error);
    throw error;
  }
};