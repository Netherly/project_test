import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import ExecutorModal from "./ExecutorModal/ExecutorModal.jsx";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import ExecutorCard from "./ExecutorCard.jsx";
import "../../styles/ExecutorsPage.css";
import * as executorService from './executorService.jsx';
import FormattedDate from "../FormattedDate.jsx";
import { fetchFields, withDefaults } from '../../api/fields'; 


const getOrders = () => { try { const savedOrders = localStorage.getItem('ordersData'); return savedOrders ? JSON.parse(savedOrders) : []; } catch (error) { console.error("Ошибка при чтении заказов из localStorage:", error); return []; } };
const getJournalEntries = () => { try { const savedEntries = localStorage.getItem('journalEntries'); return savedEntries ? JSON.parse(savedEntries) : []; } catch (error) { console.error("Ошибка при чтении журнала из localStorage:", error); return []; } };
const getTransactions = () => { try { const saved = localStorage.getItem('transactionsData'); return saved ? JSON.parse(saved) : []; } catch (error) { console.error("Ошибка при чтении транзакций из localStorage:", error); return []; } };
const getAssets = () => { try { const saved = localStorage.getItem('assetsData'); return saved ? JSON.parse(saved) : []; } catch (error) { console.error("Ошибка при чтении активов из localStorage:", error); return []; } };
const parseHoursToSeconds = (timeStr) => { if (typeof timeStr !== 'string' || !timeStr) return 0; const parts = timeStr.split(':').map(Number); const hours = parts[0] || 0; const minutes = parts[1] || 0; const seconds = parts[2] || 0; return hours * 3600 + minutes * 60 + seconds; };
const formatSecondsToHours = (totalSeconds) => { const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; };
const formatDate = (dateString) => { if (!dateString) return ''; const date = new Date(dateString); const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}.${month}.${year}`; };

const ExecutorsPage = () => {
    
    const navigate = useNavigate();
    const { executorId } = useParams(); 
    const [searchParams, setSearchParams] = useSearchParams(); 

    const [executors, setExecutors] = useState(executorService.getExecutors());
    const [userSettings, setUserSettings] = useState({ currency: '₴' });
    
    
    
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    
    
    const viewMode = searchParams.get('view') || 'card';
    const setViewMode = (mode) => {
        setSearchParams({ view: mode });
    };

    const [fields, setFields] = useState({ currency: [], role: [] });
    
    const [transactions, setTransactions] = useState([]);
   
    const [assets, setAssets] = useState([]);

    
    const handleNavigateToOrder = (orderId) => {
        navigate(`/orders/${orderId}`);
    };

    useEffect(() => {
        setOrders(getOrders());
        setJournalEntries(getJournalEntries());
        setTransactions(getTransactions());
        setAssets(getAssets());
        
        const employeesFromStorage = JSON.parse(localStorage.getItem('employees')) || [];
        setActiveEmployees(employeesFromStorage.filter(emp => emp.status === 'active'));

        const loadFields = async () => {
            try {
                const rawFields = await fetchFields();
                const allFields = withDefaults(rawFields);
                setFields({
                    currency: allFields.generalFields?.currency || [],
                    role: allFields.executorFields?.role || []
                });
            } catch (err) {
                console.error("Failed to load fields from API", err);
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
    }, []);

    const generateId = () => 'perf_' + Date.now() + Math.random().toString(36).substring(2, 9);
    
    
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

    
    const modalExecutor = useMemo(() => {
        if (!executorId) return null;
        
        
        if (executorId === 'new') return {};

        return enrichedExecutors.find(e => String(e.id) === String(executorId)) || null;
    }, [executorId, enrichedExecutors]);


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
    const handleOpenModal = (executor) => {
        
        if (!executor || !executor.id) {
            navigate('/executors/new');
        } else {
            navigate(`/executors/${executor.id}`);
        }
    };

    
    const closeModal = () => {
        navigate({
            pathname: '/executors',
            search: searchParams.toString()
        });
    };

    const handleSaveExecutor = (executorData) => {
        const isNew = !executorData.id;
        
        const updatedOrders = orders.map(order => {
            if (String(order.id) === String(executorData.orderNumber)) {
                let updatedPerformers;
                if (isNew) {
                    const newExecutor = {
                        ...executorData,
                        id: generateId(),
                        orderStatus: "В работе",
                        orderStatusEmoji: "⏳",
                        orderDate: formatDate(executorData.dateForPerformer || new Date()),
                    };
                    updatedPerformers = [...(order.performers || []), newExecutor];
                } else {
                    updatedPerformers = (order.performers || []).map(p =>
                        String(p.id) === String(executorData.id) ? { ...p, ...executorData } : p
                    );
                }
                return { ...order, performers: updatedPerformers };
            }
            return order;
        });

        setOrders(updatedOrders);
        localStorage.setItem('ordersData', JSON.stringify(updatedOrders));
        closeModal();
    };
    
    const handleDeleteExecutor = (executorToDelete) => {
        const updatedOrders = orders.map(order => {
            if (String(order.id) === String(executorToDelete.orderNumber)) {
                const updatedPerformers = (order.performers || []).filter(
                    p => String(p.id) !== String(executorToDelete.id)
                );
                return { ...order, performers: updatedPerformers };
            }
            return order;
        });

        setOrders(updatedOrders);
        localStorage.setItem('ordersData', JSON.stringify(updatedOrders));
        closeModal(); 
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
                            <button className="add-executor-button" onClick={() => handleOpenModal(null)}>
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
                                            <tr key={executor.id} className="executor-row" onClick={() => handleOpenModal(executor)}>
                                                <td onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNavigateToOrder(executor.orderNumber);
                                                }} style={{cursor: 'pointer', color: '#3498db', fontWeight: '500'}}>
                                                    {executor.orderNumber}
                                                </td>
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
                                                    onCardClick={handleOpenModal} 
                                                    onOpenOrderModal={handleNavigateToOrder}
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
                            orders={orders}
                            fields={formFields}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default ExecutorsPage;
