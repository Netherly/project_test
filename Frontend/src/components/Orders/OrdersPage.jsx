import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; 
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import Sidebar from "../Sidebar";
import StageColumn from "./StageColumn";
import OrderModal from "../modals/OrderModal/OrderModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ColumnMinimap from "./Minimap/ColumnMinimap";
import ColumnVisibilityToggle from "./ColumnVisibilityToggle/ColumnVisibilityToggle";
import useHorizontalDragScroll from "./hooks/useHorizontalDragScroll";

import { getLogEntries } from "../Journal/journalApi";
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
            "Завершен": "🔒",
            "Неудачно завершен": "❌",
            "Удаленные": "🗑️"
        };
        return icons[stage] || "📋";
    };

    const getStageColor = (stage) => {
        const colors = {
            "Успешно завершен": "#36a850",
            "Завершен": "#46bcc6",
            "Неудачно завершен": "#e94335",
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
    "На доработке", "Ожидаем оплату", "Успешно завершен", "Завершен",
    "Неудачно завершен", "Удаленные"
];

const finalStages = ["Успешно завершен", "Завершен", "Неудачно завершен", "Удаленные"];
const ORDERS_STORAGE_KEY = 'ordersData';

const OrdersPage = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
   
    const [searchParams, setSearchParams] = useSearchParams();

    const [orders, setOrders] = useState(() => {
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
            try { return JSON.parse(savedOrders); } catch (e) { console.error(e); }
        }
        return [
            { id: 1, numberOrder: "2234", name: "Разработка СРМ", stage: "Лид", date: "21.03.2025", price: 50000, client: "Лев" },
            { id: 2, name: "Редизайн сайта", stage: "Лид", date: "23.03.2025", price: 24300 },
        ];
    });

    const [journalEntries, setJournalEntries] = useState([]);

    
    const [visibleOrderStages, setVisibleOrderStages] = useState(() => {
        
        const stagesParam = searchParams.get('stages');
        
        if (stagesParam) {
           
            return stagesParam.split(',');
        }
        
        return allStages;
    });

    const selectedOrder = useMemo(() => {
        if (!orderId) return null;
        return orders.find((o) => String(o.id) === String(orderId)) || null;
    }, [orders, orderId]);

    const [viewMode, setViewMode] = useState('kanban');
    const [isDragging, setIsDragging] = useState(false);
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

    
    const moveOrder = useCallback((orderIdToMove, newStage, newIndex) => {
        setOrders((prevOrders) => {
            const order = prevOrders.find((o) => o.id === orderIdToMove);
            if (!order) return prevOrders;
            const filteredOrders = prevOrders.filter((o) => o.id !== orderIdToMove);
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

        
        if (!visibleOrderStages.includes(updatedOrder.stage)) {
            const newStages = [...visibleOrderStages, updatedOrder.stage];
            
            
            setVisibleOrderStages(newStages);

           
            const newParams = new URLSearchParams(searchParams);
            newParams.set('stages', newStages.join(','));
            
            navigate({ pathname: '/orders', search: newParams.toString() });
        } else {
            navigate({ pathname: '/orders', search: searchParams.toString() });
        }
    };

    const handleDragStart = () => { setIsDragging(true); };
    const handleDragEnd = () => { setIsDragging(false); };

    const handleToggleStage = (stage) => {
        
        let newStages;
        if (visibleOrderStages.includes(stage)) {
            newStages = visibleOrderStages.filter(s => s !== stage);
        } else {
            newStages = [...visibleOrderStages, stage];
        }

        
        setVisibleOrderStages(newStages);

       
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            
            if (newStages.length > 0) {
                newParams.set('stages', newStages.join(','));
            } else {
                newParams.delete('stages');
            }
            return newParams;
        });
    };

    const getFilteredOrdersForStage = (stage) => {
        const stageOrders = orders.filter((order) => order.stage === stage);
        if (!visibleOrderStages.includes(stage)) {
            return [];
        }
        return stageOrders;
    };

    const handleScrollToPosition = useCallback((scrollLeft) => {
        if (stagesContainerRef.current) {
            stagesContainerRef.current.scrollLeft = scrollLeft;
        }
    }, []);

    const generateRandomId = () => { return Math.floor(10000000 + Math.random() * 90000000); };

    const handleCreateOrder = (newOrderData) => {
        const newOrder = { ...newOrderData, id: generateRandomId() };
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
        setIsCreateModalOpen(false);
    };

    const handleDeleteOrder = (orderIdToDelete) => {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderIdToDelete));
        navigate({ pathname: '/orders', search: searchParams.toString() });
    };

    const handleOrderClick = (order) => {
        navigate({
            pathname: `/orders/${order.id}`,
            search: searchParams.toString() 
        });
    };

    const handleCloseModal = () => {
        navigate({
            pathname: '/orders',
            search: searchParams.toString()
        });
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Добавить
                    </button>
                </header>

                <DndProvider backend={HTML5Backend}>
                    <div className="stages-container" ref={stagesContainerRef}>
                        {allStages.map((stage) => (
                            <StageColumn
                                key={stage}
                                stage={stage}
                                orders={getFilteredOrdersForStage(stage)}
                                moveOrder={moveOrder}
                                onOrderClick={handleOrderClick}
                                isDraggingRef={isDraggingRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>

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
                    mode="edit"
                    order={selectedOrder}
                    onClose={handleCloseModal}
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