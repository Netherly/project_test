// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionsProvider } from './context/TransactionsContext';
import { api } from './api/api';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OrdersPage from './components/Orders/OrdersPage';
import JournalPage from './components/Journal/JournalPage';
import ClientsPage from './pages/ClientsPage';
import CurrencyRates from "./components/CurrencyRates/CurrencyRates";
import AssetsPage from "./components/Assets/AssetsPage";
import TransactionsPage from "./components/Transaction/TransactionsPage";
import Profile from "./components/Profile/Profile";
import FieldsPage from "./pages/FieldsPage";
import FixesPage from "./components/Fixes/FixesPage";
import AccessSettings from "./components/AccessSettings/AccessSettingsPage";
import TasksPage from "./components/TasksPage/TasksPage";

import ExecutorsPage from './components/Executors/ExecutorsPage';
import EmployeePage from './components/Employees/EmployeePage';
import EmployeeDetailsPage from './components/Employees/EmployeeDetailsPage';
import RegularPaymentsPage from './components/RegularPayments/RegularPaymentsPage';
import CompaniesPage from './components/Companies/CompaniesPage.jsx';
import ClientDetailsPage from './pages/ClientDetailsPage';

const decodeToken = (token) => {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now() + 5000;
};

export default function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && isTokenValid(token)) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        await api.refresh();
      } catch {
        try { localStorage.removeItem('token'); } catch {}
      } finally {
        if (active) setAuthReady(true);
      }
    };
    initAuth();
    return () => { active = false; };
  }, []);

  const ProtectedRoute = ({ element }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshFailed, setRefreshFailed] = useState(false);
    const token = localStorage.getItem('token');
    const valid = token && isTokenValid(token);

    useEffect(() => {
      if (!authReady || valid || refreshing || refreshFailed) return;
      let active = true;
      setRefreshing(true);
      api.refresh()
        .catch(() => {
          if (active) setRefreshFailed(true);
        })
        .finally(() => {
          if (active) setRefreshing(false);
        });
      return () => { active = false; };
    }, [authReady, valid, refreshing, refreshFailed]);

    if (!authReady || refreshing) return null;
    const nextToken = localStorage.getItem('token');
    return nextToken && isTokenValid(nextToken) ? element : <Navigate to="/login" replace />;
  };

  const LoginRoute = () => {
    if (!authReady) return null;
    const token = localStorage.getItem('token');
    return token && isTokenValid(token) ? <Navigate to="/dashboard" replace /> : <LoginPage />;
  };

  useEffect(() => {
    if (!authReady) return;
    const timer = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token || isTokenValid(token)) return;
      try {
        await api.refresh();
      } catch {
        try { localStorage.removeItem('token'); } catch {}
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [authReady]);

  return (
    <ThemeProvider>
      <TransactionsProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<HomePage />} />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/orders/:orderId?" element={<ProtectedRoute element={<OrdersPage />} />} />
          <Route path="/executors/:executorId?" element={<ProtectedRoute element={<ExecutorsPage />} />} />
          <Route path="/employees" element={<ProtectedRoute element={<EmployeePage />} />} />
          <Route path="/employees/:employeeId" element={<ProtectedRoute element={<EmployeeDetailsPage />} />} />
          <Route path="/journal/:entryId?" element={<ProtectedRoute element={<JournalPage />} />} />
          <Route path="/currency-rates" element={<ProtectedRoute element={<CurrencyRates />} />} />
          <Route path="/assets/:assetId?" element={<ProtectedRoute element={<AssetsPage />} />} />
          <Route path="/list/:transactionId?" element={<ProtectedRoute element={<TransactionsPage />} />} />
          <Route path="/regular/:paymentId?" element={<ProtectedRoute element={<RegularPaymentsPage />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/fields" element={<ProtectedRoute element={<FieldsPage />} />} />
          <Route path="/access/:subPage?" element={<ProtectedRoute element={<AccessSettings />} />} />
          <Route path="/tasks" element={<ProtectedRoute element={<TasksPage />} />} />
          <Route path="/fixes" element={<ProtectedRoute element={<FixesPage />} />} />
          <Route path="/company" element={<ProtectedRoute element={<CompaniesPage/>}/>}/>
          <Route
            path="/clients"
            element={
              <ProtectedRoute
                element={
                  <ClientsPage
                  />
                }
              />
            }
          />
          <Route
            path="/clients/:clientId"
            element={<ProtectedRoute element={<ClientDetailsPage />} />}
          />
          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TransactionsProvider>
    </ThemeProvider>
  );
}
