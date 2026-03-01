import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import ExecutorModal from "./ExecutorModal/ExecutorModal.jsx";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import ExecutorCard from "./ExecutorCard.jsx";
import "../../styles/ExecutorsPage.css";
import * as executorService from "./executorService.jsx";
import { fetchFields, withDefaults, saveFields, serializeForSave, rid } from "../../api/fields";
import { fetchOrders, updateOrder } from "../../api/orders";
import { fetchTransactions } from "../../api/transactions";
import { fetchEmployees } from "../../api/employees";
import { useFields } from "../../context/FieldsContext"; 


const buildJournalEntriesFromOrders = (orders = []) => {
  const entries = [];
  orders.forEach((order) => {
    const workLog = order?.workLog ?? order?.work_log ?? order?.meta?.workLog ?? order?.meta?.work_log ?? order?.meta?.worklog ?? [];
    if (!Array.isArray(workLog)) return;
    const orderNumber = order.orderSequence ?? order.numberOrder ?? order.id;

    workLog.forEach((entry, idx) => {
      entries.push({
        id: entry?.id ?? entry?.original_id ?? `${order.id}-${idx}`,
        orderId: order.id,
        orderNumber,
        executorRole: entry?.executorRole ?? entry?.role ?? entry?.performer ?? "",
        role: entry?.role ?? entry?.executorRole ?? "",
        workDate: entry?.workDate ?? entry?.work_date ?? entry?.date ?? "",
        hours: entry?.hours ?? entry?.time ?? entry?.spentHours ?? "",
        workDone: entry?.workDone ?? entry?.description ?? "",
        description: entry?.description ?? order.orderDescription ?? "",
        startTime: entry?.startTime ?? entry?.start_time ?? "",
        endTime: entry?.endTime ?? entry?.end_time ?? "",
        email: entry?.email ?? "",
      });
    });
  });
  return entries;
};

const safeJsonParse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const getOrders = () => { try { const saved = localStorage.getItem("ordersData"); return saved ? JSON.parse(saved) : []; } catch { return []; } };
const getJournalEntries = () => { try { const saved = localStorage.getItem("journalEntries"); return saved ? JSON.parse(saved) : []; } catch { return []; } };
const getTransactions = () => { try { const saved = localStorage.getItem("transactionsData"); return saved ? JSON.parse(saved) : []; } catch { return []; } };
const getAssets = () => { try { const saved = localStorage.getItem("assetsData"); return saved ? JSON.parse(saved) : []; } catch { return []; } };

const parseHoursToSeconds = (timeStr) => {
  if (typeof timeStr !== "string" || !timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

const formatSecondsToHours = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const ExecutorsPage = () => {
  const navigate = useNavigate();
  const { executorId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [executors, setExecutors] = useState(executorService.getExecutors());
  const [userSettings, setUserSettings] = useState({ currency: "₴" });

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);


  const [localFieldOptions, setLocalFieldOptions] = useState({ currency: [], role: [] });
  const { refreshFields } = useFields();

  const viewMode = searchParams.get("view") || "card";
  const setViewMode = (mode) => setSearchParams({ view: mode });

  const handleNavigateToOrder = (orderId) => navigate(`/orders/${orderId}`);

  const generateId = () => `perf_${Date.now()}${Math.random().toString(36).substring(2, 9)}`;


  const loadFields = async () => {
    try {
      const rawFields = await fetchFields();
      const allFields = withDefaults(rawFields);
      setLocalFieldOptions({
        currency: (allFields.generalFields?.currency || []).filter(i => !i.isDeleted).map(i => i.value),
        role: (allFields.executorFields?.role || []).filter(i => !i.isDeleted).map(i => i.value),
      });
    } catch (err) {
      console.error("Failed to load fields from API", err);
    }
  };

  
  const handleAddNewField = async (group, fieldName, newValue) => {
    try {
      const raw = await fetchFields();
      const normalized = withDefaults(raw);
      const list = normalized[group]?.[fieldName] || [];

      const exists = list.find(item => item.value && item.value.toLowerCase() === newValue.toLowerCase());

      if (!exists) {
        list.push({ id: rid(), value: newValue, isDeleted: false });
        normalized[group][fieldName] = list;
        const payload = serializeForSave(normalized);
        await saveFields(payload);
        
        await loadFields();
        if (refreshFields) await refreshFields();
      }
    } catch (e) {
      console.error("Ошибка при сохранении нового поля в БД:", e);
    }
  };

  useEffect(() => {
    setOrders(getOrders());
    setJournalEntries(getJournalEntries());
    setTransactions(getTransactions());
    setAssets(getAssets());

    const loadOrders = async () => {
      try {
        const response = await fetchOrders({ page: 1, limit: 1000 });
        const list = Array.isArray(response?.orders) ? response.orders : [];
        const filtered = list.filter((order) => String(order.stage) !== "LEAD");
        const sorted = filtered.slice().sort((a, b) => {
          const aSeq = a?.orderSequence ?? Number.POSITIVE_INFINITY;
          const bSeq = b?.orderSequence ?? Number.POSITIVE_INFINITY;
          if (aSeq !== bSeq) return aSeq - bSeq;
          return String(a?.numberOrder ?? a?.id ?? "").localeCompare(String(b?.numberOrder ?? b?.id ?? ""));
        });

        setOrders(sorted);
        const built = buildJournalEntriesFromOrders(sorted);
        setJournalEntries(built);
        localStorage.setItem("ordersData", JSON.stringify(sorted));
        localStorage.setItem("journalEntries", JSON.stringify(built));
      } catch (error) {
        console.error("Ошибка при загрузке заказов с сервера:", error);
      }
    };

    const loadTransactions = async () => {
      try {
        const response = await fetchTransactions({ page: 1, pageSize: 1000 });
        const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
        setTransactions(items);
        localStorage.setItem("transactionsData", JSON.stringify(items));
      } catch (error) {
        console.error("Ошибка при загрузке транзакций:", error);
      }
    };

    const loadEmployees = async () => {
      try {
        const list = await fetchEmployees();
        localStorage.setItem("employees", JSON.stringify(list));
        setActiveEmployees(list.filter((emp) => emp.status === "active"));
      } catch (error) {
        console.error("Ошибка при загрузке сотрудников:", error);
        const fromStorage = safeJsonParse(localStorage.getItem("employees"), []);
        setActiveEmployees((fromStorage || []).filter((emp) => emp.status === "active"));
      }
    };

    loadFields();
    loadOrders();
    loadTransactions();
    loadEmployees();
  }, []);

  const enrichedExecutors = useMemo(() => {
    const allPerformers = orders.flatMap((order) =>
      Array.isArray(order?.performers)
        ? order.performers.map((performer) => ({
            ...performer,
            orderId: order.id,
            orderNumber: order.orderSequence ?? order.numberOrder ?? order.id,
            orderName: order.name || order.title || "Название заказа отсутствует",
            order_main_client: order.clientName || order.orderMainClient || order.order_main_client || "Не заполнено",
            orderDescription: order.orderDescription,
          }))
        : []
    );

    return allPerformers.map((performer) => {
      const relevantEntries = journalEntries.filter(
        (entry) =>
          entry.executorRole === performer.performer &&
          String(entry.orderNumber) === String(performer.orderNumber)
      );

      const totalSecondsWorked = relevantEntries.reduce((total, entry) => total + parseHoursToSeconds(entry.hours), 0);
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
    if (executorId === "new") return {};
    return enrichedExecutors.find((e) => String(e.id) === String(executorId)) || null;
  }, [executorId, enrichedExecutors]);

  const executorsByPerformer = enrichedExecutors.reduce((acc, executor) => {
    const key = executor.performer || "Не указан";
    if (!acc[key]) acc[key] = [];
    acc[key].push(executor);
    return acc;
  }, {});

  const handleOpenModal = (executor) => {
    if (!executor || !executor.id) {
      navigate("/executors/new");
    } else {
      navigate(`/executors/${executor.id}`);
    }
  };

  const closeModal = () => {
    navigate({ pathname: "/executors", search: searchParams.toString() });
  };

  const handleSaveExecutor = async (executorData) => {
    const isNew = !executorData.id;
    const orderId = executorData.orderId || executorData.orderNumber;
    const performerEmployee = activeEmployees.find((emp) => String(emp.fullName) === String(executorData.performer));

    const updatedOrders = orders.map((order) => {
      if (String(order.id) !== String(orderId) && String(order.orderSequence ?? order.numberOrder ?? order.id) !== String(orderId)) {
        return order;
      }

      let updatedPerformers = Array.isArray(order.performers) ? order.performers : [];

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
        updatedPerformers = [...updatedPerformers, newExecutor];
      } else {
        updatedPerformers = updatedPerformers.map((p) =>
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

      try {
        updateOrder(order.id, { performers: updatedPerformers }).catch((error) => console.error(error));
      } catch (error) {
        console.error("Ошибка сохранения исполнителя в заказе:", error);
      }
      return { ...order, performers: updatedPerformers };
    });

    setOrders(updatedOrders);
    localStorage.setItem("ordersData", JSON.stringify(updatedOrders));
    closeModal();
  };

  const handleDeleteExecutor = async (executorToDelete) => {
    const orderId = executorToDelete.orderId || executorToDelete.orderNumber;

    const updatedOrders = orders.map((order) => {
      if (String(order.id) !== String(orderId) && String(order.orderSequence ?? order.numberOrder ?? order.id) !== String(orderId)) {
        return order;
      }
      const updatedPerformers = (order.performers || []).filter((p) => String(p.id) !== String(executorToDelete.id));
      try {
        updateOrder(order.id, { performers: updatedPerformers }).catch((error) => console.error(error));
      } catch (error) {
        console.error("Ошибка удаления исполнителя из заказа:", error);
      }
      return { ...order, performers: updatedPerformers };
    });

    setOrders(updatedOrders);
    localStorage.setItem("ordersData", JSON.stringify(updatedOrders));
    closeModal();
  };

  return (
    <>
      <div className="executors-page">
        <Sidebar />
        <div className="executors-page-main-container">
          <header className="executors-header-container">
            <h1 className="executors-title">
              <PageHeaderIcon pageName={"Исполнители"} />
              Исполнители
            </h1>
            <div className="view-mode-buttons">
              <button className={`view-mode-button ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")}>&#x25A3;</button>
              <button className={`view-mode-button ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>&#x2261;</button>
            </div>
            <div className="add-executor-wrapper">
              <button className="add-executor-button" onClick={() => handleOpenModal(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Добавить
              </button>
            </div>
          </header>

          <div className="executors-content">
            {viewMode === "table" && (
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
                    <tr className="table-spacer-row">
                      <td colSpan={16}></td>
                    </tr>
                    {enrichedExecutors.map((executor) => (
                      <tr
                        key={executor.id}
                        className="executor-row"
                        onClick={() => handleOpenModal(executor)}
                      >
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToOrder(executor.orderNumber);
                          }}
                          style={{ cursor: "pointer", color: "#3498db", fontWeight: "500" }}
                        >
                          {executor.orderNumber}
                        </td>
                        <td>
                          <span title={executor.orderStatus}>{executor.orderStatusEmoji}</span>
                        </td>
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
            {viewMode === "card" && (
              <div className="executors-cards-container">
                {Object.entries(executorsByPerformer).map(([performerName, performerOrders]) => (
                  <div key={performerName} className="performer-group">
                    <h2 className="performer-name-card">{performerName}</h2>
                    <div className="performer-orders-grid">
                      {performerOrders.map((order) => (
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
              key={modalExecutor.id || "new-executor"}
              executor={modalExecutor.id ? modalExecutor : null}
              onSave={handleSaveExecutor}
              onDelete={handleDeleteExecutor}
              onClose={closeModal}
              journalEntries={journalEntries}
              transactions={transactions}
              orders={orders}
              employees={activeEmployees} 
              roleOptions={localFieldOptions.role}         
              currencyOptions={localFieldOptions.currency} 
              onAddNewField={handleAddNewField}            
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ExecutorsPage;