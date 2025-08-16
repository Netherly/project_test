import React, { useState, useRef, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "../Sidebar";
import StageColumn from "./StageColumn";
import OrderModal from "../modals/OrderModal/OrderModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import useHorizontalDragScroll from "./hooks/useHorizontalDragScroll";
import "../../styles/OrdersPage.css";

const stages = [
  "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
  "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
  "На уточнении у клиента", "Тестируем", "Тестирует клиент",
  "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
  "Неудачно завершён", "Удаленные"
];

const OrdersPage = () => {
    const [orders, setOrders] = useState([
        { id: 1, numberOrder: "2234", name: "Разработка СРМ", stage: "Лид", date: "21.03.2025", price: 50000, client: "Лев" },
        { id: 2, name: "Редизайн сайта", stage: "Лид", date: "23.03.2025", price: 24300 },
        { id: 3, stage: "Лид", date: "27.03.2025" },
        { id: 4, numberOrder: "23334", stage: "Лид" },
        { id: 5, name: "Предрейс", stage: "Лид" },
        { id: 6, name: "Покурить", stage: "Лид" },
        { id: 7, name: "Выпить пива", stage: "Лид" },
        { id: 8, name: "Тим билдинг в кс2", stage: "Лид" },
        { id: 9, name: "Покурить", stage: "Лид" },
        { id: 10, name: "Тим билдинг в кс2", stage: "Лид" },
        { id: 11, name: "Покурить", stage: "Лид" }
    ]);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('kanban');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const stagesContainerRef = useRef(null);
    const isDraggingRef = useRef(false);

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
                    <button className="create-order-btn" onClick={() => setShowCreateModal(true)}>
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
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onUpdateOrder={updateOrder}
                />
            )}
        </div>
    );
};

export default OrdersPage;