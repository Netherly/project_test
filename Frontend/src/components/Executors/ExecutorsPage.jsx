import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import AddExecutorModal from './AddExecutorModal.jsx'; 
import ExecutorCard from './ExecutorCard.jsx';
import "../../styles/ExecutorsPage.css";

const ExecutorsPage = () => {
    const defaultPerformers = [
        {
            id: "P001",
            orderNumber: "001",
            orderStatus: "В работе",
            orderStatusEmoji: "⏳",
            orderDate: "2025-08-01",
            description: "Оплата за товар #12345",
            client: "Иванов И.И.",
            clientHidden: false,
            performer: "Петров П.П.",
            performerRole: "Основной",
            orderCurrency: "USD",
            orderSum: 500.00,
            hourlyRate: 25.00,
            paymentBalance: 0.00,
            workTime: 20,
            paymentSum: 500.00,
            paymentRemaining: 0.00,
            accountingCurrency: "UAH",
        },
        {
            id: "P002",
            orderNumber: "002",
            orderStatus: "Завершено",
            orderStatusEmoji: "✅",
            orderDate: "2025-07-25",
            description: "Оплата поставщику за сырье",
            client: "ООО 'Клиент'",
            clientHidden: false,
            performer: "Сидорова М.А.",
            performerRole: "Соисполнитель",
            orderCurrency: "EUR",
            orderSum: 1200.00,
            hourlyRate: 30.00,
            paymentBalance: 1200.00,
            workTime: 40,
            paymentSum: 1200.00,
            paymentRemaining: 0.00,
            accountingCurrency: "UAH",
        },
        {
            id: "P003",
            orderNumber: "003",
            orderStatus: "Ожидает оплаты",
            orderStatusEmoji: "💰",
            orderDate: "2025-08-05",
            description: "Выплата зарплаты сотруднику",
            client: "",
            clientHidden: true,
            performer: "Козлов А.С.",
            performerRole: "Основной",
            orderCurrency: "UAH",
            orderSum: 25000.00,
            hourlyRate: 200.00,
            paymentBalance: 15000.00,
            workTime: 50,
            paymentSum: 10000.00,
            paymentRemaining: 15000.00,
            accountingCurrency: "UAH",
        },
        {
            id: "P004",
            orderNumber: "004",
            orderStatus: "В работе",
            orderStatusEmoji: "⏳",
            orderDate: "2025-08-06",
            description: "Разработка макета сайта",
            client: "Иванов И.И.",
            clientHidden: false,
            performer: "Петров П.П.",
            performerRole: "Соисполнитель",
            orderCurrency: "USD",
            orderSum: 800.00,
            hourlyRate: 40.00,
            paymentBalance: 200.00,
            workTime: 20,
            paymentSum: 600.00,
            paymentRemaining: 200.00,
            accountingCurrency: "UAH",
        }
    ];

    const [executors, setExecutors] = useState(() => {
        const savedExecutors = localStorage.getItem("executorsData");
        return savedExecutors ? JSON.parse(savedExecutors) : defaultPerformers;
    });
    const [userSettings, setUserSettings] = useState({ currency: '₴' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    
    const [viewMode, setViewMode] = useState('card');
    
    useEffect(() => {
        localStorage.setItem("executorsData", JSON.stringify(executors));
    }, [executors]);

    const handleAddExecutor = (newExecutor) => {
        setExecutors(prevExecutors => [...prevExecutors, newExecutor]);
    };

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
        employees: ["Петров П.П.", "Сидорова М.А.", "Козлов А.С."],
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
                                        <tr key={executor.id} className="executor-row">
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
            </div>
        </div>
    );
};

export default ExecutorsPage;