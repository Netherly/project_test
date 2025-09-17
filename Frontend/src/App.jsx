// src/App.jsx
import React, { useState, useEffect } from 'react';
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
import TasksPage from "./components/TasksPage/TasksPage"

import { sampleClients } from './data/sampleClients';
import ExecutorsPage from './components/Executors/ExecutorsPage';
import EmployeePage from './components/Employees/EmployeePage';
import RegularPaymentsPage from './components/RegularPayments/RegularPaymentsPage';
import { PaymentChecker } from './components/RegularPayments/PaymentChecker';

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default function App() {
  const [clients, setClients] = useState(sampleClients);

  // Примеры справочников для формы клиента
  const [companies, setCompanies] = useState([
    { id: 1, name: 'ООО «Ромашка»' },
    { id: 2, name: 'Acme Corp' },
  ]);
  const [employees] = useState([
    { id: 1, full_name: 'Петров Пётр' },
    { id: 2, full_name: 'Сидорова Светлана' },
  ]);
  const [referrers] = useState([
    { id: 1, name: 'Яндекс.Директ' },
    { id: 2, name: 'Google Ads' },
  ]);
  const [countries] = useState([
    'Украина',
    'Россия',
    'Белоруссия',
    'Бразилия',
    'Германия',
    'Израиль',
    'Индонезия',
    'Испания',
    'Казахстан',
    'Канада',
    'Кыргызстан',
    'Латвия',
    'Мексика',
    'ОАЭ',
    'Польша',
    'США',
    'Таджикистан',
    'Узбекистан',
    'Чехия',
    'Япония',
    'Неизвестно'
]
);
  const [currencies] = useState(['RUB', 'UAH', 'USD', 'EUR','USDT']);

  // Создать или обновить клиента
  const handleSaveClient = data => {
    if (data.id) {
      setClients(prev =>
        prev.map(c => (c.id === data.id ? data : c))
      );
      return data;
    } else {
      const newClient = { ...data, id: clients.length + 1 };
      setClients(prev => [newClient, ...prev]);
      return newClient;
    }
  };

  // Добавить компанию (примерно, без API)
  const handleAddCompany = async newCompany => {
    const created = { ...newCompany, id: companies.length + 1 };
    setCompanies(prev => [...prev, created]);
    return created;
  };

  return (
    <ThemeProvider>
      <TransactionsProvider>
        <PaymentChecker />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/home"
          element={<ProtectedRoute element={<HomePage />} />}
        />
        <Route
          path="/orders"
          element={<ProtectedRoute element={<OrdersPage />} />}
        />
        <Route 
          path="/executors" 
          element={<ProtectedRoute element={<ExecutorsPage />} />}
        />
        <Route 
            path="/employees" 
            element={<ProtectedRoute element={<EmployeePage />} />}
        />
        <Route
          path="/journal"
          element={<ProtectedRoute element={<JournalPage />} />}
        />
        <Route 
          path="/currency-rates"
          element={<ProtectedRoute element={<CurrencyRates />} />}
        />
        <Route 
          path="/assets" 
          element={<ProtectedRoute element={<AssetsPage />} />}
        />
        <Route 
          path="/list" 
          element={<ProtectedRoute element={<TransactionsPage />} />}
        />
        <Route 
            path="/regular" 
            element={<ProtectedRoute element={<RegularPaymentsPage />} />}
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute element={<Profile />} />}
        />
        <Route 
          path="/fields" 
          element={<ProtectedRoute element={<FieldsPage />} />}
        />
        <Route
          path="/access"
          element={<ProtectedRoute element={<AccessSettings />} />}
        />
        <Route
          path="/tasks"
          element={<ProtectedRoute element={<TasksPage />} />}
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute
              element={
                <ClientsPage
                  clients={clients}
                  onSaveClient={handleSaveClient}
                  onAddCompany={handleAddCompany}
                  companies={companies}
                  employees={employees}
                  referrers={referrers}
                  countries={countries}
                  currencies={currencies}
                />
              }
            />
          }
        />
         
      </Routes>
      </TransactionsProvider>
    </ThemeProvider>
  );
}