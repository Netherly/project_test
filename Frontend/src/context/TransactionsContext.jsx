import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchFields, withDefaults } from '../api/fields.js';
import {
    fetchTransactions as apiFetchTransactions,
    updateTransaction as apiUpdateTransaction,
    deleteTransaction as apiDeleteTransaction,
    duplicateTransaction as apiDuplicateTransaction,
} from '../api/transactions';
import { fetchAssets } from '../api/assets';
import { fetchOrders } from '../api/orders';
import { fetchClients } from '../api/clients';
import { fetchEmployees } from '../api/employees';

const TransactionsContext = createContext();

export const useTransactions = () => {
    return useContext(TransactionsContext);
};

export const TransactionsProvider = ({ children }) => {
    
    const safeArr = (x) => (Array.isArray(x) ? x : []);
    const sortByDateDesc = (list) =>
        safeArr(list).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    const normalizeTransaction = (trx) => {
        if (!trx || typeof trx !== 'object') return trx;
        const accountId =
            trx.accountId ??
            trx.account?.id ??
            (typeof trx.account === 'string' ? trx.account : null);
        const accountName = trx.accountName ?? trx.account?.accountName ?? '';
        const accountCurrency =
            trx.accountCurrency ?? trx.account?.currency?.code ?? trx.account?.currency ?? '';
        const category = trx.category ?? trx.categoryDict?.name ?? '';
        const subcategory = trx.subcategory ?? trx.subcategoryDict?.name ?? '';
        return {
            ...trx,
            accountId,
            account: accountId || trx.account,
            accountName,
            accountCurrency,
            category,
            subcategory,
        };
    };

    const buildRequisitesMap = (item) => {
        const raw = item?.requisites;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
        const list = safeArr(item?.requisitesList);
        if (!list.length) return {};
        const map = {};
        list.forEach((r) => {
            const currency = String(r?.currency ?? '').trim();
            if (!currency) return;
            if (!map[currency]) map[currency] = [];
            map[currency].push({
                bank: r?.bank ?? '',
                card: r?.card ?? '',
                owner: r?.owner ?? r?.holder ?? '',
            });
        });
        return map;
    };

    const buildPaymentDetailsMap = (item) => {
        const details = String(
            item?.payment_details ?? item?.paymentDetails ?? ''
        ).trim();
        if (!details) return null;
        const currency =
            String(item?.currency?.code ?? item?.currency?.name ?? item?.currency ?? '')
                .trim()
                .toUpperCase() || 'DEFAULT';
        return {
            [currency]: [{ text: details }],
        };
    };

    const readLocalList = (key) => {
        try {
            const saved = localStorage.getItem(key);
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    };

    const [transactions, setTransactions] = useState([]);

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
        const loadAll = async () => {
            const [
                fieldsRes,
                transactionsRes,
                assetsRes,
                ordersRes,
                employeesRes,
                clientsRes,
            ] = await Promise.allSettled([
                fetchFields(),
                apiFetchTransactions({ page: 1, pageSize: 1000 }),
                fetchAssets(),
                fetchOrders(),
                fetchEmployees(),
                fetchClients(),
            ]);

            if (!mounted) return;

            if (fieldsRes.status === 'fulfilled') {
                const allFields = withDefaults(fieldsRes.value);
                setFinanceFields(allFields.financeFields || { articles: [], subarticles: [], subcategory: [] });
            } else {
                console.error("Ошибка при загрузке полей финансов:", fieldsRes.reason);
            }

            if (transactionsRes.status === 'fulfilled') {
                const raw = transactionsRes.value;
                const items = Array.isArray(raw?.items) ? raw.items : safeArr(raw);
                const normalized = sortByDateDesc(items.map(normalizeTransaction));
                setTransactions(normalized);
            } else {
                console.error("Ошибка при загрузке транзакций:", transactionsRes.reason);
                setTransactions(sortByDateDesc(readLocalList("transactionsData")));
            }

            if (assetsRes.status === 'fulfilled') {
                const nextAssets = safeArr(assetsRes.value);
                setAssets(nextAssets);
            } else {
                console.error("Ошибка при загрузке активов:", assetsRes.reason);
                setAssets(readLocalList("assetsData"));
            }

            if (ordersRes.status === 'fulfilled') {
                const rawOrders = ordersRes.value;
                const list = Array.isArray(rawOrders?.orders) ? rawOrders.orders : safeArr(rawOrders);
                const sorted = list.slice().sort((a, b) => {
                    const aSeq = a?.orderSequence ?? Number.POSITIVE_INFINITY;
                    const bSeq = b?.orderSequence ?? Number.POSITIVE_INFINITY;
                    if (aSeq !== bSeq) return aSeq - bSeq;
                    return String(a?.numberOrder ?? a?.id ?? '').localeCompare(
                        String(b?.numberOrder ?? b?.id ?? '')
                    );
                });
                setOrders(sorted);
            } else {
                console.error("Ошибка при загрузке заказов:", ordersRes.reason);
                const fallback = readLocalList("ordersData");
                setOrders(fallback);
            }

            const employeesData =
                employeesRes.status === 'fulfilled' ? safeArr(employeesRes.value) : [];
            const clientsData =
                clientsRes.status === 'fulfilled' ? safeArr(clientsRes.value) : [];

            const employeeCounterparties = employeesData.map((emp) => {
                const name = emp?.full_name || emp?.fullName || '';
                return {
                    id: emp?.id,
                    type: 'employee',
                    name,
                    requisites: buildRequisitesMap(emp),
                };
            });

            const clientCounterparties = clientsData.map((client) => {
                const name = client?.name || client?.full_name || '';
                const paymentMap = buildPaymentDetailsMap(client);
                const baseMap = buildRequisitesMap(client);
                return {
                    id: client?.id,
                    type: 'client',
                    name,
                    requisites: paymentMap || baseMap,
                };
            });

            const allCounterparties = [...employeeCounterparties, ...clientCounterparties]
                .filter((c) => c.id && c.name)
                .sort((a, b) => a.name.localeCompare(b.name));
            setCounterparties(allCounterparties);
        };

        loadAll();

        return () => {
            mounted = false;
        };
    }, []); 

    
    useEffect(() => {
        try {
            localStorage.setItem("transactionsData", JSON.stringify(transactions));
        } catch (_) {}
    }, [transactions]);

    useEffect(() => {
        try {
            localStorage.setItem("assetsData", JSON.stringify(assets));
        } catch (_) {}
    }, [assets]);

    useEffect(() => {
        try {
            localStorage.setItem("ordersData", JSON.stringify(orders));
        } catch (_) {}
    }, [orders]);

    const refreshAssets = async () => {
        try {
            const nextAssets = safeArr(await fetchAssets());
            setAssets(nextAssets);
        } catch (error) {
            console.error("Ошибка при обновлении активов:", error);
        }
    };

    const refreshCounterparties = async () => {
        try {
            const [employeesData, clientsData] = await Promise.all([
                fetchEmployees(),
                fetchClients(),
            ]);

            const employeeCounterparties = safeArr(employeesData).map((emp) => {
                const name = emp?.full_name || emp?.fullName || '';
                return {
                    id: emp?.id,
                    type: 'employee',
                    name,
                    requisites: buildRequisitesMap(emp),
                };
            });

            const clientCounterparties = safeArr(clientsData).map((client) => {
                const name = client?.name || client?.full_name || '';
                const paymentMap = buildPaymentDetailsMap(client);
                const baseMap = buildRequisitesMap(client);
                return {
                    id: client?.id,
                    type: 'client',
                    name,
                    requisites: paymentMap || baseMap,
                };
            });

            const allCounterparties = [...employeeCounterparties, ...clientCounterparties]
                .filter((c) => c.id && c.name)
                .sort((a, b) => a.name.localeCompare(b.name));
            setCounterparties(allCounterparties);
        } catch (error) {
            console.error("Ошибка при обновлении контрагентов:", error);
        }
    };

    const addTransaction = async (newTransactions) => {
        try {
            const list = Array.isArray(newTransactions)
                ? newTransactions
                : newTransactions
                ? [newTransactions]
                : [];
            const normalized = list.map(normalizeTransaction);
            setTransactions((prev) => sortByDateDesc([...normalized, ...prev]));
            await refreshAssets();
        } catch (error) {
            console.error("Ошибка при добавлении транзакции:", error);
        }
    };

    const updateTransaction = async (updatedTransaction) => {
        try {
            const payload = { ...updatedTransaction };
            if (!payload.accountId && payload.account?.id) payload.accountId = payload.account.id;
            if (!payload.accountId && payload.account) payload.accountId = payload.account;
            delete payload.account;

            const saved = normalizeTransaction(
                await apiUpdateTransaction(updatedTransaction.id, payload)
            );
            setTransactions((prev) =>
                sortByDateDesc(prev.map((t) => (t.id === saved.id ? saved : t)))
            );
            await refreshAssets();
            closeViewEditModal();
        } catch (error) {
            console.error("Ошибка при обновлении транзакции:", error);
        }
    };

    const deleteTransaction = async (transactionId) => {
        try {
            await apiDeleteTransaction(transactionId);
            setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
            await refreshAssets();
            closeViewEditModal();
        } catch (error) {
            console.error("Ошибка при удалении транзакции:", error);
        }
    };

    const duplicateTransaction = async (transactionToDuplicate) => {
        try {
            const created = normalizeTransaction(
                await apiDuplicateTransaction(transactionToDuplicate.id)
            );
            setTransactions((prev) => sortByDateDesc([created, ...prev]));
            await refreshAssets();
        } catch (error) {
            console.error("Ошибка при дублировании транзакции:", error);
        }
    };

    const openAddTransactionModal = (defaults = null) => {
        refreshAssets();
        refreshCounterparties();
        setInitialDataForModal(defaults);
        setIsAddModalOpen(true);
    };
    
    const closeAddTransactionModal = () => {
        setInitialDataForModal(null);
        setIsAddModalOpen(false);
    };

    const openViewEditModal = (transaction) => {
        refreshAssets();
        refreshCounterparties();
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
