import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { fetchOrders, createOrder, updateOrder as updateOrderApi, changeOrderStage, deleteOrder as apiDeleteOrder } from "../../api/orders";
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

const stageToApi = {
    "Лид": "LEAD",
    "Изучаем ТЗ": "STUDY_TZ",
    "Обсуждаем с клиентом": "DISCUSS_WITH_CLIENT",
    "Клиент думает": "CLIENT_THINKS",
    "Ожидаем предоплату": "WAIT_PREPAYMENT",
    "Взяли в работу": "IN_WORK",
    "Ведется разработка": "DEVELOPMENT",
    "На уточнении у клиента": "CLIENT_CLARIFICATION",
    "Тестируем": "TESTING",
    "Тестирует клиент": "CLIENT_TESTING",
    "На доработке": "REWORK",
    "Ожидаем оплату": "WAIT_PAYMENT",
    "Успешно завершен": "SUCCESS",
    "Закрыт": "CLOSED",
    "Неудачно завершён": "FAILED",
    "Удаленные": "DELETED",
};

const apiToStage = Object.fromEntries(Object.entries(stageToApi).map(([k, v]) => [v, k]));

const urgencyToApi = { "1": "one", "2": "two", "3": "three", "4": "four" };
const apiToUrgency = { one: "1", two: "2", three: "3", four: "4" };

const finalStages = ["Успешно завершен", "Закрыт", "Неудачно завершён", "Удаленные"];

const parseDateInput = (value) => {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
        if (isoMatch) {
            const parsed = new Date(trimmed);
            return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
        }
        const dottedMatch = trimmed.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
        if (dottedMatch) {
            const parsed = new Date(`${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`);
            return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
        }
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    return undefined;
};

const normalizeNumber = (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
};

const normalizeInt = (value) => {
    const num = normalizeNumber(value);
    return num === undefined ? undefined : Math.trunc(num);
};

const toDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const normalizeArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const normalizeTagList = (value) => {
    return normalizeArray(value)
        .map((tag) => {
            if (typeof tag === "string") return tag;
            return tag?.name ?? tag?.value ?? tag?.label ?? "";
        })
        .map((tag) => String(tag || "").trim())
        .filter(Boolean);
};

const normalizeThirdParties = (value) => {
    return normalizeArray(value)
        .map((party) => {
            if (typeof party === "string") {
                const text = party.trim();
                return text ? { value: text, label: text } : null;
            }
            const id = party?.id ?? party?.value ?? "";
            const name = party?.name ?? party?.label ?? "";
            if (!id && !name) return null;
            return { value: id || name, label: name || id };
        })
        .filter(Boolean);
};

const pickValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
const pickDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const resolveOrderTagIds = (tags = []) => {
    if (!Array.isArray(tags) || tags.length === 0) return [];
    const directIds = tags.map((t) => t?.id).filter(Boolean);
    if (directIds.length) return directIds;
    const names = tags
        .map((t) => (typeof t === "string" ? t : t?.name))
        .filter(Boolean);
    if (!names.length) return [];
    try {
        if (typeof localStorage === "undefined") return [];
        const savedFields = localStorage.getItem("fieldsData");
        if (!savedFields) return [];
        const parsed = JSON.parse(savedFields);
        const orderTags = parsed?.orderFields?.tags || [];
        const mapByName = new Map(orderTags.map((t) => [t.name, t.id]));
        return names.map((name) => mapByName.get(name)).filter(Boolean);
    } catch (e) {
        console.warn("Не удалось сопоставить теги заказа:", e);
        return [];
    }
};

const isUuid = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const buildOrderMeta = (order = {}) => {
    const {
        id,
        stage,
        stageIndex,
        numberOrder,
        orderSequence,
        name,
        clientName,
        client,
        client_company,
        order_main_client,
        order_client,
        orderDate,
        appealDate,
        proposalDate,
        date,
        interval,
        orderType,
        orderStatus,
        closeReason,
        plannedStartDate,
        plannedFinishDate,
        project,
        orderDescription,
        techTags,
        taskTags,
        workList,
        techSpecifications,
        additionalConditions,
        notes,
        orderMainClient,
        clientCompany,
        partnerName,
        thirdParties,
        partnerDisableShare,
        partnerPayment,
        partnerPlan,
        partnerPlanPercent,
        partnerPlanSum,
        partnerUnderpayment,
        performers,
        sharePercent,
        price,
        amount,
        budget,
        currencyType,
        currencyRate,
        hourlyRate,
        roundHour,
        discount,
        upsell,
        expenses,
        tips,
        paymentDetails,
        paymentLog,
        executionTime,
        startDate,
        endDate,
        countDays,
        completedDate,
        completingTime,
        completingLink,
        orderImpressions,
        workLog,
        partner_name,
        third_parties,
        partner_disable_share,
        partner_payment,
        partner_plan,
        partner_percent_plan,
        partner_sum_plan,
        partner_underpayment,
        share_percent,
        currency_type,
        currency_rate,
        hourly_rate,
        round_hour,
        payment_details,
        payment_log,
        work_log,
        tags,
        meta,
        ...rest
    } = order;

    return {
        ...(typeof meta === "object" && meta ? meta : {}),
        ...rest,
    };
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    
    const [journalEntries, setJournalEntries] = useState([]);

    // Теперь это фильтр для заказов, а не для столбцов
    // По умолчанию показываем все заказы кроме финальных стадий
    const [visibleOrderStages, setVisibleOrderStages] = useState(() => {
        return allStages.filter(stage => !finalStages.includes(stage));
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('kanban');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const stagesContainerRef = useRef(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchOrders();
                const apiOrders = data?.orders || [];
                setOrders(apiOrders.map(mapOrderFromApi));
            } catch (e) {
                console.error('Fetch orders error', e);
                setError(e?.message || 'Не удалось загрузить заказы');
            } finally {
                setLoading(false);
            }
        };
        load();
        const allEntries = getLogEntries();
        setJournalEntries(allEntries);
    }, []);
    


    const moveOrder = useCallback(async (orderId, newStage, newIndex) => {
        setOrders((prevOrders) => {
            const order = prevOrders.find((o) => o.id === orderId);
            if (!order) return prevOrders;
            const filteredOrders = prevOrders.filter((o) => o.id !== orderId);
            const newOrders = [...filteredOrders];
            newOrders.splice(newIndex, 0, { ...order, stage: newStage, stageIndex: newIndex });
            return newOrders;
        });

        const stageEnum = stageToApi[newStage] || "LEAD";
        try {
            const updated = await changeOrderStage(orderId, { stage: stageEnum, stageIndex: newIndex });
            if (updated) {
                const nextOrder = mapOrderFromApi(updated.order || updated);
                setOrders((prev) => prev.map((o) => (o.id === orderId ? nextOrder : o)));
            }
        } catch (e) {
            console.error('Stage update failed, reverting', e);
            // rollback
            setOrders((prevOrders) => {
                const fresh = [...prevOrders];
                return fresh.map((o) =>
                    o.id === orderId ? { ...o, stage: apiToStage[stageEnum] || o.stage } : o
                );
            });
            setError(e?.message || 'Не удалось обновить стадию');
        }
    }, []);

    const handleUpdateOrder = async (updatedOrder) => {
        try {
            const payload = toApiOrderPayload(updatedOrder);
            const saved = await updateOrderApi(updatedOrder.id, payload);
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === updatedOrder.id ? mapOrderFromApi(saved.order || saved) : order
                )
            );
            setSelectedOrder(null);
        } catch (e) {
            console.error('Order update error', e);
            setError(e?.message || 'Не удалось обновить заказ');
        }
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

    const mapOrderFromApi = (o = {}) => {
        const meta = o.meta && typeof o.meta === "object" ? o.meta : {};
        const stage = apiToStage[o.stage] || o.stage || "Лид";
        const clientName = pickValue(o.clientName, o.client?.name, meta.clientName, meta.client) || "";
        const orderDateRaw = pickDefined(o.orderDate, o.date, meta.orderDate, meta.date);
        const plannedFinishRaw = pickDefined(o.plannedFinishDate, meta.plannedFinishDate);
        const priceRaw = pickDefined(o.price, o.amount, o.budget, meta.price, meta.amount, meta.budget);
        const price = priceRaw !== undefined && priceRaw !== null && priceRaw !== ""
            ? Number(priceRaw)
            : 0;
        const tagsFromRelation = (o.tags || []).map((t) => t.tag?.name).filter(Boolean);
        const tags = tagsFromRelation.length ? tagsFromRelation : normalizeTagList(meta.tags);

        return {
            ...meta,
            id: o.id,
            numberOrder: o.numberOrder ?? meta.numberOrder,
            orderSequence: pickDefined(o.orderSequence, meta.orderSequence),
            name: pickValue(o.name, o.title, meta.name, meta.title, meta.orderDescription, meta.project) || "",
            clientName,
            client: clientName,
            stage,
            stageIndex: o.stageIndex ?? 0,
            price,
            date: orderDateRaw ? new Date(orderDateRaw).toLocaleDateString('uk-UA') : "",
            plannedFinishDate: toDateInput(plannedFinishRaw),
            urgency: o.urgency ? apiToUrgency[o.urgency] || "" : meta.urgency || "",
            isOldOrder: pickDefined(o.isOldOrder, meta.isOldOrder) ?? false,
            appealDate: toDateInput(pickDefined(o.appealDate, meta.appealDate)),
            proposalDate: toDateInput(pickDefined(o.proposalDate, meta.proposalDate)),
            orderDate: toDateInput(orderDateRaw),
            interval: pickDefined(o.interval, meta.interval) ?? "",
            orderType: pickDefined(o.orderType, meta.orderType) ?? "",
            orderStatus: pickDefined(o.orderStatus, meta.orderStatus) ?? "",
            closeReason: pickDefined(o.closeReason, meta.closeReason) ?? "",
            plannedStartDate: toDateInput(pickDefined(o.plannedStartDate, meta.plannedStartDate)),
            project: pickDefined(o.project, meta.project) ?? "",
            orderDescription: pickDefined(o.orderDescription, meta.orderDescription) ?? "",
            techTags: normalizeTagList(pickDefined(o.techTags, meta.techTags)),
            taskTags: normalizeTagList(pickDefined(o.taskTags, meta.taskTags)),
            workList: normalizeArray(pickDefined(o.workList, meta.workList, meta.work_list)),
            techSpecifications: pickDefined(o.techSpecifications, meta.techSpecifications) ?? "",
            additionalConditions: pickDefined(o.additionalConditions, meta.additionalConditions) ?? "",
            notes: pickDefined(o.notes, meta.notes) ?? "",
            order_client: pickDefined(o.clientId, meta.order_client) ?? "",
            order_main_client: pickDefined(o.orderMainClient, meta.order_main_client) ?? "",
            client_company: pickDefined(o.clientCompany, meta.client_company, clientName) ?? "",
            partner_name: pickDefined(o.partnerName, meta.partner_name) ?? "",
            third_parties: normalizeThirdParties(pickDefined(o.thirdParties, meta.third_parties)),
            partner_disable_share: pickDefined(o.partnerDisableShare, meta.partner_disable_share) ?? false,
            partner_payment: pickDefined(o.partnerPayment, meta.partner_payment) ?? "",
            partner_plan: pickDefined(o.partnerPlan, meta.partner_plan) ?? "",
            partner_percent_plan: pickDefined(o.partnerPlanPercent, meta.partner_percent_plan) ?? "",
            partner_sum_plan: pickDefined(o.partnerPlanSum, meta.partner_sum_plan) ?? "",
            partner_underpayment: pickDefined(o.partnerUnderpayment, meta.partner_underpayment) ?? "",
            performers: normalizeArray(pickDefined(o.performers, meta.performers)),
            share_percent: pickDefined(o.sharePercent, meta.share_percent) ?? "",
            budget: pickDefined(o.budget, meta.budget, priceRaw) ?? "",
            currency_type: pickDefined(o.currencyType, meta.currency_type) ?? "",
            currency_rate: pickDefined(o.currencyRate, meta.currency_rate) ?? "",
            hourly_rate: pickDefined(o.hourlyRate, meta.hourly_rate) ?? "",
            round_hour: pickDefined(o.roundHour, meta.round_hour) ?? false,
            discount: pickDefined(o.discount, meta.discount) ?? "",
            upsell: pickDefined(o.upsell, meta.upsell) ?? "",
            expenses: pickDefined(o.expenses, meta.expenses) ?? "",
            tips: pickDefined(o.tips, meta.tips) ?? "",
            payment_details: pickDefined(o.paymentDetails, meta.payment_details) ?? "",
            payment_log: normalizeArray(pickDefined(o.paymentLog, meta.payment_log)),
            executionTime: pickDefined(o.executionTime, meta.executionTime) ?? "",
            startDate: toDateInput(pickDefined(o.startDate, meta.startDate)),
            endDate: toDateInput(pickDefined(o.endDate, meta.endDate)),
            countDays: pickDefined(o.countDays, meta.countDays) ?? "",
            completedDate: toDateInput(pickDefined(o.completedDate, meta.completedDate)),
            completingTime: pickDefined(o.completingTime, meta.completingTime) ?? "",
            completingLink: pickDefined(o.completingLink, meta.completingLink) ?? "",
            orderImpressions: pickDefined(o.orderImpressions, meta.orderImpressions) ?? "",
            work_log: normalizeArray(pickDefined(o.workLog, meta.work_log)),
            tags,
        };
    };

    const toApiOrderPayload = (order = {}) => {
        const stageEnum = stageToApi[order.stage] || "LEAD";
        const stageIndex = Number.isInteger(order.stageIndex)
            ? order.stageIndex
            : Math.max(0, allStages.indexOf(order.stage));
        const urgency = order.urgency ? urgencyToApi[String(order.urgency)] : undefined;
        const tagIds = resolveOrderTagIds(order.tags);
        const dateValue = order.orderDate || order.appealDate || order.date;
        const plannedFinishValue = order.plannedFinishDate;
        const priceValue = normalizeNumber(order.price ?? order.amount ?? order.budget);
        const budgetValue = normalizeNumber(order.budget);
        const clientName =
            order.clientName ||
            order.client ||
            order.client_company ||
            order.order_main_client ||
            undefined;
        const nameValue =
            order.name ||
            order.orderDescription ||
            order.project ||
            undefined;
        const thirdPartiesValue = normalizeArray(order.third_parties).map((party) => {
            if (typeof party === "string") {
                const text = party.trim();
                return text ? { id: text, name: text } : null;
            }
            const id = party?.value ?? party?.id ?? "";
            const name = party?.label ?? party?.name ?? "";
            if (!id && !name) return null;
            return { id: id || name, name: name || id };
        }).filter(Boolean);
        const meta = buildOrderMeta(order);
        const payload = {
            name: nameValue,
            ...(order.numberOrder !== undefined && order.numberOrder !== null ? { numberOrder: order.numberOrder } : {}),
            clientName,
            clientId: isUuid(order.order_client) ? order.order_client : undefined,
            stage: stageEnum,
            stageIndex,
            price: priceValue,
            amount: normalizeNumber(order.amount),
            budget: budgetValue,
            date: parseDateInput(dateValue),
            plannedFinishDate: parseDateInput(plannedFinishValue),
            urgency,
            isOldOrder: order.isOldOrder ?? undefined,
            appealDate: parseDateInput(order.appealDate),
            proposalDate: parseDateInput(order.proposalDate),
            orderDate: parseDateInput(order.orderDate),
            interval: order.interval,
            orderType: order.orderType,
            orderStatus: order.orderStatus,
            closeReason: order.closeReason,
            plannedStartDate: parseDateInput(order.plannedStartDate),
            project: order.project,
            orderDescription: order.orderDescription,
            techTags: normalizeTagList(order.techTags),
            taskTags: normalizeTagList(order.taskTags),
            workList: normalizeArray(order.workList),
            techSpecifications: order.techSpecifications,
            additionalConditions: order.additionalConditions,
            notes: order.notes,
            orderMainClient: order.order_main_client,
            clientCompany: order.client_company,
            partnerName: order.partner_name,
            thirdParties: thirdPartiesValue,
            partnerDisableShare: order.partner_disable_share ?? undefined,
            partnerPayment: normalizeNumber(order.partner_payment),
            partnerPlan: normalizeInt(order.partner_plan),
            partnerPlanPercent: normalizeInt(order.partner_percent_plan),
            partnerPlanSum: normalizeNumber(order.partner_sum_plan),
            partnerUnderpayment: normalizeNumber(order.partner_underpayment),
            performers: normalizeArray(order.performers),
            sharePercent: normalizeNumber(order.share_percent),
            currencyType: order.currency_type,
            currencyRate: normalizeNumber(order.currency_rate),
            hourlyRate: normalizeNumber(order.hourly_rate),
            roundHour: order.round_hour ?? undefined,
            discount: normalizeNumber(order.discount),
            upsell: normalizeNumber(order.upsell),
            expenses: normalizeNumber(order.expenses),
            tips: normalizeNumber(order.tips),
            paymentDetails: order.payment_details,
            paymentLog: normalizeArray(order.payment_log),
            executionTime: order.executionTime,
            startDate: parseDateInput(order.startDate),
            endDate: parseDateInput(order.endDate),
            countDays: normalizeInt(order.countDays),
            completedDate: parseDateInput(order.completedDate),
            completingTime: order.completingTime,
            completingLink: order.completingLink,
            orderImpressions: order.orderImpressions,
            workLog: normalizeArray(order.work_log),
            ...(tagIds.length ? { tagIds } : {}),
        };
        return {
            ...payload,
            ...(Object.keys(meta || {}).length ? { meta } : {}),
        };
    };

    const handleCreateOrder = async (newOrderData) => {
        try {
            const payload = toApiOrderPayload(newOrderData);
            const created = await createOrder(payload);
            const order = mapOrderFromApi(created.order || created);
            setOrders((prevOrders) => [order, ...prevOrders]);
            setIsCreateModalOpen(false);
            return order;
        } catch (e) {
            console.error('Order create error', e);
            setError(e?.message || 'Не удалось создать заказ');
            throw e;
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await apiDeleteOrder(orderId);
            setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            setSelectedOrder(null);
        } catch (e) {
            console.error('Order delete error', e);
            setError(e?.message || 'Не удалось удалить заказ');
        }
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
                    </button>
                </header>

                {error && <div className="orders-error">{error}</div>}
                {loading && <div className="orders-loading">Загрузка заказов...</div>}

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
                    mode="edit"
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateOrder={handleUpdateOrder}
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
