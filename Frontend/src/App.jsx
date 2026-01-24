// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionsProvider } from './context/TransactionsContext';

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
import AccessSettings from "./components/AccessSettings/AccessSettingsPage";
import TasksPage from "./components/TasksPage/TasksPage";

import ExecutorsPage from './components/Executors/ExecutorsPage';
import EmployeePage from './components/Employees/EmployeePage';
import RegularPaymentsPage from './components/RegularPayments/RegularPaymentsPage';
import CompaniesPage from './components/Companies/CompaniesPage.jsx';

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <TransactionsProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<ProtectedRoute element={<HomePage />} />} />
          <Route path="/orders" element={<ProtectedRoute element={<OrdersPage />} />} />
          <Route path="/executors" element={<ProtectedRoute element={<ExecutorsPage />} />} />
          <Route path="/employees" element={<ProtectedRoute element={<EmployeePage />} />} />
          <Route path="/journal" element={<ProtectedRoute element={<JournalPage />} />} />
          <Route path="/currency-rates" element={<ProtectedRoute element={<CurrencyRates />} />} />
          <Route path="/assets" element={<ProtectedRoute element={<AssetsPage />} />} />
          <Route path="/list" element={<ProtectedRoute element={<TransactionsPage />} />} />
          <Route path="/regular" element={<ProtectedRoute element={<RegularPaymentsPage />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/fields" element={<ProtectedRoute element={<FieldsPage />} />} />
          <Route path="/access" element={<ProtectedRoute element={<AccessSettings />} />} />
          <Route path="/tasks" element={<ProtectedRoute element={<TasksPage />} />} />
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
          {/* fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </TransactionsProvider>
    </ThemeProvider>
  );
}
