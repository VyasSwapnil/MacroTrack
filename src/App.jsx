import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will build these two new pages next
import Today from './pages/Today'; 
import Planner from './pages/Planner';
import Ingredients from './pages/Ingredients';
import Meals from './pages/Meals';
import Users from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}