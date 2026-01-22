import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Deals from "./pages/Deals";
import Contracts from "./pages/Contracts";
import Payments from "./pages/Payments";
import PaymentSuccess from "./pages/PaymentSuccess";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<Navigate to="/payments" replace />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/properties" element={
        <ProtectedRoute>
          <MainLayout>
            <Properties />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/properties/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <PropertyDetail />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/deals" element={
        <ProtectedRoute>
          <MainLayout>
            <Deals />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/contracts" element={
        <ProtectedRoute>
          <MainLayout>
            <Contracts />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/payments" element={
        <ProtectedRoute>
          <MainLayout>
            <Payments />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/chat" element={
        <ProtectedRoute>
          <MainLayout>
            <AIChat />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <MainLayout>
            <AdminDashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'hsl(0 0% 7%)',
              color: 'hsl(0 0% 95%)',
              border: '1px solid hsl(0 0% 18%)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
