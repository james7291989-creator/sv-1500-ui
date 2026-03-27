import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import your Pages - NOW WIRED TO THE CORRECT FILE
import LoginPage from './pages/LoginPage';
import AvailableDeals from './pages/AvailableDeals';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global styling wrapper for the dark luxury theme */}
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#C1A173] selection:text-black">
          <Routes>
            {/* 1. Default Route pushes everyone to the Vault Doors */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 2. Security Portal - NOW RENDERING LOGINPAGE */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 3. Investor View (The Fishing Net) */}
            <Route path="/available-deals" element={<AvailableDeals />} />
            
            {/* 4. CEO Command Center (Admin Only) */}
            <Route path="/ceo-dashboard" element={<AdminDashboard />} />
            
            {/* 5. Fallback: Catch any bad URLs and send them to Login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}