import React, { useState, useRef, useEffect, useMemo } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";

import OrderSummary from "./OrderSummary";
import GeneralInformation from "./GeneralInformation";
import WorkPlan from "./WorkPlan";
import Participants from "./Participants";
import Finance from "./Finance";
import OrderExecution from "./OrderExecution";
import CompletingOrder from "./CompletingOrder";
import ConfirmationModal from "../confirm/ConfirmationModal";
import ChatPanel from "../../Client/ClientModal/ChatPanel";
import AddLogEntryForm from "../../Journal/AddLogEntryForm";
import * as executorService from "../../Executors/executorService";
import AddExecutorModal from "../../Executors/AddExecutorModal";
import AddTransactionModal from "../../Transaction/AddTransactionModal";
import { useTransactions } from "../../../context/TransactionsContext";
import { addLogEntry, getEmployees } from "../../Journal/journalApi";
import { getStageColor } from "../../Orders/stageColors";
import { fetchClients } from "../../../api/clients";
import "../../../styles/OrderModal.css";
import { X, Trash2, Copy, MoreVertical } from "lucide-react";
import { fetchFields, saveFields, withDefaults, serializeForSave, rid } from "../../../api/fields";
import { useFields } from "../../../context/FieldsContext";

const stages = [
  "Лид",
  "Изучаем ТЗ",
  "Обсуждаем с клиентом",
  "Клиент думает",
  "Ожидаем предоплату",
  "Взяли в работу",
  "Ведется разработка",
  "На уточнении у клиента",
  "Тестируем",
  "Тестирует клиент",
  "На доработке",
  "Ожидаем оплату",
  "Успешно завершен",
  "Закрыт",
  "Неудачно завершён",
  "Удаленные",
];

const tabs = ["Сводка", "Основное", "Планы", "Участники", "Финансы", "Выполнение", "Завершение"];

const newOrderDefaults = {
  stage: "Лид",
  tags: [],
  isOldOrder: false,
  urgency: "",
  appealDate: new Date().toISOString().split("T")[0],
  proposalDate: "",
  orderDate: "",
  interval: "",
  orderType: "",
  orderStatus: "",
  closeReason: "",
  plannedStartDate: "",
  plannedFinishDate: "",
  project: "",
  orderDescription: "",
  techTags: [],
  taskTags: [],
  workList: [{ description: "", amount: "", specification: "", sale: false }],
  additionalOptions: [],
  techSpecifications: "",
  additionalConditions: "",
  notes: "",
  order_client: "",
  order_main_client: "",
  client_company: "",
  partner_name: "",
  third_parties: [],
  partner_disable_share: false,
  partner_payment: "",
  partner_plan: "",
  partner_percent_plan: "",
  partner_sum_plan: "",
  partner_underpayment: "",
  performers: [],
  share_percent: "",
  budget: "",
  minOrderAmount: "",
  currency_type: "",
  currency_rate: "",
  hourly_rate: "",
  round_hour: false,
  discount: "",
  discountReason: "",
  upsell: "",
  expenses: "",
  tips: "",
  payment_details: "",
  payment_log: [{ date: "", item: "", sub_item: "", account: "", amount: "" }],
  executionTime: "",
  startDate: "",
  endDate: "",
  countDays: "",
  completedDate: "",
  completingTime: "",
  completingLink: "",
  orderImpressions: "",
  solutionLink: "",
  additionalSolutionLinks: "",
  solutionCopyLink: "",
  readySolution: "",
  work_log: [],
};

function OrderModal({
  order = null,
  mode = "edit",
  onClose,
  onUpdateOrder,
  onCreateOrder,
  onDeleteOrder,
  journalEntries,
}) {
  const formDefaults = useMemo(() => {
    if (mode === "create") return newOrderDefaults;
    return {
      ...newOrderDefaults,
      ...order,
      tags: order?.tags || [],
      techTags: order?.techTags || [],
      taskTags: order?.taskTags || [],
      workList: order?.workList?.length > 0 ? order.workList : [{ description: "", amount: "", specification: "", sale: false }],
      additionalOptions: Array.isArray(order?.additionalOptions) ? order.additionalOptions : [],
      third_parties: order?.third_parties || [],
      performers: order?.performers || [],
      payment_log: order?.payment_log?.length > 0 ? order.payment_log : [{ date: "", item: "", sub_item: "", account: "", amount: "" }],
      work_log: order?.work_log || [],
    };
  }, [mode, order]);

  const methods = useForm({
    defaultValues: formDefaults,
  });

  const { control, handleSubmit, watch, reset, setValue, getValues, formState } = methods;
  const { isDirty } = formState;

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  const {
    transactions,
    isAddModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal,
    addTransaction,
    assets,
    financeFields,
    initialDataForModal,
    orders,
    counterparties,
  } = useTransactions();

  const [customTag, setCustomTag] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("Сводка");
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showStageDropdown, setShowStageDropdown] = useState(false);


  const [orderFields, setOrderFields] = useState({
    intervals: [],
    categories: [],
    currency: [],
    statuses: [],
    closeReasons: [],
    projects: [],
    discountReason: [],
    tags: [],
    techTags: [],
    taskTags: [],
    readySolution: [],
  });

  const { refreshFields } = useFields();

  const loadFields = async () => {
    try {
      const raw = await fetchFields();
      const norm = withDefaults(raw);
      setOrderFields({
        intervals: norm.orderFields?.intervals || [],
        categories: norm.orderFields?.categories || [],
        currency: norm.generalFields?.currency || [],
        statuses: norm.orderFields?.statuses || [],
        closeReasons: norm.orderFields?.closeReasons || [],
        projects: norm.orderFields?.projects || [],
        discountReason: norm.orderFields?.discountReason || [],
        tags: norm.orderFields?.tags || [],
        techTags: norm.orderFields?.techTags || [],
        taskTags: norm.orderFields?.taskTags || [],
        readySolution: norm.orderFields?.readySolution || [],
      });
    } catch (err) {
      console.error("Ошибка загрузки полей:", err);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleAddNewField = async (group, fieldName, newValue, extraData = {}) => {
    try {
        const raw = await fetchFields();
        const normalized = withDefaults(raw);
        const list = normalized[group]?.[fieldName] || [];

        let exists = false;
        let newItem = { id: rid(), isDeleted: false };

        if (fieldName === "categories") {
            exists = list.find(item => 
                item.categoryValue && item.categoryValue.toLowerCase() === newValue.toLowerCase() &&
                item.categoryInterval === extraData.categoryInterval
            );
            newItem.categoryInterval = extraData.categoryInterval;
            newItem.categoryValue = newValue;
        } else if (fieldName === "intervals") {
            exists = list.find(item => item.intervalValue && item.intervalValue.toLowerCase() === newValue.toLowerCase());
            newItem.intervalValue = newValue;
        } else {
            exists = list.find(item => item.value && item.value.toLowerCase() === newValue.toLowerCase());
            newItem.value = newValue;
        }

        if (!exists) {
            list.push(newItem);
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

  const [clientsData, setClientsData] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddExecutorModalOpen, setIsAddExecutorModalOpen] = useState(false);
  const [executorFormFields, setExecutorFormFields] = useState({
    employees: [],
    role: [],
    currency: [],
  });
  const [employees, setEmployees] = useState([]);

  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const stageDropdownRef = useRef(null);

  const watchedStage = watch("stage");
  const watchedTags = watch("tags") || [];

  useEffect(() => {
    try {
      setEmployees(getEmployees());
    } catch (e) {
      console.error("Не удалось загрузить сотрудников:", e);
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    if (!order || !order.id || !journalEntries) return;

    const relevantEntries = journalEntries.filter((entry) => {
      const orderIdStr = String(order.id);
      const entryOrderNumStr = String(entry.orderNumber).trim();
      return orderIdStr === entryOrderNumStr;
    });

    const formattedWorkLog = relevantEntries.map((entry) => ({
      executor: entry.email,
      role: entry.executorRole,
      work_date: entry.workDate,
      hours: entry.hours,
      description: entry.workDone,
      original_id: entry.id,
    }));

    const currentFormValues = getValues();
    reset({
      ...currentFormValues,
      work_log: formattedWorkLog,
    });
  }, [order, journalEntries, reset, getValues]);

  const orderTransactions = useMemo(() => {
    if (!order?.id && !order?.numberOrder && order?.orderSequence == null) return [];
    const orderId = order?.id ? String(order.id) : null;
    const orderNumber = order?.numberOrder ? String(order.numberOrder) : null;
    const orderSequence =
      order?.orderSequence !== undefined && order?.orderSequence !== null
        ? String(order.orderSequence)
        : null;

    const list = Array.isArray(transactions) ? transactions : [];
    return list.filter((trx) => {
      const trxOrderId = trx?.orderId ?? trx?.order_id ?? trx?.order?.id ?? null;
      const trxOrderNumber = trx?.orderNumber ?? trx?.order_number ?? trx?.order?.numberOrder ?? null;

      if (orderId && trxOrderId != null && String(trxOrderId) === orderId) return true;
      if (orderNumber && trxOrderNumber != null && String(trxOrderNumber) === orderNumber) return true;
      if (orderSequence && trxOrderNumber != null && String(trxOrderNumber) === orderSequence) return true;
      return false;
    });
  }, [transactions, order?.id, order?.numberOrder, order?.orderSequence]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const clients = await fetchClients();
        if (mounted) setClientsData(clients);
      } catch (e) {
        console.error("Не удалось загрузить клиентов:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const savedFields = localStorage.getItem("fieldsData");
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields);
        const employeesFromStorage = JSON.parse(localStorage.getItem("employees")) || [];
        const activeEmployees = (Array.isArray(employeesFromStorage) ? employeesFromStorage : []).filter(
          (emp) => emp.status === "active"
        );

        const execFields = parsed?.executorFields ?? { role: [], currency: [] };

        setExecutorFormFields({
          employees: activeEmployees,
          role: execFields.role || [],
          currency: execFields.currency || [],
        });
      } catch (e) {
        console.error("Ошибка парсинга полей из localStorage:", e);
      }
    } else {
      const employeesFromStorage = JSON.parse(localStorage.getItem("employees")) || [];
      const activeEmployees = (Array.isArray(employeesFromStorage) ? employeesFromStorage : []).filter(
        (emp) => emp.status === "active"
      );
      setExecutorFormFields((prev) => ({ ...prev, employees: activeEmployees }));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(target) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(target)
      ) {
        setShowTagDropdown(false);
      }

      if (stageDropdownRef.current && !stageDropdownRef.current.contains(target)) {
        setShowStageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateDaysFromOrder = () => {
    if (mode === "create" || !order?.date) return 0;
    const orderDate = new Date(order.date.split(".").reverse().join("-"));
    const currentDate = new Date();
    const diffTime = currentDate - orderDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const createMultiColorProgress = () => {
    const currentStageIndex = stages.indexOf(watchedStage);
    const segments = [];
    for (let i = 0; i <= currentStageIndex; i += 1) {
      const stageColor = getStageColor(stages[i]);
      const segmentWidth = (1 / stages.length) * 100;
      segments.push({
        color: stageColor,
        width: segmentWidth,
        left: i * segmentWidth,
      });
    }
    return segments;
  };

  const availableOrderTags = (orderFields?.tags || [])
    .filter(t => !t.isDeleted)
    .map((t) => (typeof t === "string" ? t : t?.name || t?.value))
    .filter(Boolean);

  const tagOptions = availableOrderTags;

  const filteredTags = tagOptions.filter(
    (tag) => !watchedTags.includes(tag) && tag.toLowerCase().includes(customTag.toLowerCase())
  );

  const handleTagSelect = (tag, onChange) => {
    if (tag && !watchedTags.includes(tag)) {
      onChange([...watchedTags, tag]);
      setCustomTag("");
      setShowTagDropdown(false);
    }
  };

  const handleCustomTagAdd = (e, onChange) => {
    if (e.key === "Enter" && customTag.trim() && !watchedTags.includes(customTag.trim())) {
      const newVal = customTag.trim();
      onChange([...watchedTags, newVal]);
      handleAddNewField("orderFields", "tags", newVal);
      setCustomTag("");
      setShowTagDropdown(false);
      e.preventDefault();
    }
  };

  const handleTagInputChange = (e) => {
    setCustomTag(e.target.value);
    setShowTagDropdown(true);
  };

  const handleTagInputFocus = () => setShowTagDropdown(true);

  const handleTagRemove = (tagToRemove, onChange) => {
    onChange(watchedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleStageSelect = (stage, onChange) => {
    onChange(stage);
    setShowStageDropdown(false);
  };

  const handleActionSelect = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
    setShowActionsMenu(false);
  };

  const handleConfirmAction = () => {
    if (confirmAction === "duplicate") {
      console.log("Дублируем заказ", order?.id);
    } else if (confirmAction === "delete") {
      if (onDeleteOrder && order?.id) onDeleteOrder(order.id);
      onClose?.();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const getConfirmModalProps = () => {
    if (confirmAction === "duplicate") {
      return {
        title: "Дублировать заказ",
        message: `Вы уверены, что хотите дублировать заказ #${order?.id}?`,
        confirmText: "Дублировать",
        cancelText: "Отмена",
      };
    }
    if (confirmAction === "delete") {
      return {
        title: "Удалить заказ",
        message: `Вы уверены, что хотите удалить заказ #${order?.id}? Это действие нельзя отменить.`,
        confirmText: "Удалить",
        cancelText: "Отмена",
      };
    }
    return {};
  };

  const handleAddLogEntry = (logData) => {
    addLogEntry({ ...logData });
    setIsLogModalOpen(false);
  };

  const handleAddExecutor = (executorDataFromModal) => {
    const employeeDetails = executorFormFields.employees.find(
      (emp) => emp.fullName === executorDataFromModal.performer
    );

    if (employeeDetails) {
      const newExecutorForOrder = {
        ...executorDataFromModal,
        login: employeeDetails.login,
        fullName: employeeDetails.fullName,
      };

      const currentPerformers = getValues("performers") || [];
      setValue("performers", [...currentPerformers, newExecutorForOrder], { shouldDirty: true });

      executorService.addExecutor(newExecutorForOrder);
    }

    setIsAddExecutorModalOpen(false);
  };

  const handleClientPayment = () => {
    const defaults = {
      operation: "Зачисление",
      category: "Оплата от клиента",
      subcategory: "Предоплата",
      counterparty: order?.clientName,
      amount: order?.totalPrice,
      description: `Оплата по заказу #${order?.id}`,
    };
    openAddTransactionModal(defaults);
  };

  const handlePartnerPayout = () => {
    const defaults = {
      operation: "Списание",
      category: "Выплата партнеру",
      counterparty: order?.partnerName,
      amount: order?.partnerFee,
      description: `Выплата партнеру по заказу #${order?.id}`,
    };
    openAddTransactionModal(defaults);
  };

  const handleExecutorPayout = () => {
    const defaults = {
      operation: "Списание",
      category: "Выплата исполнителю",
      counterparty: order?.executorName,
      amount: order?.executorFee,
      description: `Выплата исполнителю по заказу #${order?.id}`,
    };
    openAddTransactionModal(defaults);
  };

  const onSubmit = (data) => {
    if (mode === "create") {
      onCreateOrder?.(data);
    } else {
      onUpdateOrder?.({
        ...order,
        ...data,
      });
    }
    onClose?.();
  };

  const resetChanges = () => {
    reset(formDefaults);
  };

  const multiColorSegments = createMultiColorProgress();
  const daysFromOrder = calculateDaysFromOrder();

  return (
    <div className="order-modal-overlay">
      <div className="order-modal-content custom-scrollbar">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="order-modal-form">
            <div className="order-modal-header-section">
              <div className="header-top-row">
                <div className="order-modal-header">
                  <h2 className="modal-order-title">
                    {mode === "create"
                      ? "Создание нового заказа"
                      : order?.name ||
                        (order?.numberOrder
                          ? `${
                              order?.orderSequence !== undefined && order?.orderSequence !== null
                                ? "Заказ №"
                                : "Заявка №"
                            } ${order.numberOrder}`
                          : `Заявка #${order?.id}`)}
                  </h2>

                  <div className="header-controls">
                    {mode === "edit" && (
                      <div className="order-actions-menu">
                        <button
                          type="button"
                          className="order-actions-btn"
                          onClick={() => setShowActionsMenu(!showActionsMenu)}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {showActionsMenu && (
                          <div className="order-options-menu">
                            <button
                              type="button"
                              className="order-menu-item"
                              onClick={() => handleActionSelect("duplicate")}
                            >
                              <span className="order-menu-icon">
                                <Copy size={14} />
                              </span>{" "}
                              Дублировать заказ
                            </button>
                            <button
                              type="button"
                              className="order-menu-item order-delete-item"
                              onClick={() => handleActionSelect("delete")}
                            >
                              <span className="order-menu-icon">
                                <Trash2 size={14} />
                              </span>{" "}
                              Удалить заказ
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <button className="close-button" onClick={onClose} type="button">
                      <X />
                    </button>
                  </div>
                </div>
              </div>

              <div className="tags-section-header">
                <Controller
                  control={control}
                  name="tags"
                  render={({ field: { onChange } }) => (
                    <>
                      <div className="tag-input-container-header" ref={tagInputRef}>
                        <input
                          type="text"
                          placeholder="Добавить тег"
                          className="input-tag"
                          style={{ width: "95px" }}
                          value={customTag}
                          onChange={handleTagInputChange}
                          onKeyDown={(e) => handleCustomTagAdd(e, onChange)}
                          onFocus={handleTagInputFocus}
                          autoComplete="off"
                        />
                        {showTagDropdown && (filteredTags.length > 0 || customTag.trim()) && (
                          <div className="tag-dropdown-header" ref={tagDropdownRef}>
                            {filteredTags.map((tag) => (
                              <div
                                key={tag}
                                className="tag-dropdown-item-header"
                                onClick={() => handleTagSelect(tag, onChange)}
                              >
                                {tag}
                              </div>
                            ))}
                            {customTag.trim() &&
                              !tagOptions.includes(customTag.trim()) &&
                              !watchedTags.includes(customTag.trim()) && (
                                <div
                                  className="tag-dropdown-item tag-dropdown-custom-header"
                                  onClick={() => {
                                      handleTagSelect(customTag.trim(), onChange);
                                      handleAddNewField("orderFields", "tags", customTag.trim());
                                  }}
                                >
                                  Добавить: "{customTag}"
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {watchedTags.map((tag, index) => (
                        <span
                          key={`${tag}_${index}`}
                          className="tag-chips tag-order-chips-header"
                          onClick={() => handleTagRemove(tag, onChange)}
                        >
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                />
              </div>

              <div className="developing-stages-container">
                <Controller
                  control={control}
                  name="stage"
                  render={({ field: { value, onChange } }) => (
                    <div className="stage-select-container">
                      <div className="custom-stage-select" ref={stageDropdownRef}>
                        <div
                          className="stage-select-trigger"
                          onClick={() => setShowStageDropdown(!showStageDropdown)}
                          style={{ color: getStageColor(value) }}
                        >
                          {value}
                        </div>
                        {showStageDropdown && (
                          <div className="stage-dropdown">
                            {stages.map((stage) => (
                              <div
                                key={stage}
                                className="stage-dropdown-item"
                                onClick={() => handleStageSelect(stage, onChange)}
                                style={{ color: getStageColor(stage) }}
                              >
                                {stage}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {mode === "edit" && daysFromOrder > 0 && (
                        <span className="days-counter">
                          {daysFromOrder} {daysFromOrder === 1 ? "день" : daysFromOrder < 5 ? "дня" : "дней"}
                        </span>
                      )}
                    </div>
                  )}
                />

                <div className="progress-bar">
                  {multiColorSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="progress-segment"
                      style={{
                        width: `${segment.width}%`,
                        backgroundColor: segment.color,
                        left: `${segment.left}%`,
                        position: "absolute",
                        height: "100%",
                        borderRadius:
                          index === 0
                            ? "4px 0 0 4px"
                            : index === multiColorSegments.length - 1
                            ? "0 4px 4px 0"
                            : "0",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="order-tabs-container">
                <div className="tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`tab-menu-btn${activeTab === tab ? " active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-modal-body-section">
              <div className="tab-content">
                {activeTab === "Сводка" && <OrderSummary />}
                {activeTab === "Основное" && (
                  <GeneralInformation 
                    control={control} 
                    orderFields={orderFields} 
                    mode={mode} 
                    onAddNewField={handleAddNewField} 
                  />
                )}
                {activeTab === "Планы" && (
                  <WorkPlan 
                    control={control} 
                    orderFields={orderFields} 
                    mode={mode} 
                    onAddNewField={handleAddNewField} 
                  />
                )}
                {activeTab === "Участники" && (
                  <Participants
                    control={control}
                    mode={mode}
                    clientsData={clientsData}
                    employeesData={executorFormFields.employees}
                    onOpenAddExecutorModal={() => setIsAddExecutorModalOpen(true)}
                  />
                )}
                {activeTab === "Финансы" && (
                  <Finance 
                    control={control} 
                    orderFields={orderFields} 
                    mode={mode} 
                    transactions={orderTransactions} 
                    onAddNewField={handleAddNewField} 
                  />
                )}
                {activeTab === "Выполнение" && <OrderExecution control={control} mode={mode} />}
                {activeTab === "Завершение" && <CompletingOrder control={control} mode={mode} onAddNewField={handleAddNewField} />}
              </div>
            </div>

            <div className="order-modal-footer">
              {isDirty && (
                <div className="action-buttons">
                  <button type="button" className="cancel-order-btn" onClick={resetChanges}>
                    Отменить
                  </button>
                  <button type="submit" className="save-order-btn">
                    Сохранить
                  </button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>

      <div className="order-chat-panel-wrapper">
        {mode === "create" ? (
          <div className="chat-placeholder">
            <p>Сохраните заказ, чтобы начать общение в чате.</p>
          </div>
        ) : (
          <ChatPanel orderId={order?.id} />
        )}
      </div>

      <div className="right-side-menu">
        {mode === "create" ? (
          <div className="menu-placeholder">
            <p>Сохраните заказ чтобы пользоваться функциональным меню.</p>
          </div>
        ) : (
          <>
            <button type="button" className="menu-button" onClick={() => setIsAddExecutorModalOpen(true)}>
              Прикрепить исполнителя
            </button>
            <button type="button" className="menu-button" onClick={() => setIsLogModalOpen(true)}>
              Запись в журнал
            </button>
            <button type="button" className="menu-button">
              Поставить задачу
            </button>

            <div className="menu-separator" />

            <button type="button" className="menu-button">
              Сгенерировать счет
            </button>
            <button type="button" className="menu-button" onClick={handleClientPayment}>
              Оплата клиента
            </button>
            <button type="button" className="menu-button" onClick={handlePartnerPayout}>
              Выплата партнеру
            </button>
            <button type="button" className="menu-button" onClick={handleExecutorPayout}>
              Выплата исполнителю
            </button>

            <div className="menu-separator" />

            <button type="button" className="menu-button">
              Ссылка на отзыв
            </button>
            <button type="button" className="menu-button">
              Ссылка на отзыв 2
            </button>

            <div className="menu-separator" />

            <button type="button" className="menu-button" onClick={() => handleActionSelect("duplicate")}>
              Дублировать заказ
            </button>
          </>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          {...getConfirmModalProps()}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      )}

      {isLogModalOpen && (
        <AddLogEntryForm
          onAdd={handleAddLogEntry}
          onClose={() => setIsLogModalOpen(false)}
          orders={orders}
          employees={employees}
        />
      )}

      {isAddExecutorModalOpen && (
        <AddExecutorModal
          onAdd={handleAddExecutor}
          onClose={() => setIsAddExecutorModalOpen(false)}
          fields={executorFormFields}
          orders={orders}
        />
      )}

      {isAddModalOpen && (
        <AddTransactionModal
          onAdd={addTransaction}
          onClose={closeAddTransactionModal}
          assets={assets}
          financeFields={financeFields}
          initialData={initialDataForModal}
          orders={orders}
          counterparties={counterparties}
        />
      )}
    </div>
  );
}

export default OrderModal;