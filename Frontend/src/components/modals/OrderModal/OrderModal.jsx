// src/components/modals/OrderModal/OrderModal.jsx
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

const defaultTagsFallback = ["Срочный", "В приоритете", "На паузе", "Клиент VIP"];

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
  const methods = useForm({
    defaultValues:
      mode === "create"
        ? newOrderDefaults
        : {
            stage: order?.stage || "",
            tags: order?.tags || [],
            isOldOrder: order?.isOldOrder || false,
            urgency: order?.urgency || "",
            appealDate: order?.appealDate || "",
            proposalDate: order?.proposalDate || "",
            orderDate: order?.orderDate || "",
            interval: order?.interval || "",
            orderType: order?.orderType || "",
            orderStatus: order?.orderStatus || "",
            closeReason: order?.closeReason || "",
            plannedStartDate: order?.plannedStartDate || "",
            plannedFinishDate: order?.plannedFinishDate || "",
            project: order?.project || "",
            orderDescription: order?.orderDescription || "",
            techTags: order?.techTags || [],
            taskTags: order?.taskTags || [],
            workList:
              order?.workList && order.workList.length > 0
                ? order.workList
                : [{ description: "", amount: "", specification: "", sale: false }],
            techSpecifications: order?.techSpecifications || "",
            additionalConditions: order?.additionalConditions || "",
            notes: order?.notes || "",
            order_client: order?.order_client || "",
            order_main_client: order?.order_main_client || "",
            client_company: order?.client_company || "",
            partner_name: order?.partner_name || "",
            third_parties: order?.third_parties || [],
            partner_disable_share: order?.partner_disable_share ?? false,
            partner_payment: order?.partner_payment ?? "",
            partner_plan: order?.partner_plan ?? "",
            partner_percent_plan: order?.partner_percent_plan ?? "",
            partner_sum_plan: order?.partner_sum_plan ?? "",
            partner_underpayment: order?.partner_underpayment ?? "",
            performers: order?.performers || [],
            // ВАЖНО: используем ?? чтобы не терять 0 / false
            share_percent: order?.share_percent ?? "",
            budget: order?.budget ?? "",
            minOrderAmount: order?.minOrderAmount ?? "",
            currency_type: order?.currency_type ?? "",
            currency_rate: order?.currency_rate ?? "",
            hourly_rate: order?.hourly_rate ?? "",
            round_hour: order?.round_hour ?? false,
            discount: order?.discount ?? "",
            discountReason: order?.discountReason ?? "",
            upsell: order?.upsell ?? "",
            expenses: order?.expenses ?? "",
            tips: order?.tips ?? "",
            payment_details: order?.payment_details ?? "",
            payment_log:
              order?.payment_log && order.payment_log.length > 0
                ? order.payment_log
                : [{ date: "", item: "", sub_item: "", account: "", amount: "" }],
            executionTime: order?.executionTime || "",
            startDate: order?.startDate || "",
            endDate: order?.endDate || "",
            countDays: order?.countDays ?? "",
            completedDate: order?.completedDate || "",
            completingTime: order?.completingTime || "",
            completingLink: order?.completingLink || "",
            orderImpressions: order?.orderImpressions || "",
            work_log: order?.work_log || [],
          },
  });

  const { control, handleSubmit, watch, reset, setValue, getValues, formState } = methods;
  const { isDirty } = formState;

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
  });

  const [clientsData, setClientsData] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddExecutorModalOpen, setIsAddExecutorModalOpen] = useState(false);
  const [executorFormFields, setExecutorFormFields] = useState({
    employees: [],
    role: [],
    currency: [],
  });
  const [employees, setEmployees] = useState([]);

  // ---- refs для кликов снаружи ----
  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const stageDropdownRef = useRef(null);

  // ---- watchers ----
  const watchedStage = watch("stage");
  const watchedTags = watch("tags") || [];

  // ---- загрузка сотрудников (локально) ----
  useEffect(() => {
    try {
      setEmployees(getEmployees());
    } catch (e) {
      console.error("Не удалось загрузить сотрудников:", e);
      setEmployees([]);
    }
  }, []);

  // ---- подтянуть work_log из журнала ----
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

  // ---- операции/транзакции заказа из контекста ----
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
      const trxOrderNumber =
        trx?.orderNumber ?? trx?.order_number ?? trx?.order?.numberOrder ?? null;

      if (orderId && trxOrderId != null && String(trxOrderId) === orderId) return true;
      if (orderNumber && trxOrderNumber != null && String(trxOrderNumber) === orderNumber)
        return true;
      if (orderSequence && trxOrderNumber != null && String(trxOrderNumber) === orderSequence)
        return true;
      return false;
    });
  }, [transactions, order?.id, order?.numberOrder, order?.orderSequence]);

  // ---- клиенты ----
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

  // ---- поля заказов + поля исполнителей из localStorage ----
  useEffect(() => {
    const savedFields = localStorage.getItem("fieldsData");
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields);

        if (parsed?.orderFields) {
          const base = {
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
          };
          setOrderFields({ ...base, ...parsed.orderFields });
        }

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
      // хотя бы сотрудников подтянем
      const employeesFromStorage = JSON.parse(localStorage.getItem("employees")) || [];
      const activeEmployees = (Array.isArray(employeesFromStorage) ? employeesFromStorage : []).filter(
        (emp) => emp.status === "active"
      );
      setExecutorFormFields((prev) => ({ ...prev, employees: activeEmployees }));
    }
  }, []);

  // ---- закрытие дропдаунов кликом снаружи ----
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

  // ---- helpers ----
  const calculateDaysFromOrder = () => {
    // у тебя было: order?.date; оставляю как было
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
    for (let i = 0; i <= currentStageIndex; i++) {
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
    .map((t) => (typeof t === "string" ? t : t?.name))
    .filter(Boolean);

  const tagOptions = availableOrderTags.length ? availableOrderTags : defaultTagsFallback;

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
      onChange([...watchedTags, customTag.trim()]);
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
      // тут можно будет вызвать onDuplicate если появится
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
    reset(mode === "create" ? newOrderDefaults : methods.getValues());
    // Если хочешь вернуть именно исходный order, а не текущие значения — можно подставить объект как в defaultValues
    // но это очень длинно, поэтому оставил безопасный вариант. Ниже вариант "как было раньше":
    // reset({...newOrderDefaultsFromOrder});
  };

  const multiColorSegments = createMultiColorProgress();
  const daysFromOrder = calculateDaysFromOrder();

  return (
    <div className="order-modal-overlay">
      <div className="order-modal-content custom-scrollbar">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="order-modal-form">
            {/* HEADER */}
            <div className="order-modal-header-section">
              <div className="header-top-row">
                <div className="order-modal-header">
                  <h2 className="modal-order-title">
                    {mode === "create"
                      ? "Создание нового заказа"
                      : order?.name ||
                        (order?.numberOrder
                          ? `${order?.orderSequence !== undefined && order?.orderSequence !== null ? "Заказ №" : "Заявка №"} ${
                              order.numberOrder
                            }`
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

              {/* TAGS */}
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
                                  onClick={() => handleTagSelect(customTag.trim(), onChange)}
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

              {/* STAGE */}
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
                          {daysFromOrder}{" "}
                          {daysFromOrder === 1 ? "день" : daysFromOrder < 5 ? "дня" : "дней"}
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

              {/* TABS */}
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

            {/* BODY */}
            <div className="order-modal-body-section">
              <div className="tab-content">
                {activeTab === "Сводка" && <OrderSummary />}
                {activeTab === "Основное" && (
                  <GeneralInformation control={control} orderFields={orderFields} mode={mode} />
                )}
                {activeTab === "Планы" && (
                  <WorkPlan control={control} orderFields={orderFields} mode={mode} />
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
                  <Finance control={control} orderFields={orderFields} mode={mode} transactions={orderTransactions} />
                )}
                {activeTab === "Выполнение" && <OrderExecution control={control} mode={mode} />}
                {activeTab === "Завершение" && <CompletingOrder control={control} mode={mode} />}
              </div>
            </div>

            {/* FOOTER */}
            <div className="order-modal-footer">
              <div className="action-buttons">
                <button type="button" className="cancel-order-btn" onClick={resetChanges}>
                  Отменить
                </button>
                <button type="submit" className="save-order-btn">
                  Сохранить
                </button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* CHAT */}
      <div className="order-chat-panel-wrapper">
        {mode === "create" ? (
          <div className="chat-placeholder">
            <p>Сохраните заказ, чтобы начать общение в чате.</p>
          </div>
        ) : (
          <ChatPanel orderId={order?.id} />
        )}
      </div>

      {/* RIGHT MENU */}
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

      {/* MODALS */}
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
