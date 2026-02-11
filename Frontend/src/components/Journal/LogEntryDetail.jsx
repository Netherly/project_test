import React, { useEffect, useRef, useState, useMemo } from "react";
import "./LogEntryDetails.css";
import ConfirmationModal from "../modals/confirm/ConfirmationModal";

const calculateHours = (start, end) => {
  if (!start || !end) return "0:00";
  try {
    const [startHour, startMinute] = String(start).split(":").map(Number);
    const [endHour, endMinute] = String(end).split(":").map(Number);

    const startDate = new Date(0, 0, 0, startHour, startMinute);
    const endDate = new Date(0, 0, 0, endHour, endMinute);

    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);

    const diffMs = endDate - startDate;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

    return `${diffHours}:${String(diffMinutes).padStart(2, "0")}`;
  } catch {
    return "0:00";
  }
};

const roundToNearest5Minutes = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = String(timeString).split(":").map(Number);
  const roundedMinutes = Math.round(minutes / 5) * 5;

  const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  const finalHours = roundedMinutes === 60 ? (hours + 1) % 24 : hours;

  return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(
    2,
    "0"
  )}`;
};

const calculatePointsAndPenalty = (workDate, startTime, createdAt = new Date()) => {
  if (!workDate || !startTime) return { points: 0, penalty: 0, coefficient: 1 };

  try {
    const [year, month, day] = String(workDate).split("-").map(Number);
    const [hours, minutes] = String(startTime).split(":").map(Number);

    const workDateTime = new Date(year, month - 1, day, hours, minutes);
    const diffMs = createdAt - workDateTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    let points = 0;
    let penalty = 0;
    let coefficient = 1;

    if (diffHours <= 24) {
      points = 1;
      coefficient = 1;
    } else if (diffHours <= 48) {
      points = 0;
      coefficient = 1;
    } else if (diffHours <= 72) {
      penalty = 0.5;
      coefficient = 0.75;
    } else {
      penalty = 1;
      coefficient = 0.5;
    }

    return { points, penalty, coefficient };
  } catch {
    return { points: 0, penalty: 0, coefficient: 1 };
  }
};

const LogEntryDetail = ({
  entry,
  onClose,
  onDelete,
  onDuplicate,
  onUpdate,
  employees = [],
  orders = [],
  availableRoles = [],
  statusToEmojiMap = {},
}) => {
  const textareaRef = useRef(null);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // NOTE: в нашей модели из JournalPage value в селекте заказа = order.id
  const initialState = useMemo(() => {
    if (!entry) return null;

    const safeRole =
      typeof entry.role === "string"
        ? entry.role
        : Array.isArray(entry.role) && entry.role.length > 0
        ? entry.role[0]
        : "";

    return {
      ...entry,
      // фикс: в форме роль — строка
      role: safeRole,
      status: entry.status || "",
      correctionTime: entry.correctionTime || "",
      // унифицируем trackerHours
      trackerHours: entry.trackerHours || entry.trackingHours || "",
      // orderId может отсутствовать у старых записей — восстановим по orders
      orderId: entry.orderId || "",
    };
  }, [entry]);

  const [editedEntry, setEditedEntry] = useState(initialState);
  const [initialEntry, setInitialEntry] = useState(initialState);

  // если entry поменялся (открыли другую запись) — сбросим форму
  useEffect(() => {
    setEditedEntry(initialState);
    setInitialEntry(initialState);
  }, [initialState]);

  // активные заказы (для списка можно оставить, но сейчас select берёт всё из orders)
  const activeOrders = useMemo(() => {
    const activeStatuses = [
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
    ];

    return (orders || [])
      .map((order) => ({
        id: order?.id ?? "",
        label: order?.orderSequence ?? order?.numberOrder ?? order?.orderNumber ?? order?.id ?? "",
        description: order?.description || order?.orderDescription || order?.name || "",
        status: order?.status || order?.stage || order?.orderStatus || "",
      }))
      .filter(
        (o) =>
          activeStatuses.includes(o.status) ||
          String(o.id) === String(entry?.orderId) ||
          String(o.label) === String(entry?.orderNumber)
      );
  }, [orders, entry?.orderId, entry?.orderNumber]);

  // подтягиваем статус/описание при смене заказа
  useEffect(() => {
    if (!editedEntry) return;

    const oid = editedEntry.orderId || editedEntry.orderNumber || "";
    if (!oid) return;

    const currentOrder =
      orders.find((o) => String(o.id) === String(oid)) ||
      orders.find((o) => String(o.orderNumber) === String(oid)) ||
      orders.find((o) => String(o.orderSequence) === String(oid)) ||
      orders.find((o) => String(o.numberOrder) === String(oid));

    if (!currentOrder) return;

    const nextDescription =
      currentOrder.description || currentOrder.orderDescription || currentOrder.name || "";
    const nextStatus = currentOrder.status || currentOrder.stage || currentOrder.orderStatus || "";

    setEditedEntry((prev) => ({
      ...prev,
      description: nextDescription,
      status: nextStatus,
      // orderNumber в журнале хранит "номер заказа" (для отображения)
      orderNumber:
        prev.orderNumber ||
        currentOrder.orderSequence ||
        currentOrder.numberOrder ||
        currentOrder.orderNumber ||
        currentOrder.id,
      // orderId нужен для обновления workLog у заказа
      orderId: currentOrder.id,
    }));
  }, [editedEntry?.orderId, editedEntry?.orderNumber, orders]);

  // автоподсчёт часов
  useEffect(() => {
    if (!editedEntry) return;
    setEditedEntry((prev) => ({
      ...prev,
      hours: calculateHours(prev.startTime, prev.endTime),
    }));
  }, [editedEntry?.startTime, editedEntry?.endTime]);

  // авто-ресайз textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [editedEntry?.workDone]);

  if (!entry || !editedEntry) return null;

  const hasUnsavedChanges = () => {
    if (!initialEntry) return false;
    for (const key in initialEntry) {
      if (JSON.stringify(editedEntry[key]) !== JSON.stringify(initialEntry[key])) return true;
    }
    return false;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // orderId — главный идентификатор заказа в API
    if (!String(editedEntry.orderId || "").trim()) {
      errors.orderNumber = true;
      isValid = false;
    }
    if (!String(editedEntry.executorRole || "").trim()) {
      errors.executorRole = true;
      isValid = false;
    }
    if (!String(editedEntry.role || "").trim()) {
      errors.role = true;
      isValid = false;
    }
    if (!String(editedEntry.workDate || "").trim()) {
      errors.workDate = true;
      isValid = false;
    }
    if (!String(editedEntry.workDone || "").trim()) {
      errors.workDone = true;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onUpdate(editedEntry);
    setInitialEntry(editedEntry);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "orderId") {
      // value = order.id
      const selectedOrder = orders.find((o) => String(o.id) === String(value));
      setEditedEntry((prev) => ({
        ...prev,
        orderId: value,
        // отображаемый номер заказа (как в JournalPage)
        orderNumber:
          selectedOrder?.orderSequence ??
          selectedOrder?.numberOrder ??
          selectedOrder?.orderNumber ??
          selectedOrder?.id ??
          "",
        description:
          selectedOrder?.description ||
          selectedOrder?.orderDescription ||
          selectedOrder?.name ||
          "",
        status:
          selectedOrder?.status ||
          selectedOrder?.stage ||
          selectedOrder?.orderStatus ||
          "",
      }));
      return;
    }

    setEditedEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeBlur = (e) => {
    const { name, value } = e.target;
    const roundedValue = roundToNearest5Minutes(value);
    setEditedEntry((prev) => ({ ...prev, [name]: roundedValue }));
  };

  const handleOpenDeleteConfirmation = () => {
    setShowActionsMenu(false);
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleOpenCloseConfirmation = () => {
    if (hasUnsavedChanges()) setShowCloseConfirmation(true);
    else onClose();
  };

  const handleConfirmClose = () => {
    onClose();
    setShowCloseConfirmation(false);
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleDuplicate = () => {
    setShowActionsMenu(false);
    onDuplicate(entry);
    onClose();
  };

  const handleConfirmDelete = () => {
    onDelete(entry.id);
    onClose();
    setShowDeleteConfirmation(false);
  };

  const { points, penalty } = calculatePointsAndPenalty(
    editedEntry.workDate,
    editedEntry.startTime,
    entry.createdAt ? new Date(entry.createdAt) : new Date()
  );

  const pointsDisplay =
    points > 0 ? `+${points}` : penalty > 0 ? `-${penalty}` : "0";
  const pointsColor =
    points > 0 ? "#28a745" : penalty > 0 ? "#dc3545" : "var(--text-color)";

  return (
    <>
      <div className="log-entry-details-overlay" onClick={handleOpenCloseConfirmation}>
        <div className="log-entry-details-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="log-entry-details-header">
            <h2>Редактировать запись</h2>

            <div className="journal-header-actions">
              <div className="actions-menu-wrapper" style={{ position: "relative" }}>
                <button
                  className="options-button"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {showActionsMenu && (
                  <div className="options-menu">
                    <button onClick={handleDuplicate} type="button" className="order-action-item">
                      Дублировать
                    </button>
                    <button
                      onClick={handleOpenDeleteConfirmation}
                      type="button"
                      className="order-action-item"
                      style={{ color: "#ff4d4f" }}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>

              <button
                className="journal-modal-close-button"
                onClick={handleOpenCloseConfirmation}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            className="log-entry-details-content custom-scrollbar"
            id="log-entry-form"
            onSubmit={handleSave}
            noValidate
          >
            <div className="form-row">
              <label className="form-label">№ заказа</label>
              <select
                id="orderId"
                name="orderId"
                value={editedEntry.orderId || ""}
                onChange={handleChange}
                required
                className={`form-input ${formErrors.orderNumber ? "input-error" : ""}`}
              >
                <option value="" disabled hidden>Не выбрано</option>
                {activeOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Заказ №{order.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="form-label">Статус заказа</label>
              <input
                type="text"
                name="status"
                value={`${statusToEmojiMap[editedEntry.status] || ""} ${editedEntry.status || ""}`}
                readOnly
                disabled
                className="form-input read-only-input"
              />
            </div>

            <div className="form-row">
              <label className="form-label">Описание заказа</label>
              <input
                type="text"
                name="description"
                value={editedEntry.description || ""}
                readOnly
                disabled
                className="form-input read-only-input"
              />
            </div>

            <div className="form-row">
              <label htmlFor="executorRole" className="form-label">
                Исполнитель
              </label>
              <select
                id="executorRole"
                name="executorRole"
                value={editedEntry.executorRole || ""}
                onChange={handleChange}
                required
                className={`form-input ${formErrors.executorRole ? "input-error" : ""}`}
              >
                <option value="" disabled hidden>Не выбрано</option>
                {employees.map((employee) => (
                  <option
                    key={employee.id || employee.fullName || employee.name}
                    value={employee.fullName || employee.name}
                  >
                    {employee.fullName || employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="role" className="form-label">
                Роль
              </label>
              <select
                id="role"
                name="role"
                value={editedEntry.role || ""}
                onChange={handleChange}
                required
                className={`form-input ${formErrors.role ? "input-error" : ""}`}
              >
                <option value="" disabled hidden>Не выбрано</option>
                {availableRoles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="form-label">Дата работы</label>
              <input
                type="date"
                name="workDate"
                value={editedEntry.workDate || ""}
                onChange={handleChange}
                required
                className={`form-input ${formErrors.workDate ? "input-error" : ""}`}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Время начала</label>
              <input
                type="time"
                name="startTime"
                value={editedEntry.startTime || ""}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                required
                className={`form-input ${formErrors.startTime ? "input-error" : ""}`}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Время окончания</label>
              <input
                type="time"
                name="endTime"
                value={editedEntry.endTime || ""}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                required
                className={`form-input ${formErrors.endTime ? "input-error" : ""}`}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Часы</label>
              <input
                type="text"
                name="hours"
                value={editedEntry.hours || "0:00"}
                readOnly
                className="form-input read-only-input"
              />
            </div>

            <div className="form-row">
              <label className="form-label">Часы (трекинг)</label>
              <input
                type="text"
                name="trackerHours"
                value={editedEntry.trackerHours || "0:00"}
                readOnly
                className="form-input read-only-input"
              />
            </div>

            <div className="form-row">
              <label
                className="form-label"
                style={{ alignSelf: "flex-start", paddingTop: "10px" }}
              >
                Что было сделано?
              </label>
              <textarea
                ref={textareaRef}
                name="workDone"
                value={editedEntry.workDone || ""}
                onChange={handleChange}
                required
                className={`form-input auto-resize-textarea ${formErrors.workDone ? "input-error" : ""}`}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Баллы</label>
              <input
                type="text"
                name="points"
                value={pointsDisplay}
                readOnly
                className="form-input read-only-input"
                style={{ color: pointsColor, fontWeight: "600" }}
              />
            </div>

            <div className="form-row">
              <label htmlFor="adminApproved" className="form-label">
                Одобрено админом
              </label>
              <select
                id="adminApproved"
                name="adminApproved"
                value={editedEntry.adminApproved || "Ожидает"}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Ожидает">Ожидает</option>
                <option value="Принято">Принято</option>
                <option value="Время трекера">Время трекера</option>
                <option value="Время журнала">Время журнала</option>
                <option value="Корректировка администратором">
                  Корректировка администратором
                </option>
              </select>
            </div>

            {editedEntry.adminApproved === "Корректировка администратором" && (
              <div className="form-row">
                <label htmlFor="correctionTime" className="form-label">
                  Время корректировки
                </label>
                <input
                  type="time"
                  id="correctionTime"
                  name="correctionTime"
                  value={editedEntry.correctionTime || ""}
                  onChange={handleChange}
                  onBlur={handleTimeBlur}
                  className={`form-input ${formErrors.correctionTime ? "input-error" : ""}`}
                />
              </div>
            )}

            <div className="form-row">
              <label htmlFor="source" className="form-label">
                Источник отчёта
              </label>
              <input
                type="text"
                id="source"
                name="source"
                value={editedEntry.source || "СРМ"}
                readOnly
                disabled
                className="form-input read-only-input"
              />
            </div>

            {/* полезно видеть итог по orderNumber */}
            {/* <div className="form-row">
              <label className="form-label">Номер (для таблицы)</label>
              <input className="form-input read-only-input" value={editedEntry.orderNumber || ""} readOnly />
            </div> */}
          </form>

          {/* Footer */}
          <div className="log-entry-form-actions">
            <button type="button" className="cancel-entry-btn" onClick={handleOpenCloseConfirmation}>
              Отменить
            </button>
            <button type="submit" form="log-entry-form" className="save-entry-btn">
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {showCloseConfirmation && (
        <ConfirmationModal
          title="Сообщение"
          message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
          confirmText="Да"
          cancelText="Отмена"
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}

      {showDeleteConfirmation && (
        <ConfirmationModal
          title="Подтверждение удаления"
          message={`Вы уверены, что хотите удалить запись "${entry.description}"?`}
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default LogEntryDetail;
