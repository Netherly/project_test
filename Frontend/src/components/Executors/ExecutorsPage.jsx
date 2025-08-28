import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import AddExecutorModal from './AddExecutorModal.jsx'; 
import ExecutorCard from './ExecutorCard.jsx';
import ExecutorEditModal from './ExecutorEditModal.jsx';
import "../../styles/ExecutorsPage.css";
import * as executorService from './executorService.jsx';

const ExecutorsPage = () => {
    
    const [executors, setExecutors] = useState(executorService.getExecutors());
    const [userSettings, setUserSettings] = useState({ currency: '₴' });
    const [editingOrder, setEditingOrder] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeEmployees, setActiveEmployees] = useState([]);
    
    
    const [viewMode, setViewMode] = useState('card');

   
    const handleOpenEditModal = (order) => {
        setEditingOrder(order);
    };

    const handleCloseEditModal = () => {
        setEditingOrder(null);
    };

    const handleAddExecutor = (newExecutor) => {
        const updatedList = executorService.addExecutor(newExecutor);
        setExecutors(updatedList);
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

    // ... (остальная логика загрузки employees и fields остается, так как она нужна для форм)
    useEffect(() => {
        const employeesFromStorage = JSON.parse(localStorage.getItem('employees')) || [];
        const filtered = employeesFromStorage.filter(emp => emp.status === 'active');
        setActiveEmployees(filtered);
    }, []);

   

    const [fields, setFields] = useState({ currency: [], role: [] });

    
    useEffect(() => {
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

    const formFields = {
        employees: activeEmployees,
        role: fields.role,
        currency: fields.currency,
    };

   
    const executorsByPerformer = executors.reduce((acc, executor) => {
        if (!acc[executor.performer]) {
            acc[executor.performer] = [];
        }
        acc[executor.performer].push(executor);
        return acc;
    }, {});
    
    return (
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
                                    {executors.map((executor) => (
                                        <tr key={executor.id} className="executor-row" onClick={() => handleOpenEditModal(executor)}>
                                            <td>{executor.orderNumber}</td>
                                            <td>
                                                <span title={executor.orderStatus}>{executor.orderStatusEmoji}</span>
                                            </td>
                                            <td>{executor.orderDate}</td>
                                            <td>{executor.description}</td>
                                            <td>
                                                {executor.clientHidden ? "Не заполнено" : executor.client}
                                            </td>
                                            <td>{executor.performer}</td>
                                            <td>{executor.performerRole}</td>
                                            <td>{executor.orderCurrency}</td>
                                            <td>{executor.orderSum.toFixed(2)}</td>
                                            <td>{executor.hourlyRate.toFixed(2)}</td>
                                            <td>{executor.paymentBalance.toFixed(2)}</td>
                                            <td>{executor.workTime}</td>
                                            <td>{executor.orderSum.toFixed(2)}</td>
                                            <td>{executor.hourlyRate.toFixed(2)}</td>
                                            <td>{executor.paymentSum.toFixed(2)}</td>
                                            <td>{executor.paymentRemaining.toFixed(2)}</td>
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
                    />
                )}
                {editingOrder && (
                    <ExecutorEditModal 
                        order={editingOrder}
                        onUpdate={handleUpdateExecutor}  
                        onDelete={handleDeleteExecutor}   
                        onDuplicate={handleDuplicateExecutor} 
                        onClose={() => setEditingOrder(null)}
                        fields={formFields}
                    />
                )}
            </div>
        </div>
    );
};

export default ExecutorsPage;