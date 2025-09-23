import React, { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "../Sidebar";
import StageColumn from "./StageColumn";
import OrderModal from "../modals/OrderModal/OrderModal";
import useHorizontalDragScroll from "./hooks/useHorizontalDragScroll";

import { getLogEntries } from "../Journal/journalApi";
import { useTransactions } from "../../context/TransactionsContext";
import "../../styles/OrdersPage.css";


const stages = [
  "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
  "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
  "На уточнении у клиента", "Тестируем", "Тестирует клиент",
  "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
  "Неудачно завершён", "Удаленные"
];

const ORDERS_STORAGE_KEY = 'ordersData';

const OrdersPage = () => {
    const [orders, setOrders] = useState(() => {
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
            try {
                return JSON.parse(savedOrders);
            } catch (e) {
                console.error("Ошибка чтения заказов из localStorage", e);
            }
        }
        return [
            { id: 1, numberOrder: "2234", name: "Разработка СРМ", stage: "Лид", date: "21.03.2025", price: 50000, client: "Лев" },
            { id: 2, name: "Редизайн сайта", stage: "Лид", date: "23.03.2025", price: 24300 },
        ];
    });

    
    const [journalEntries, setJournalEntries] = useState([]);
    

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const stagesContainerRef = useRef(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }, [orders]);

    
    useEffect(() => {
        const allEntries = getLogEntries();
        setJournalEntries(allEntries);
    }, []);
    


    const moveOrder = useCallback((orderId, newStage, newIndex) => {
       
        setOrders((prevOrders) => {
            const order = prevOrders.find((o) => o.id === orderId);
            if (!order) return prevOrders;

            const filteredOrders = prevOrders.filter((o) => o.id !== orderId);
            const newOrders = [...filteredOrders];

            newOrders.splice(newIndex, 0, { ...order, stage: newStage });

            return newOrders;
        });
    }, []);

    const updateOrder = (updatedOrder) => {
        
        setOrders((prev) =>
            prev.map((order) =>
                order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
            )
        );
        setSelectedOrder(null);
    };


    const generateRandomId = () => {
        return Math.floor(10000000 + Math.random() * 90000000);
    };

    const handleCreateOrder = (newOrderData) => {
        const newOrder = {
            ...newOrderData,
            id: generateRandomId(),
        };
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
        setIsCreateModalOpen(false);
    };

    const handleDeleteOrder = (orderId) => {

        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        setSelectedOrder(null);
    };

    useHorizontalDragScroll(stagesContainerRef, isDraggingRef);

    return (
        <div className="orders-page">
            <Sidebar />
            <div className="order-page-main-container">
                <header className="order-header-container">
                    <h1 className="order-title">
                        <PageHeaderIcon pageName="Заказы" />
                        Заказы
                    </h1>
                    <div className="view-mode-buttons">
                        <button
                            className={`view-mode-button ${viewMode === 'kanban' ? 'active' : ''}`}
                            onClick={() => setViewMode('kanban')}
                            title="Канбан вид"
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

                    <ColumnVisibilityToggle
                        stages={allStages}
                        visibleStages={visibleOrderStages}
                        onToggleStage={handleToggleStage}
                    />

                    <button className="create-order-btn" onClick={() => setIsCreateModalOpen(true)}>
                        ➕ Создать заказ
                    </button>
                </header>
                <DndProvider backend={HTML5Backend}>
                    <div className="stages-container" ref={stagesContainerRef}>
                        {stages.map((stage) => (
                            <StageColumn
                                key={stage}
                                stage={stage}
                                orders={orders.filter((order) => order.stage === stage)}
                                moveOrder={moveOrder}
                                onOrderClick={setSelectedOrder}
                                isDraggingRef={isDraggingRef}
                            />
                        ))}
                    </div>
                </DndProvider>
            </div>

            {selectedOrder && (
                <OrderModal
                    mode="edit"
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateOrder={updateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    journalEntries={journalEntries}
                />
            )}

            {isCreateModalOpen && (
                <OrderModal
                    mode="create"
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreateOrder={handleCreateOrder}
                    journalEntries={journalEntries}
                />
            )}
        </div>
    );
};

export default OrdersPage;