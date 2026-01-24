import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import ExecutorModal from './ExecutorModal/ExecutorModal.jsx';
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ExecutorCard from './ExecutorCard.jsx';
import OrderModal from '../modals/OrderModal/OrderModal.jsx';
import "../../styles/ExecutorsPage.css";
import * as executorService from './executorService.jsx';
import FormattedDate from "../FormattedDate.jsx";

// ИМПОРТ API ДЛЯ ПОЛЕЙ
import { fetchFields, withDefaults } from '../../api/fields'; 
import { fetchOrders, updateOrder } from '../../api/orders';
import { fetchTransactions } from '../../api/transactions';
import { fetchEmployees } from '../../api/employees';

// ... (функции getOrders, getJournalEntries и т.д. пока оставляем как есть, если нет API для заказов) ...
const buildJournalEntriesFromOrders = (orders = []) => {
    const entries = [];
    orders.forEach((order) => {
        const workLog =
            order?.workLog ??
            order?.work_log ??
            order?.meta?.workLog ??
            order?.meta?.work_log ??
            order?.meta?.worklog ??
            [];
        if (!Array.isArray(workLog)) return;
        const orderNumber = order.orderSequence ?? order.numberOrder ?? order.id;
        workLog.forEach((entry, idx) => {
            entries.push({
                id: entry?.id ?? entry?.original_id ?? `${order.id}-${idx}`,
                orderId: order.id,
                orderNumber,
                executorRole: entry?.executorRole ?? entry?.role ?? entry?.performer ?? '',
                role: entry?.role ?? entry?.executorRole ?? '',
                workDate: entry?.workDate ?? entry?.work_date ?? entry?.date ?? '',
                hours: entry?.hours ?? entry?.time ?? entry?.spentHours ?? '',
                workDone: entry?.workDone ?? entry?.description ?? '',
                description: entry?.description ?? order.orderDescription ?? '',
                startTime: entry?.startTime ?? entry?.start_time ?? '',
                endTime: entry?.endTime ?? entry?.end_time ?? '',
                email: entry?.email ?? '',
            });
        });
    });
    return entries;
};

    const getAssets = () => {
    try {
        const saved = localStorage.getItem('assetsData');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Ошибка при чтении активов из localStorage:", error);
        return [];
    }
};

const parseHoursToSeconds = (timeStr) => {
    if (typeof timeStr !== 'string' || !timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    return hours * 3600 + minutes * 60 + seconds;
};

const formatSecondsToHours = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year}`;
};

const ExecutorsPage = () => {
    const [executors, setExecutors] = useState(executorService.getExecutors());
    const [userSettings, setUserSettings] = useState({ currency: '₴' });
    const [modalExecutor, setModalExecutor] = useState(null); 
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [viewMode, setViewMode] = useState('card');
    
    // Стейт для полей
    const [fields, setFields] = useState({ currency: [], role: [] });
    
    const [transactions, setTransactions] = useState([]);
    const [assets, setAssets] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalOpen, setOrderModalOpen] = useState(false);

    const handleOpenOrderModal = (orderId) => {
        const fullOrder = orders.find(o => String(o.id) === String(orderId));
        if (fullOrder) {
            setSelectedOrder(fullOrder);
            setOrderModalOpen(true);
        } else {
            console.error("Не удалось найти заказ с ID:", orderId);
        }
    };

    const handleCloseOrderModal = () => {
        setOrderModalOpen(false);
        setSelectedOrder(null);
    };

    // --- ИСПРАВЛЕННЫЙ EFFECT: ЗАГРУЗКА ПОЛЕЙ ЧЕРЕЗ API ---
    useEffect(() => {
        // 1. Загружаем локальные данные (активы и т.д.)
        setAssets(getAssets());

        const loadOrders = async () => {
            try {
                const response = await fetchOrders({ page: 1, limit: 1000 });
                const list = Array.isArray(response?.orders) ? response.orders : [];
                const filtered = list.filter((order) => String(order.stage) !== 'LEAD');
                const sorted = filtered.slice().sort((a, b) => {
                    const aSeq = a?.orderSequence ?? Number.POSITIVE_INFINITY;
                    const bSeq = b?.orderSequence ?? Number.POSITIVE_INFINITY;
                    if (aSeq !== bSeq) return aSeq - bSeq;
                    return String(a?.numberOrder ?? a?.id ?? '').localeCompare(
                        String(b?.numberOrder ?? b?.id ?? '')
                    );
                });
                setOrders(sorted);
                setJournalEntries(buildJournalEntriesFromOrders(sorted));
                localStorage.setItem('ordersData', JSON.stringify(sorted));
            } catch (error) {
                console.error("Ошибка при загрузке заказов с сервера:", error);
                try {
                    const savedOrders = localStorage.getItem('ordersData');
                    const fallbackOrders = savedOrders ? JSON.parse(savedOrders) : [];
                    setOrders(fallbackOrders);
                    setJournalEntries(buildJournalEntriesFromOrders(fallbackOrders));
                } catch {
                    setOrders([]);
                    setJournalEntries([]);
                }
            }
        };

        const loadTransactions = async () => {
            try {
                const response = await fetchTransactions({ page: 1, pageSize: 1000 });
                const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
                setTransactions(items);
                localStorage.setItem('transactionsData', JSON.stringify(items));
            } catch (error) {
                console.error("Ошибка при загрузке транзакций:", error);
                try {
                    const saved = localStorage.getItem('transactionsData');
                    setTransactions(saved ? JSON.parse(saved) : []);
                } catch {
                    setTransactions([]);
                }
            }
        };

        const loadEmployees = async () => {
            try {
                const list = await fetchEmployees();
                setActiveEmployees(list.filter(emp => emp.status === 'active'));
                localStorage.setItem('employees', JSON.stringify(list));
            } catch (error) {
                console.error("Ошибка при загрузке сотрудников:", error);
                try {
                    const employeesFromStorage = JSON.parse(localStorage.getItem('employees')) || [];
                    setActiveEmployees(employeesFromStorage.filter(emp => emp.status === 'active'));
                } catch {
                    setActiveEmployees([]);
                }
            }
        };

        // 2. Загружаем поля (Валюту и Роли) с сервера
        const loadFields = async () => {
            try {
                // Запрос к API
                const rawFields = await fetchFields();
                // Нормализация (добавление дефолтных значений, если пусто)
                const allFields = withDefaults(rawFields);

                // Обновляем стейт, выбирая нужные секции
                setFields({
                    // Валюта находится в generalFields
                    currency: allFields.generalFields?.currency || [],
                    // Роли находятся в executorFields
                    role: allFields.executorFields?.role || []
                });

            } catch (err) {
                console.error("Failed to load fields from API", err);
                
                // Fallback: Если API упал, пробуем достать старые данные из localStorage (на всякий случай)
                const savedFields = localStorage.getItem('fieldsData');
                if (savedFields) {
                    try {
                        const parsed = JSON.parse(savedFields);
                        setFields({
                            currency: parsed.generalFields?.currency || [],
                            role: parsed.executorFields?.role || []
                        });
                    } catch (e) { console.error(e); }
                }
            }
        };

        loadFields();
        loadOrders();
        loadTransactions();
        loadEmployees();
    }, []);
    // -----------------------------------------------------

    const closeModal = () => setModalExecutor(null); 

    const generateId = () => 'perf_' + Date.now() + Math.random().toString(36).substring(2, 9);
    
    const handleSaveExecutor = async (executorData) => {
        const isNew = !executorData.id;
        
        const orderId = executorData.orderId || executorData.orderNumber;
        const performerEmployee = activeEmployees.find(
            (emp) => String(emp.fullName) === String(executorData.performer)
        );
        const updatedOrders = orders.map(order => {
            if (String(order.id) === String(orderId)) {
                let updatedPerformers;
                if (isNew) {
                    const newExecutor = {
                        ...executorData,
                        id: generateId(),
                        orderId: order.id,
                        orderNumber: order.orderSequence ?? order.numberOrder ?? order.id,
                        employeeId: performerEmployee?.id || null,
                        orderStatus: "В работе",
                        orderStatusEmoji: "⏳",
                        orderDate: formatDate(executorData.dateForPerformer || new Date()),
                    };
                    updatedPerformers = [...(order.performers || []), newExecutor];
                } else {
                    updatedPerformers = (order.performers || []).map(p =>
                        String(p.id) === String(executorData.id)
                            ? {
                                  ...p,
                                  ...executorData,
                                  orderId: order.id,
                                  orderNumber: order.orderSequence ?? order.numberOrder ?? order.id,
                                  employeeId: performerEmployee?.id || p.employeeId || null,
                              }
                            : p
                    );
                }
                const nextOrder = { ...order, performers: updatedPerformers };
                try {
                    updateOrder(order.id, { performers: updatedPerformers }).catch((error) => {
                        console.error("Ошибка сохранения исполнителя в заказе:", error);
                    });
                } catch (error) {
                    console.error("Ошибка сохранения исполнителя в заказе:", error);
                }
                return nextOrder;
            }
            return order;
        });

        setOrders(updatedOrders);
        localStorage.setItem('ordersData', JSON.stringify(updatedOrders));
        closeModal();
    };
    
    const handleDeleteExecutor = async (executorToDelete) => {
        const orderId = executorToDelete.orderId || executorToDelete.orderNumber;
        const updatedOrders = orders.map(order => {
            if (String(order.id) === String(orderId)) {
                const updatedPerformers = (order.performers || []).filter(
                    p => String(p.id) !== String(executorToDelete.id)
                );
                const nextOrder = { ...order, performers: updatedPerformers };
                try {
                    updateOrder(order.id, { performers: updatedPerformers }).catch((error) => {
                        console.error("Ошибка удаления исполнителя из заказа:", error);
                    });
                } catch (error) {
                    console.error("Ошибка удаления исполнителя из заказа:", error);
                }
                return nextOrder;
            }
            return order;
        });

        setOrders(updatedOrders);
        localStorage.setItem('ordersData', JSON.stringify(updatedOrders));
        closeModal();
    };

    const enrichedExecutors = useMemo(() => {
        const allPerformers = orders.flatMap(order =>
            (order.performers && Array.isArray(order.performers))
                ? order.performers.map(performer => ({
                    ...performer,
                    orderId: order.id,
                    orderNumber: order.orderSequence ?? order.numberOrder ?? order.id,
                    orderName: order.name || order.title || 'Название заказа отсутствует',
                    order_main_client: order.clientName || order.orderMainClient || order.name || 'Не заполнено',
                    orderDescription: order.orderDescription,
                }))
                : []
        );

        return allPerformers.map(performer => {
            const relevantEntries = journalEntries.filter(
                entry => entry.executorRole === performer.performer &&
                    String(entry.orderNumber) === String(performer.orderNumber)
            );

            const totalSecondsWorked = relevantEntries.reduce(
                (total, entry) => total + parseHoursToSeconds(entry.hours), 0
            );

            const totalHoursDecimal = totalSecondsWorked / 3600;
            const paymentDue = totalHoursDecimal * (performer.hourlyRate || 0);

            return {
                ...performer,
                calculatedWorkTime: formatSecondsToHours(totalSecondsWorked),
                calculatedPaymentDue: paymentDue,
            };
        });
    }, [orders, journalEntries]);


    const executorsByPerformer = enrichedExecutors.reduce((acc, executor) => {
        if (!acc[executor.performer]) {
            acc[executor.performer] = [];
        }
        acc[executor.performer].push(executor);
        return acc;
    }, {});

    const formFields = {
        employees: activeEmployees,
        role: fields.role,
        currency: fields.currency,
    };

    return (
        <>
            <div className="executors-page">
                <Sidebar />
                <div className="executors-page-main-container">
                    <header className="executors-header-container">
                        <h1 className="executors-title">
                            <PageHeaderIcon pageName={'Исполнители'}/>Исполнители
                        </h1>
                         <div className="view-mode-buttons">
                             <button
                                 className={`view-mode-button ${viewMode === 'card' ? 'active' : ''}`}
                                 onClick={() => setViewMode('card')}
                                 title="Карточный вид"
                             >
                                 &#x25A3;
                             </button>
                             <button
                                 className={`view-mode-button ${viewMode === 'table' ? 'active' : ''}`}
                                 onClick={() => setViewMode('table')}
                                 title="Табличный вид"
                             >
                                 &#x2261;
                             </button>
                         </div>
                        <div className="add-executor-wrapper">
                            <button className="add-executor-button" onClick={() => setModalExecutor({})}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus">
                                    <path d="M5 12h14" /><path d="M12 5v14" />
                                </svg>
                                Добавить
                            </button>
                        </div>
                    </header>
                    <div className="executors-content">
                        {viewMode === 'table' && (
                            <div className="executors-table-container">
                                <table className="executors-table">
                                    <thead>
                                        <tr>
                                            <th>Номер заказа</th>
                                            <th>Статус заказа</th>
                                            <th>Дата заказа</th>
                                            <th>Описание</th>
                                            <th>Клиент</th>
                                            <th>Исполнитель</th>
                                            <th>Роль в заказе</th>
                                            <th>Валюта</th>
                                            <th>Сумма</th>
                                            <th>В час</th>
                                            <th>Остаток оплаты</th>
                                            <th>Время работы</th>
                                            <th>Сумма({userSettings.currency})</th>
                                            <th>В час({userSettings.currency})</th>
                                            <th>Сумма оплаты({userSettings.currency})</th>
                                            <th>Остаток оплаты({userSettings.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="table-spacer-row"><td colSpan={16}></td></tr>
                                        {enrichedExecutors.map((executor) => (
                                            <tr key={executor.id} className="executor-row" onClick={() => setModalExecutor(executor)}>
                                                <td>{executor.orderNumber}</td>
                                                <td><span title={executor.orderStatus}>{executor.orderStatusEmoji}</span></td>
                                                <td>{formatDate(executor.orderDate)}</td>
                                                <td>{executor.orderDescription}</td>
                                                <td>{executor.clientHidden ? "Не заполнено" : executor.order_main_client}</td>
                                                <td>{executor.performer}</td>
                                                <td>{executor.performerRole}</td>
                                                <td>{executor.orderCurrency}</td>
                                                <td>{executor.orderSum}</td>
                                                <td>{executor.hourlyRate}</td>
                                                <td>{executor.calculatedPaymentDue}</td>
                                                <td>{executor.calculatedWorkTime}</td>
                                                <td>{executor.orderSum}</td>
                                                <td>{executor.hourlyRate}</td>
                                                <td>{executor.paymentSum}</td>
                                                <td>{executor.calculatedPaymentDue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {viewMode === 'card' && (
                            <div className="executors-cards-container">
                                {Object.entries(executorsByPerformer).map(([performerName, orders]) => (
                                    <div key={performerName} className="performer-group">
                                        <h2 className="performer-name-card">{performerName}</h2>
                                        <div className="performer-orders-grid">
                                            {orders.map(order => (
                                                <ExecutorCard
                                                    key={order.id}
                                                    order={order}
                                                    userSettings={userSettings}
                                                    onCardClick={setModalExecutor}
                                                    onOpenOrderModal={handleOpenOrderModal}
                                                    formatDate={formatDate}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {modalExecutor && (
                        <ExecutorModal
                            key={modalExecutor.id || 'new-executor'}
                            executor={modalExecutor.id ? modalExecutor : null}
                            onSave={handleSaveExecutor}
                            onDelete={handleDeleteExecutor}
                            onClose={closeModal}
                            journalEntries={journalEntries}
                            transactions={transactions}
                            orders={orders}
                            fields={formFields}
                        />
                    )}
                </div>
            </div>
            {isOrderModalOpen && (
                <OrderModal
                    order={selectedOrder}
                    onClose={handleCloseOrderModal}
                    journalEntries={journalEntries}
                />
            )}
        </>
    );
};

export default ExecutorsPage;
