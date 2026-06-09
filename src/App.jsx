import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DayPlanner from './pages/DayPlanner';
import Ingredients from './pages/Ingredients';
import Meals from './pages/Meals';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Layout component contains the Bottom Navigation */}
        <Route element={<Layout />}>
          <Route path="/" element={<DayPlanner />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/meals" element={<Meals />} />
          
          {/* You can easily nest your Detail and Form screens here later */}
          {/* <Route path="/ingredients/:id" element={<IngredientDetail />} /> */}
          {/* <Route path="/meals/new" element={<CreateMealForm />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}