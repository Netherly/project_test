import React, { useEffect, useRef, useState, useMemo } from "react";
import "./AddLogEntryForm.css";
import ConfirmationModal from "../modals/confirm/ConfirmationModal";

const AddLogEntryForm = ({
  onAdd,
  onClose,
  employees = [],
  orders = [],
  currentUser = null,
  availableRoles = [],
  statusToEmojiMap = {},
}) => {
  const textareaRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ✅ объединяем обе версии:
  // - фильтруем активные заказы как во 2-й версии
  // - но в итоге работаем с реальными order.id + красивым label (orderSequence/numberOrder)
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

    const normalized = (orders || []).map((order) => {
      const id = order?.id ?? "";
      const label = order?.orderSequence ?? order?.numberOrder ?? id;

      return {
        id,
        label,
        orderNumber: order?.orderNumber ?? label ?? id, // на всякий
        description: order?.description || order?.orderDescription || order?.name || "",
        status: order?.status || order?.stage || "",
      };
    });

    return normalized.filter((o) => activeStatuses.includes(o.status));
  }, [orders]);

  const [initialFormData] = useState({
    description: "",
    orderNumber: "", // тут хранится id заказа (стабильнее всего)
    executorRole: currentUser?.fullName || "",
    role: "",
    workDate: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    hours: "00:00",
    workDone: "",
    adminApproved: "Ожидает",
    correctionTime: "",
    source: "СРМ",
    status: "",
  });

  const [formData, setFormData] = useState(initialFormData);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.workDone]);

  const hasUnsavedChanges = () => {
    for (const key in formData) {
      if (JSON.stringify(formData[key]) !== JSON.stringify(initialFormData[key])) {
        return true;
      }
    }
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };

    if (name === "orderNumber") {
      // value = order.id
      const selectedOrder = activeOrders.find((o) => String(o.id) === String(value));
      newFormData.orderNumber = value;
      newFormData.description = selectedOrder ? selectedOrder.description || "" : "";
      newFormData.status = selectedOrder ? selectedOrder.status || "" : "";
    } else {
      newFormData = { ...newFormData, [name]: value };
    }

    setFormData(newFormData);
    setIsDirty(true);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.orderNumber.trim()) {
      errors.orderNumber = true;
      isValid = false;
    }
    if (!formData.executorRole.trim()) {
      errors.executorRole = true;
      isValid = false;
    }
    if (!formData.role || !formData.role.trim()) {
      errors.role = true;
      isValid = false;
    }
    if (!formData.workDate.trim()) {
      errors.workDate = true;
      isValid = false;
    }
    if (!formData.workDone.trim()) {
      errors.workDone = true;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onAdd(formData);
  };

  const roundToNearest5Minutes = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const finalHours = roundedMinutes === 60 ? (hours + 1) % 24 : hours;
    return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(
      2,
      "0"
    )}`;
  };

  const calculateHours = (start, end) => {
    if (!start || !end || start === "-" || end === "-") return "0:00";
    try {
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);

      const startDate = new Date();
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);

      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const diffMs = endDate - startDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}:${String(diffMinutes).padStart(2, "0")}`;
    } catch {
      return "00:00";
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      hours: calculateHours(prev.startTime, prev.endTime),
    }));
  }, [formData.startTime, formData.endTime]);

  const handleTimeBlur = (e) => {
    const { name, value } = e.target;
    const roundedValue = roundToNearest5Minutes(value);
    setFormData((prev) => ({
      ...prev,
      [name]: roundedValue,
    }));
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmationModal(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmationModal(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmationModal(false);
  };

  return (
    <>
      <div className="journal-form-overlay" onClick={handleClose}>
        <div className="journal-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="journal-form-header">
            <h2>Новая запись</h2>
            <span className="close-icon" onClick={handleClose}>
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
            </span>
          </div>

          <form
            id="add-entry-form"
            onSubmit={handleSubmit}
            className="journal-form-content custom-scrollbar"
            noValidate
          >
            <div className="journal-form-group">
              <label htmlFor="orderNumber">№ заказа</label>
              <select
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                required
                className={formErrors.orderNumber ? "input-error" : ""}
              >
                <option value="">Выберите заказ</option>

                {activeOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Заказ №{order.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="journal-form-group">
              <label>Статус заказа</label>
              <input
                type="text"
                name="status"
                value={`${statusToEmojiMap[formData.status] || ""} ${formData.status || ""}`}
                readOnly
                disabled
                className="disabled-input"
              />
            </div>

            <div className="journal-form-group">
              <label htmlFor="description">Описание заказа</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                readOnly
                disabled
                className="disabled-input"
              />
            </div>

            <div className="journal-form-group">
              <label htmlFor="executorRole">Исполнитель</label>
              <select
                id="executorRole"
                name="executorRole"
                value={formData.executorRole}
                onChange={handleChange}
                required
                className={formErrors.executorRole ? "input-error" : ""}
              >
                <option value="">Выберите исполнителя</option>
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

            <div className="journal-form-group">
              <label htmlFor="role">Роль</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={formErrors.role ? "input-error" : ""}
              >
                <option value="">Выберите роль</option>
                {availableRoles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="journal-form-group">
              <label htmlFor="workDate">Дата работы</label>
              <input
                type="date"
                id="workDate"
                name="workDate"
                value={formData.workDate}
                onChange={handleChange}
                required
                className={formErrors.workDate ? "input-error" : ""}
              />
            </div>

            <div className="journal-form-group">
              <label htmlFor="startTime">Время начала</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                required
                className={formErrors.startTime ? "input-error" : ""}
              />
            </div>

            <div className="journal-form-group">
              <label htmlFor="endTime">Время окончания</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                required
                className={formErrors.endTime ? "input-error" : ""}
              />
            </div>

            <div className="journal-form-group">
              <label htmlFor="hours">Часы</label>
              <input id="hours" value={formData.hours} disabled className="disabled-input" />
            </div>

            <div className="journal-form-group align-top">
              <label htmlFor="workDone">Что было сделано?</label>
              <textarea
                ref={textareaRef}
                id="workDone"
                name="workDone"
                value={formData.workDone}
                onChange={handleChange}
                placeholder="Подробно опишите выполненную работу"
                required
                className={`auto-resize-textarea ${formErrors.workDone ? "input-error" : ""}`}
              ></textarea>
            </div>

            <div className="journal-form-group">
              <label htmlFor="adminApproved">Одобрено администратором</label>
              <select
                id="adminApproved"
                name="adminApproved"
                value={formData.adminApproved}
                onChange={handleChange}
              >
                <option value="Ожидает">Ожидает</option>
                <option value="Принято">Принято</option>
                <option value="Время трекера">Время трекера</option>
                <option value="Время журнала">Время журнала</option>
                <option value="Корректировка администратором">Корректировка администратором</option>
              </select>
            </div>

            {formData.adminApproved === "Корректировка администратором" && (
              <div className="journal-form-group">
                <label htmlFor="correctionTime">Время корректировки</label>
                <input
                  type="time"
                  id="correctionTime"
                  name="correctionTime"
                  value={formData.correctionTime}
                  onChange={handleChange}
                  onBlur={handleTimeBlur}
                  className={formErrors.correctionTime ? "input-error" : ""}
                />
              </div>
            )}

            <div className="journal-form-group">
              <label htmlFor="source">Источник отчёта</label>
              <input
                type="text"
                id="source"
                name="source"
                value={formData.source}
                readOnly
                disabled
                className="disabled-input"
              />
            </div>
          </form>

          <div className="form-actions-bottom1">
            <button type="button" className="cancel-button" onClick={handleClose}>
              Отменить
            </button>
            <button type="submit" form="add-entry-form" className="save-button">
              Добавить
            </button>
          </div>
        </div>
      </div>

      {showConfirmationModal && (
        <ConfirmationModal
          title="Сообщение"
          message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
          confirmText="Да"
          cancelText="Отмена"
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}
    </>
  );
};

export default AddLogEntryForm;
