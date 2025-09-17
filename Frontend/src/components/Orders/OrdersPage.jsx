import React, { useState, useRef, useCallback } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "../Sidebar";
import StageColumn from "./StageColumn";
import OrderModal from "../modals/OrderModal/OrderModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ColumnMinimap from "./Minimap/ColumnMinimap";
import ColumnVisibilityToggle from "./ColumnVisibilityToggle/ColumnVisibilityToggle";
import useHorizontalDragScroll from "./hooks/useHorizontalDragScroll";
import "../../styles/OrdersPage.css";
import "./Minimap/ColumnMinimap.css";
import "./ColumnVisibilityToggle/ColumnVisibilityToggle.css";

const QuickDropZone = ({ stage, moveOrder, onDragEnd }) => {
    const [{ isOver }, drop] = useDrop({
        accept: "order",
        drop: (item) => {
            moveOrder(item.id, stage, 0);
            if (onDragEnd) onDragEnd();
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const getStageIcon = (stage) => {
        const icons = {
            "Успешно завершен": "✅",
            "Закрыт": "🔒",
            "Неудачно завершён": "❌",
            "Удаленные": "🗑️"
        };
        return icons[stage] || "📋";
    };

    const getStageColor = (stage) => {
        const colors = {
            "Успешно завершен": "#36a850",
            "Закрыт": "#46bcc6",
            "Неудачно завершён": "#e94335",
            "Удаленные": "#7f8c8d"
        };
        return colors[stage] || "#3498db";
    };

    return (
        <div
            ref={drop}
            className={`quick-drop-zone ${isOver ? 'quick-drop-hover' : ''}`}
            style={{
                borderColor: getStageColor(stage),
                backgroundColor: isOver ? `${getStageColor(stage)}20` : 'transparent'
            }}
        >
            <div className="quick-drop-icon" style={{ color: getStageColor(stage) }}>
                {getStageIcon(stage)}
            </div>
            <div className="quick-drop-text" style={{ color: getStageColor(stage) }}>
                {stage}
            </div>
        </div>
    );
};

const allStages = [
    "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
    "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
    "На уточнении у клиента", "Тестируем", "Тестирует клиент",
    "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
    "Неудачно завершён", "Удаленные"
];

const finalStages = ["Успешно завершен", "Закрыт", "Неудачно завершён", "Удаленные"];

const OrdersPage = () => {
    const [orders, setOrders] = useState([
        { id: 1, numberOrder: "2234", name: "Разработка СРМ", stage: "Лид", date: "21.03.2025", price: 50000, client: "Лев" },
        { id: 2, name: "Редизайн сайта", stage: "Изучаем ТЗ", date: "23.03.2025", price: 24300 },
        { id: 3, name: "Мобильное приложение", stage: "Обсуждаем с клиентом", date: "27.03.2025", price: 35000 },
        { id: 4, numberOrder: "23334", name: "API интеграция", stage: "Клиент думает", price: 28000 },
        { id: 5, name: "Предрейс", stage: "Ожидаем предоплату", price: 15000 },
        { id: 6, name: "Покурить", stage: "Взяли в работу", price: 8000 },
        { id: 7, name: "Выпить пива", stage: "Ведется разработка", price: 12000 },
        { id: 8, name: "Тим билдинг в кс2", stage: "На уточнении у клиента", price: 25000 },
        { id: 9, name: "Покурить", stage: "Тестируем", price: 9000 },
        { id: 10, name: "Тим билдинг в кс2", stage: "Тестирует клиент", price: 18000 },
        { id: 11, name: "Покурить", stage: "На доработке", price: 6000 }
    ]);

    // Теперь это фильтр для заказов, а не для столбцов
    // По умолчанию показываем все заказы кроме финальных стадий
    const [visibleOrderStages, setVisibleOrderStages] = useState(() => {
        return allStages.filter(stage => !finalStages.includes(stage));
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('kanban');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
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

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleToggleStage = (stage) => {
        setVisibleOrderStages(prev => {
            if (prev.includes(stage)) {
                return prev.filter(s => s !== stage);
            } else {
                return [...prev, stage];
            }
        });
    };

    // Функция для получения отфильтрованных заказов для конкретной стадии
    const getFilteredOrdersForStage = (stage) => {
        const stageOrders = orders.filter((order) => order.stage === stage);

        // Если стадия не включена в видимые, возвращаем пустой массив
        if (!visibleOrderStages.includes(stage)) {
            return [];
        }

        return stageOrders;
    };

    // Функция для скролла миникарты
    const handleScrollToPosition = useCallback((scrollLeft) => {
        if (stagesContainerRef.current) {
            stagesContainerRef.current.scrollLeft = scrollLeft;
        }
    }, []);

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

                    <button className="create-order-btn" onClick={() => setShowCreateModal(true)}>
                        ➕ Создать заказ
                    </button>
                </header>

                <DndProvider backend={HTML5Backend}>
                    <div className="stages-container" ref={stagesContainerRef}>
                        {/* Показываем ВСЕ столбцы, но с отфильтрованными заказами */}
                        {allStages.map((stage) => (
                            <StageColumn
                                key={stage}
                                stage={stage}
                                orders={getFilteredOrdersForStage(stage)}
                                moveOrder={moveOrder}
                                onOrderClick={setSelectedOrder}
                                isDraggingRef={isDraggingRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>

                    {/* Миникарта столбцов - теперь показывает все столбцы */}
                    <ColumnMinimap
                        containerRef={stagesContainerRef}
                        stages={allStages}
                        onScrollToPosition={handleScrollToPosition}
                        isDragging={isDragging}
                    />

                    {isDragging && (
                        <div className="final-stages-panel">
                            <div className="final-stages-container">
                                {finalStages.map((stage) => (
                                    <QuickDropZone
                                        key={`quick-${stage}`}
                                        stage={stage}
                                        moveOrder={moveOrder}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
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