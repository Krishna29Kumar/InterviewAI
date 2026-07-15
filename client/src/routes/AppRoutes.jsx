import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Public Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Protected Pages
import Dashboard from '../pages/Dashboard';
import InterviewSetup from '../pages/InterviewSetup';
import InterviewSession from '../pages/InterviewSession';
import ProfilePage from '../pages/ProfilePage';
import AnalyticsPage from '../pages/AnalyticsPage';
import CompanyDSASetup from '../pages/CompanyDSASetup';
import CompanyDSASession from '../pages/CompanyDSASession';

import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes (Login, Register) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Pages */}
      <Route element={<MainLayout />}>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <InterviewSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dsa-practice/setup"
          element={
            <ProtectedRoute>
              <CompanyDSASetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dsa-practice/session"
          element={
            <ProtectedRoute>
              <CompanyDSASession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
