import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Assume a HomePage component exists for "/"
import LoginPage from './pages/LoginPage'; // Assume this component corresponds to "/auth/login"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
