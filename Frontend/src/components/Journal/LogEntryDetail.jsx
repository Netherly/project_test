import React, { useState, useEffect, useRef } from 'react';
import './LogEntryDetails.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

const calculateHours = (start, end) => {
    if (!start || !end) return '0:00';
    try {
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        const startDate = new Date(0, 0, 0, startHour, startMinute);
        const endDate = new Date(0, 0, 0, endHour, endMinute);
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        const diffMs = endDate - startDate;
        const diffHours = Math.floor(diffMs / 3600000);
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHours}:${String(diffMinutes).padStart(2, '0')}`;
    } catch {
        return '0:00';
    }
};

const roundToNearest5Minutes = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const finalHours = roundedMinutes === 60 ? (hours + 1) % 24 : hours;
    return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
};

const LogEntryDetail = ({ entry, onClose, onDelete, onDuplicate, onUpdate, employees, orders, availableRoles = [], statusToEmojiMap = {} }) => {
    const textareaRef = useRef(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    
    // Проверка данных при загрузке компонента
    useEffect(() => {
        console.log('LogEntryDetail - employees:', employees);
        console.log('LogEntryDetail - orders:', orders);
        console.log('LogEntryDetail - availableRoles:', availableRoles);
    }, [employees, orders, availableRoles]);
    
    const [editedEntry, setEditedEntry] = useState(() => {
        return {
            ...entry,
            role: typeof entry.role === 'string' ? entry.role : (Array.isArray(entry.role) && entry.role.length > 0 ? entry.role[0] : ''),
            status: entry.status || '',
            correctionTime: entry.correctionTime || ''
        };
    });
    const [initialEntry, setInitialEntry] = useState(editedEntry);

    const getActiveOrders = () => {
    const activeStatuses = [
        "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
        "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
        "На уточнении у клиента", "Тестируем", "Тестирует клиент",
        "На доработке", "Ожидаем оплату"
    ];

    const normalizedOrders = orders.map(order => ({
        orderNumber: order.orderNumber || order.id || "",
        description: order.description || order.orderDescription || order.name || "",
        status: order.status || order.stage || "",
    }));

    return normalizedOrders.filter(order =>
        activeStatuses.includes(order.status) ||
        String(order.orderNumber) === String(entry.orderNumber)
    );
};



    const activeOrders = getActiveOrders();

    useEffect(() => {
        const currentOrder = orders.find(order => String(order.orderNumber) === String(editedEntry.orderNumber));
        if (currentOrder) {
            setEditedEntry(prevData => ({
                ...prevData,
                description: currentOrder.description || currentOrder.name || '',
                status: currentOrder.status || ''
            }));
        }
    }, [editedEntry.orderNumber, orders]);

    useEffect(() => {
        setEditedEntry(prevData => ({
            ...prevData,
            hours: calculateHours(prevData.startTime, prevData.endTime)
        }));
    }, [editedEntry.startTime, editedEntry.endTime]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editedEntry.workDone]);

    if (!entry) {
        return null;
    }

    const roleDisplayValue = (() => {
        const count = editedEntry.role.length;
        if (count === 1) {
            return editedEntry.role[0];
        } else if (count > 1) {
            return `Выбрано ролей: ${count}`;
        }
        return 'Выберите роль(и)';
    })();

    const hasUnsavedChanges = () => {
        for (const key in initialEntry) {
            if (JSON.stringify(editedEntry[key]) !== JSON.stringify(initialEntry[key])) {
                return true;
            }
        }
        return false;
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!editedEntry.orderNumber?.trim()) {
            errors.orderNumber = true;
            isValid = false;
        }

        if (!editedEntry.executorRole?.trim()) {
            errors.executorRole = true;
            isValid = false;
        }

        if (!editedEntry.role || !editedEntry.role.trim()) {
            errors.role = true;
            isValid = false;
        }

        if (!editedEntry.workDate?.trim()) {
            errors.workDate = true;
            isValid = false;
        }

        if (!editedEntry.workDone?.trim()) {
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
        setEditedEntry(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleTimeBlur = (e) => {
        const { name, value } = e.target;
        const roundedValue = roundToNearest5Minutes(value);
        setEditedEntry(prevData => ({
            ...prevData,
            [name]: roundedValue
        }));
    };
    
    const handleOpenDeleteConfirmation = () => {
        setShowActionsMenu(false);
        setShowDeleteConfirmation(true);
    };
    
    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleOpenCloseConfirmation = () => {
        if (hasUnsavedChanges()) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
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

    const calculatePointsAndPenalty = (workDate, startTime, createdAt = new Date()) => {
        if (!workDate || !startTime) {
            return { points: 0, penalty: 0, coefficient: 1 };
        }

        try {
            const [year, month, day] = workDate.split('-').map(Number);
            const [hours, minutes] = startTime.split(':').map(Number);
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
        } catch (error) {
            console.error('Ошибка при расчете баллов:', error);
            return { points: 0, penalty: 0, coefficient: 1 };
        }
    };

    const { points, penalty, coefficient } = calculatePointsAndPenalty(
        editedEntry.workDate,
        editedEntry.startTime,
        entry.createdAt ? new Date(entry.createdAt) : new Date()
    );

    const pointsDisplay = points > 0 ? `+${points}` : penalty > 0 ? `-${penalty}` : '0';
    const pointsColor = points > 0 ? '#28a745' : penalty > 0 ? '#dc3545' : 'var(--text-color)';


    return (
        <>
            <div className="log-entry-details-overlay" onClick={handleOpenCloseConfirmation}>
                <div className="log-entry-details-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="log-entry-details-header">
                        <h2>Редактировать запись</h2>
                        <div className="journal-header-actions">
                            <div className="actions-menu-wrapper">
                                <button 
                                    className="journal-actions-btn" 
                                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                                    type="button"
                                >
                                ⋮
                                </button>
                                {showActionsMenu && (
                                    <div className="order-actions-dropdown">
                                        <button onClick={handleDuplicate} type="button" className="order-action-item">
                                            Дублировать
                                        </button>
                                        <button onClick={handleOpenDeleteConfirmation} type="button" className="order-action-item">
                                            Удалить
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="journal-close-btn-container">
                                <button className="journal-modal-close-button" onClick={handleOpenCloseConfirmation} type="button">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <form className="log-entry-details-content" onSubmit={handleSave} noValidate>
                        <div className="journal-form-group">
                            <label>№ заказа</label>
                            <select
                                id="orderNumber"
                                name="orderNumber"
                                value={editedEntry.orderNumber}
                                onChange={handleChange}
                                required
                                className={formErrors.orderNumber ? "input-error" : ""}
                            >
                                <option value="">Выберите заказ</option>
                                {activeOrders.map((order) => (
                                    <option key={order.orderNumber} value={order.orderNumber}>
                                        {order.orderNumber} - { order.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="journal-form-group">
                            <label>Статус заказа</label>
                            <input
                                type="text"
                                id="status"
                                name="status"
                                value={`${statusToEmojiMap[editedEntry.status] || ""} ${editedEntry.status || ""}`}
                                readOnly
                                disabled
                                className="disabled-input"
                            />
                        </div>
                        <div className="journal-form-group">
                            <label>Описание заказа</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={editedEntry.description}
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
                                value={editedEntry.executorRole}
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
                                value={editedEntry.role}
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
                            <label>Дата работы</label>
                            <input
                                type="date"
                                name="workDate"
                                value={editedEntry.workDate || ''}
                                onChange={handleChange}
                                required
                                className={formErrors.workDate ? "input-error" : ""}
                            />
                        </div>

                        <div className="journal-form-group">
                            <label>Время начала</label>
                            <input
                                type="time"
                                name="startTime"
                                value={editedEntry.startTime || ''}
                                onChange={handleChange}
                                onBlur={handleTimeBlur}
                                required
                                className={formErrors.startTime ? "input-error" : ""}
                            />
                        </div>

                        <div className="journal-form-group">
                            <label>Время окончания</label>
                            <input
                                type="time"
                                name="endTime"
                                value={editedEntry.endTime || ''}
                                onChange={handleChange}
                                onBlur={handleTimeBlur}
                                required
                                className={formErrors.endTime ? "input-error" : ""}
                            />
                        </div>

                        <div className="journal-form-group">
                            <label>Часы</label>
                            <input
                                type="text"
                                name="hours"
                                value={editedEntry.hours || '0:00'}
                                readOnly
                                className="read-only-input"
                            />
                        </div>

                        <div className="journal-form-group">
                            <label>Часы (трекинг)</label>
                            <input
                                type="text"
                                name="trackingHours"
                                value={editedEntry.trackingHours || '0:00'}
                                readOnly
                                className="read-only-input"
                            />
                        </div>

                        <div className="journal-form-group">
                            <label>Что было сделано?</label>
                            <textarea
                                ref={textareaRef}
                                name="workDone"
                                value={editedEntry.workDone || ''}
                                onChange={handleChange}
                                required
                                className={`auto-resize-textarea ${formErrors.workDone ? "input-error" : ""}`}
                            ></textarea>
                        </div>
                        <div className="journal-form-group">
                            <label>Баллы</label>
                            <input
                                type="text"
                                name="points"
                                value={pointsDisplay}
                                readOnly
                                className="read-only-input"
                                style={{ 
                                    color: pointsColor,
                                    fontWeight: '600'
                                }}
                            />
                        </div>

                        <div className="journal-form-group">
                            <label htmlFor="adminApproved">Одобрено администратором</label>
                            <select
                                id="adminApproved"
                                name="adminApproved"
                                value={editedEntry.adminApproved || 'Ожидает'}
                                onChange={handleChange}
                            >
                                <option value="Ожидает">Ожидает</option>
                                <option value="Принято">Принято</option>
                                <option value="Время трекера">Время трекера</option>
                                <option value="Время журнала">Время журнала</option>
                                <option value="Корректировка администратором">Корректировка администратором</option>
                            </select>
                        </div>
                        {editedEntry.adminApproved === "Корректировка администратором" && (
                            <div className="journal-form-group">
                                <label htmlFor="correctionTime">Время корректировки</label>
                                <input
                                    type="time"
                                    id="correctionTime"
                                    name="correctionTime"
                                    value={editedEntry.correctionTime || ''}
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
                                value={editedEntry.source || 'СРМ'}
                                readOnly
                                disabled
                                className="disabled-input"
                            />
                        </div>

                        <div className="form-actions-bottom1">
                            <button type="button" className="cancel-button" onClick={handleOpenCloseConfirmation}>
                                Отменить
                            </button>
                            <button type="submit" className="save-button">
                                Сохранить
                            </button>
                        </div>
                    </form>
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