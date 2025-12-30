import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchFields, withDefaults } from '../api/fields.js';
import { sampleClients } from '../data/sampleClients';

const TransactionsContext = createContext();

export const useTransactions = () => {
    return useContext(TransactionsContext);
};

export const TransactionsProvider = ({ children }) => {
    
    const defaultTransactions = [];

    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem("transactionsData");
        if (saved) {
            try {
                return JSON.parse(saved).sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (e) {
                console.error("Ошибка парсинга транзакций из localStorage:", e);
                return defaultTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        }
        return defaultTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const [assets, setAssets] = useState([]);
    
    const [financeFields, setFinanceFields] = useState({ articles: [], subarticles: [], subcategory: [] });
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [initialDataForModal, setInitialDataForModal] = useState(null);
    const [orders, setOrders] = useState([]);
    const [counterparties, setCounterparties] = useState([]);

    
    useEffect(() => {
        let mounted = true;

        const savedAssets = localStorage.getItem('assetsData');
        if (savedAssets) setAssets(JSON.parse(savedAssets));

        const savedOrders = localStorage.getItem('ordersData');
        if (savedOrders) {
            try {
                setOrders(JSON.parse(savedOrders));
            } catch (e) {
                console.error("Ошибка парсинга заказов из localStorage:", e);
            }
        }

        const loadCounterparties = () => {
            const savedEmployees = localStorage.getItem('employees');
            const employees = savedEmployees ? JSON.parse(savedEmployees) : [];

            const employeeCounterparties = employees.map(emp => ({
                id: emp.id,
                type: 'employee', 
                name: emp.fullName,
                requisites: emp.requisites || {} 
            }));

            const clientCounterparties = sampleClients.map(client => ({
                id: client.id,
                type: 'client',
                name: client.name,
                requisites: client.requisites || {} 
            }));

            const allCounterparties = [...employeeCounterparties, ...clientCounterparties]
                .sort((a, b) => a.name.localeCompare(b.name));

            setCounterparties(allCounterparties);
        };
        loadCounterparties();

        // ИЗМЕНЕНИЕ: Загрузка через новый API
        const fetchFinanceFields = async () => {
            try {
                // 1. Загружаем всё
                const rawData = await fetchFields();
                // 2. Нормализуем
                const allFields = withDefaults(rawData);
                // 3. Берем только финансы
                const data = allFields.financeFields;
                
                if (mounted) {
                    setFinanceFields(data || { articles: [], subarticles: [], subcategory: [] });
                }
            } catch (error) {
                console.error("Ошибка при загрузке полей финансов:", error);
            }
        };

        fetchFinanceFields();

        return () => {
            mounted = false;
        };
    }, []); 

    
    useEffect(() => {
        localStorage.setItem("transactionsData", JSON.stringify(transactions));
        updateAssetsInLocalStorage(transactions);
    }, [transactions]);


    const updateAssetsInLocalStorage = (updatedTransactions) => {
        const savedAssets = JSON.parse(localStorage.getItem('assetsData')) || [];
        const updatedAssets = savedAssets.map(asset => {
            const assetTransactions = updatedTransactions.filter(t => t.account === asset.id);
            const totalIncoming = assetTransactions.filter(t => t.operation === 'Зачисление').reduce((sum, t) => sum + Number(t.amount), 0);
            const totalOutgoing = assetTransactions.filter(t => t.operation === 'Списание').reduce((sum, t) => sum + Number(t.amount), 0);
            const newBalance = (Number(asset.turnoverStartBalance) + totalIncoming - totalOutgoing).toFixed(2);
            return { ...asset, balance: parseFloat(newBalance), turnoverIncoming: totalIncoming, turnoverOutgoing: totalOutgoing, turnoverEndBalance: parseFloat(newBalance) };
        });
        localStorage.setItem('assetsData', JSON.stringify(updatedAssets));
    };

    const addTransaction = (newTransactions) => {
        const transactionsToAdd = Array.isArray(newTransactions) ? newTransactions : [newTransactions];
        const updated = [...transactions, ...transactionsToAdd];
        setTransactions(updated.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const updateTransaction = (updatedTransaction) => {
        const updatedList = transactions.map(t => (t.id === updatedTransaction.id ? updatedTransaction : t));
        setTransactions(updatedList.sort((a, b) => new Date(b.date) - new Date(a.date)));
        closeViewEditModal();
    };

    const deleteTransaction = (transactionId) => {
        setTransactions(transactions.filter(t => t.id !== transactionId));
        closeViewEditModal(); 
    };

    const duplicateTransaction = (transactionToDuplicate) => {
        const newTransaction = {
            ...transactionToDuplicate,
            id: `DUPLICATE_${Date.now()}`,
            description: `(Копия) ${transactionToDuplicate.description}`,
            date: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        addTransaction(newTransaction); 
    };

    const openAddTransactionModal = (defaults = null) => {
        setInitialDataForModal(defaults);
        setIsAddModalOpen(true);
    };
    
    const closeAddTransactionModal = () => {
        setInitialDataForModal(null);
        setIsAddModalOpen(false);
    };

    const openViewEditModal = (transaction) => {
        setSelectedTransaction(transaction);
        setIsViewEditModalOpen(true);
    };

    const closeViewEditModal = () => {
        setSelectedTransaction(null);
        setIsViewEditModalOpen(false);
    };

    
    const value = {
        transactions,
        assets,
        financeFields,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        duplicateTransaction,
        isAddModalOpen,
        isViewEditModalOpen,
        selectedTransaction,
        initialDataForModal,
        openAddTransactionModal,
        closeAddTransactionModal,
        openViewEditModal,
        closeViewEditModal,
        orders,
        counterparties,
    };

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
};