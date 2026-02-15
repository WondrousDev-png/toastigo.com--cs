import React from 'react';
import { Routes, Route } from 'react-router-dom';

// IMPORTS
import Layout from './components/Layout';
import Home from './pages/Home';
import Order from './pages/Order';
import Gallery from './pages/Gallery';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin'; // 1. IMPORT THE FILE

const App = () => {
  return (
    <Routes>
      {/* 2. ADD THE ADMIN ROUTE HERE (Outside Layout) */}
      <Route path="/admin" element={<Admin />} />

      {/* Public Website Routes (Wrapped in Layout) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="order" element={<Order />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="checkout" element={<Checkout />} />
        
        {/* Fallback for broken links */}
        <Route path="*" element={<div className="p-20 text-center font-bold">404: Page Not Found</div>} />
      </Route>
    </Routes>
  );
};

export default App;