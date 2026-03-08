import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
import {
    CACHE_TTL,
    hasDataChanged,
    readCacheSnapshot,
    readCachedValue,
    writeCachedValue,
} from '../utils/resourceCache';

const TransactionsContext = createContext();

const EMPTY_FINANCE_FIELDS = { articles: [], subarticles: [], subcategory: [] };

const safeArr = (x) => (Array.isArray(x) ? x : []);
const sortByDateDesc = (list) =>
    safeArr(list).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

const sortOrdersList = (list) =>
    safeArr(list).slice().sort((a, b) => {
        const aSeq = a?.orderSequence ?? Number.POSITIVE_INFINITY;
        const bSeq = b?.orderSequence ?? Number.POSITIVE_INFINITY;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return String(a?.numberOrder ?? a?.id ?? '').localeCompare(
            String(b?.numberOrder ?? b?.id ?? '')
        );
    });

const getCachedFinanceFields = () => {
    const cachedFields = readCachedValue('fieldsData', null);
    if (!cachedFields) return EMPTY_FINANCE_FIELDS;

    try {
        const allFields = withDefaults(cachedFields);
        return allFields.financeFields || EMPTY_FINANCE_FIELDS;
    } catch (_) {
        return EMPTY_FINANCE_FIELDS;
    }
};

export const useTransactions = () => {
    return useContext(TransactionsContext);
};

export const TransactionsProvider = ({ children, authReady, isAuthenticated }) => {
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

    const buildCounterparties = (employeesData, clientsData) => {
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

        return [...employeeCounterparties, ...clientCounterparties]
            .filter((c) => c.id && c.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const [transactions, setTransactions] = useState(() =>
        sortByDateDesc(readCachedValue('transactionsData', []))
    );
    const [assets, setAssets] = useState(() => safeArr(readCachedValue('assetsData', [])));
    const [financeFields, setFinanceFields] = useState(() => getCachedFinanceFields());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [initialDataForModal, setInitialDataForModal] = useState(null);
    const [orders, setOrders] = useState(() =>
        sortOrdersList(readCachedValue('ordersData', []))
    );
    const [counterparties, setCounterparties] = useState(() =>
        safeArr(readCachedValue('counterpartiesData', []))
    );
    const cacheWriteStateRef = useRef({
        transactions: false,
        assets: false,
        orders: false,
        counterparties: false,
    });

    useEffect(() => {
        if (!authReady || !isAuthenticated) return;

        let mounted = true;
        const loadAll = async () => {
            const fieldsSnapshot = readCacheSnapshot('fieldsData', { ttlMs: CACHE_TTL.fields });
            const transactionsSnapshot = readCacheSnapshot('transactionsData', {
                fallback: [],
                ttlMs: CACHE_TTL.transactions,
            });
            const assetsSnapshot = readCacheSnapshot('assetsData', {
                fallback: [],
                ttlMs: CACHE_TTL.assets,
            });
            const ordersSnapshot = readCacheSnapshot('ordersData', {
                fallback: [],
                ttlMs: CACHE_TTL.lists,
            });
            const employeesSnapshot = readCacheSnapshot('employees', {
                fallback: [],
                ttlMs: CACHE_TTL.lists,
            });
            const clientsSnapshot = readCacheSnapshot('clientsData', {
                fallback: [],
                ttlMs: CACHE_TTL.lists,
            });
            const counterpartiesSnapshot = readCacheSnapshot('counterpartiesData', {
                fallback: [],
                ttlMs: CACHE_TTL.lists,
            });

            if (fieldsSnapshot.hasData) {
                const cachedFinanceFields = (() => {
                    try {
                        return withDefaults(fieldsSnapshot.data).financeFields || EMPTY_FINANCE_FIELDS;
                    } catch (_) {
                        return EMPTY_FINANCE_FIELDS;
                    }
                })();
                setFinanceFields((prev) =>
                    hasDataChanged(prev, cachedFinanceFields) ? cachedFinanceFields : prev
                );
            }

            if (transactionsSnapshot.hasData) {
                const cachedTransactions = sortByDateDesc(
                    safeArr(transactionsSnapshot.data).map(normalizeTransaction)
                );
                setTransactions((prev) =>
                    hasDataChanged(prev, cachedTransactions) ? cachedTransactions : prev
                );
            }

            if (assetsSnapshot.hasData) {
                const cachedAssets = safeArr(assetsSnapshot.data);
                setAssets((prev) => (hasDataChanged(prev, cachedAssets) ? cachedAssets : prev));
            }

            if (ordersSnapshot.hasData) {
                const cachedOrders = sortOrdersList(ordersSnapshot.data);
                setOrders((prev) => (hasDataChanged(prev, cachedOrders) ? cachedOrders : prev));
            }

            if (counterpartiesSnapshot.hasData) {
                const cachedCounterparties = safeArr(counterpartiesSnapshot.data);
                setCounterparties((prev) =>
                    hasDataChanged(prev, cachedCounterparties) ? cachedCounterparties : prev
                );
            }

            const requests = [];

            if (!fieldsSnapshot.isFresh) {
                requests.push(['fields', fetchFields()]);
            }
            if (!transactionsSnapshot.isFresh) {
                requests.push(['transactions', apiFetchTransactions({ page: 1, pageSize: 1000 })]);
            }
            if (!assetsSnapshot.isFresh) {
                requests.push(['assets', fetchAssets()]);
            }
            if (!ordersSnapshot.isFresh) {
                requests.push(['orders', fetchOrders()]);
            }
            if (!employeesSnapshot.isFresh) {
                requests.push(['employees', fetchEmployees()]);
            }
            if (!clientsSnapshot.isFresh) {
                requests.push(['clients', fetchClients()]);
            }

            if (requests.length === 0) {
                if (!counterpartiesSnapshot.hasData) {
                    const builtFromCache = buildCounterparties(
                        safeArr(employeesSnapshot.data),
                        safeArr(clientsSnapshot.data)
                    );
                    setCounterparties((prev) =>
                        hasDataChanged(prev, builtFromCache) ? builtFromCache : prev
                    );
                    writeCachedValue('counterpartiesData', builtFromCache);
                }
                return;
            }

            const settled = await Promise.allSettled(requests.map(([, promise]) => promise));

            if (!mounted) return;

            const resultMap = new Map(
                requests.map(([key], index) => [key, settled[index]])
            );

            const fieldsRes = resultMap.get('fields');
            if (fieldsRes?.status === 'fulfilled') {
                const allFields = withDefaults(fieldsRes.value);
                const nextFinanceFields = allFields.financeFields || EMPTY_FINANCE_FIELDS;
                setFinanceFields((prev) =>
                    hasDataChanged(prev, nextFinanceFields) ? nextFinanceFields : prev
                );
                writeCachedValue('fieldsData', fieldsRes.value);
            } else if (fieldsRes?.status === 'rejected') {
                console.error('Ошибка при загрузке полей финансов:', fieldsRes.reason);
            }

            const transactionsRes = resultMap.get('transactions');
            if (transactionsRes?.status === 'fulfilled') {
                const raw = transactionsRes.value;
                const items = Array.isArray(raw?.items) ? raw.items : safeArr(raw);
                const normalized = sortByDateDesc(items.map(normalizeTransaction));
                setTransactions((prev) =>
                    hasDataChanged(prev, normalized) ? normalized : prev
                );
                writeCachedValue('transactionsData', normalized);
            } else if (transactionsRes?.status === 'rejected') {
                console.error('Ошибка при загрузке транзакций:', transactionsRes.reason);
            }

            const assetsRes = resultMap.get('assets');
            if (assetsRes?.status === 'fulfilled') {
                const nextAssets = safeArr(assetsRes.value);
                setAssets((prev) => (hasDataChanged(prev, nextAssets) ? nextAssets : prev));
                writeCachedValue('assetsData', nextAssets);
            } else if (assetsRes?.status === 'rejected') {
                console.error('Ошибка при загрузке активов:', assetsRes.reason);
            }

            const ordersRes = resultMap.get('orders');
            if (ordersRes?.status === 'fulfilled') {
                const rawOrders = ordersRes.value;
                const list = Array.isArray(rawOrders?.orders) ? rawOrders.orders : safeArr(rawOrders);
                const sorted = sortOrdersList(list);
                setOrders((prev) => (hasDataChanged(prev, sorted) ? sorted : prev));
                writeCachedValue('ordersData', sorted);
            } else if (ordersRes?.status === 'rejected') {
                console.error('Ошибка при загрузке заказов:', ordersRes.reason);
            }

            const employeesRes = resultMap.get('employees');
            const clientsRes = resultMap.get('clients');

            const employeesData =
                employeesRes?.status === 'fulfilled'
                    ? safeArr(employeesRes.value)
                    : safeArr(employeesSnapshot.data);
            const clientsData =
                clientsRes?.status === 'fulfilled'
                    ? safeArr(clientsRes.value)
                    : safeArr(clientsSnapshot.data);

            if (employeesRes?.status === 'fulfilled') {
                writeCachedValue('employees', employeesData);
            } else if (employeesRes?.status === 'rejected') {
                console.error('Ошибка при загрузке сотрудников для контрагентов:', employeesRes.reason);
            }

            if (clientsRes?.status === 'fulfilled') {
                writeCachedValue('clientsData', clientsData);
            } else if (clientsRes?.status === 'rejected') {
                console.error('Ошибка при загрузке клиентов для контрагентов:', clientsRes.reason);
            }

            const shouldRefreshCounterparties =
                !counterpartiesSnapshot.isFresh ||
                employeesRes?.status === 'fulfilled' ||
                clientsRes?.status === 'fulfilled';

            if (shouldRefreshCounterparties) {
                const allCounterparties = buildCounterparties(employeesData, clientsData);
                setCounterparties((prev) =>
                    hasDataChanged(prev, allCounterparties) ? allCounterparties : prev
                );
                writeCachedValue('counterpartiesData', allCounterparties);
            }
        };

        loadAll();

        return () => {
            mounted = false;
        };
    }, [authReady, isAuthenticated]);

    useEffect(() => {
        if (!cacheWriteStateRef.current.transactions) {
            cacheWriteStateRef.current.transactions = true;
            return;
        }
        writeCachedValue('transactionsData', transactions);
    }, [transactions]);

    useEffect(() => {
        if (!cacheWriteStateRef.current.assets) {
            cacheWriteStateRef.current.assets = true;
            return;
        }
        writeCachedValue('assetsData', assets);
    }, [assets]);

    useEffect(() => {
        if (!cacheWriteStateRef.current.orders) {
            cacheWriteStateRef.current.orders = true;
            return;
        }
        writeCachedValue('ordersData', orders);
    }, [orders]);

    useEffect(() => {
        if (!cacheWriteStateRef.current.counterparties) {
            cacheWriteStateRef.current.counterparties = true;
            return;
        }
        writeCachedValue('counterpartiesData', counterparties);
    }, [counterparties]);

    const refreshAssets = async () => {
        try {
            const nextAssets = safeArr(await fetchAssets());
            setAssets((prev) => (hasDataChanged(prev, nextAssets) ? nextAssets : prev));
            writeCachedValue('assetsData', nextAssets);
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

            const safeEmployees = safeArr(employeesData);
            const safeClients = safeArr(clientsData);
            const allCounterparties = buildCounterparties(safeEmployees, safeClients);
            writeCachedValue('employees', safeEmployees);
            writeCachedValue('clientsData', safeClients);
            setCounterparties((prev) =>
                hasDataChanged(prev, allCounterparties) ? allCounterparties : prev
            );
            writeCachedValue('counterpartiesData', allCounterparties);
        } catch (error) {
            console.error("Ошибка при обновлении контрагентов:", error);
        }
    };

    const refreshOrders = async () => {
        try {
            const rawOrders = await fetchOrders();
            const list = Array.isArray(rawOrders?.orders) ? rawOrders.orders : safeArr(rawOrders);
            const sorted = sortOrdersList(list);
            setOrders((prev) => (hasDataChanged(prev, sorted) ? sorted : prev));
            writeCachedValue('ordersData', sorted);
        } catch (error) {
            console.error("Ошибка при обновлении заказов:", error);
        }
    };
    
    const refreshAll = async () => {
        await Promise.all([refreshAssets(), refreshCounterparties(), refreshOrders()]);
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
        refreshAll, 
    };

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
};
