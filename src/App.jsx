import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will build these two new pages next
import Today from './pages/Today'; 
import Planner from './pages/Planner';
import Ingredients from './pages/Ingredients';
import Meals from './pages/Meals';
import Users from './pages/Users';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}