import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import AddExecutorModal from './AddExecutorModal.jsx'; 
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ExecutorCard from './ExecutorCard.jsx';
import ExecutorEditModal from './ExecutorEditModal.jsx';
import OrderModal from '../modals/OrderModal/OrderModal.jsx';
import "../../styles/ExecutorsPage.css";
import * as executorService from './executorService.jsx';


const getOrders = () => {
    try {
        const savedOrders = localStorage.getItem('ordersData');
        return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (error) {
        console.error("Ошибка при чтении заказов из localStorage:", error);
        return [];
    }
};


const getJournalEntries = () => {
    try {
        const savedEntries = localStorage.getItem('journalEntries');
        return savedEntries ? JSON.parse(savedEntries) : [];
    } catch (error) {
        console.error("Ошибка при чтении журнала из localStorage:", error);
        return [];
    }
};
const getTransactions = () => {
    try {
        const saved = localStorage.getItem('transactionsData');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Ошибка при чтении транзакций из localStorage:", error);пше
        return [];
    }
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

const ExecutorsPage = () => {
    const [executors, setExecutors] = useState(executorService.getExecutors());
    const [userSettings, setUserSettings] = useState({ currency: '₴' });
    const [editingOrder, setEditingOrder] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [viewMode, setViewMode] = useState('card');
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

    useEffect(() => {
        setOrders(getOrders());
        setJournalEntries(getJournalEntries());

        setTransactions(getTransactions());
        setAssets(getAssets());

        const employeesFromStorage = JSON.parse(localStorage.getItem('employees')) || [];
        setActiveEmployees(employeesFromStorage.filter(emp => emp.status === 'active'));

        const savedFields = localStorage.getItem('fieldsData');
        if (savedFields) {
            try {
                const parsedFields = JSON.parse(savedFields);
                if (parsedFields.executorFields) {
                    setFields(parsedFields.executorFields);
                }
            } catch (e) {
                console.error("Ошибка парсинга полей из localStorage:", e);
            }
        }
    }, []);

    const handleOpenEditModal = (order) => setEditingOrder(order);
    const handleCloseEditModal = () => setEditingOrder(null);

    const handleAddExecutor = (newExecutor, targetOrderId) => {

        const targetOrder = orders.find(order => String(order.id) === String(targetOrderId));

        if (!targetOrder) {
            console.error("Не удалось найти заказ для добавления исполнителя.");
            return;
        }


        const updatedPerformers = [...(targetOrder.performers || []), newExecutor];


        const updatedOrders = orders.map(order =>
            String(order.id) === String(targetOrderId)
                ? { ...order, performers: updatedPerformers }
                : order
        );


        setOrders(updatedOrders);


        localStorage.setItem('ordersData', JSON.stringify(updatedOrders));
    };

    const handleUpdateExecutor = (updatedOrder) => {
        const updatedList = executorService.updateExecutor(updatedOrder);
        setExecutors(updatedList);
        setEditingOrder(null);
    };

    const handleDeleteExecutor = (orderId) => {
        const updatedList = executorService.deleteExecutor(orderId);
        setExecutors(updatedList);
        setEditingOrder(null);
    };

    const handleDuplicateExecutor = (orderToDuplicate) => {
        const updatedList = executorService.duplicateExecutor(orderToDuplicate);
        setExecutors(updatedList);
    };


    const enrichedExecutors = useMemo(() => {

        const allPerformers = orders.flatMap(order =>

            (order.performers && Array.isArray(order.performers))
                ? order.performers.map(performer => ({
                    ...performer,

                    orderId: order.id,
                    orderNumber: order.id,
                    orderName: order.name || 'Название заказа отсутствует',
                    order_main_client: order.order_main_client,
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
                        <h1 className="executors-title">Исполнители</h1>
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
                            <button className="add-executor-button" onClick={() => setIsAddModalOpen(true)}>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="24" 
                                    height="24" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="lucide lucide-plus-icon lucide-plus">
                                        <path d="M5 12h14" /><path d="M12 5v14" />
                                </svg> 
                                Добавить исполнителя
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
                                            <th>Описание заказа</th>
                                            <th>Клиент</th>
                                            <th>Исполнитель</th>
                                            <th>Роль в заказе</th>
                                            <th>Валюта заказа</th>
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
                                        {enrichedExecutors.map((executor) => (
                                            <tr key={executor.id} className="executor-row" onClick={() => handleOpenEditModal(executor)}>
                                                <td>{executor.orderNumber}</td>
                                                <td><span title={executor.orderStatus}>{executor.orderStatusEmoji}</span></td>
                                                <td>{executor.orderDate}</td>
                                                <td>{executor.orderDescription}</td>
                                                <td>{executor.clientHidden ? "Не заполнено" : executor.order_main_client}</td>
                                                <td>{executor.performer}</td>
                                                <td>{executor.performerRole}</td>
                                                <td>{executor.orderCurrency}</td>
                                                <td>{executor.orderSum.toFixed(2)}</td>
                                                <td>{executor.hourlyRate.toFixed(2)}</td>
                                                <td>{executor.calculatedPaymentDue.toFixed(2)}</td>
                                                <td>{executor.calculatedWorkTime}</td>
                                                <td>{executor.orderSum.toFixed(2)}</td>
                                                <td>{executor.hourlyRate.toFixed(2)}</td>
                                                <td>{executor.paymentSum.toFixed(2)}</td>
                                                <td>{executor.calculatedPaymentDue.toFixed(2)}</td>
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
                                                    onCardClick={handleOpenEditModal}
                                                    onOpenOrderModal={handleOpenOrderModal}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                {isAddModalOpen && (
                    <AddExecutorModal 
                        onAdd={handleAddExecutor} 
                        onClose={() => setIsAddModalOpen(false)} 
                        fields={formFields}
                        orders={orders} 
                    />
                )}
                {editingOrder && (
                    <ExecutorEditModal 
                        order={editingOrder}
                        onUpdate={handleUpdateExecutor}  
                        onDelete={handleDeleteExecutor}   
                        onDuplicate={handleDuplicateExecutor} 
                        onClose={handleCloseEditModal}
                        fields={formFields}
                        orders={orders}
                        transactions={transactions}
                        assets={assets}
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