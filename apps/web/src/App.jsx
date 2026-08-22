import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import Agent from './pages/Agent';
import Integrations from './pages/Integrations';
import Calls from './pages/Calls';
import ApiKeys from './pages/ApiKeys';
import Settings from './pages/Settings';
import Modules from './pages/Modules';
import CRM from './pages/CRM';
import Appointments from './pages/Appointments';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="setup" element={<Setup />} />
        <Route path="agent" element={<Agent />} />
        <Route path="crm" element={<CRM />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="modules" element={<Modules />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="calls" element={<Calls />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
