import React, { useState, useEffect } from 'react';
import '../../styles/LogEntryDetails.css';

// Вспомогательная функция для расчета часов
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

const LogEntryDetail = ({ entry, onClose, onDelete, onDuplicate, onUpdate }) => {
    // Состояние теперь хранит только редактируемые данные
    const [editedEntry, setEditedEntry] = useState(entry || {});

    // Эффект для автоматического пересчета часов при изменении времени
    useEffect(() => {
        setEditedEntry(prevData => ({
            ...prevData,
            hours: calculateHours(prevData.startTime, prevData.endTime)
        }));
    }, [editedEntry.startTime, editedEntry.endTime]);

    if (!entry) {
        return null;
    }

    // Обработчик сохранения изменений
    const handleSave = (e) => {
        e.preventDefault();
        onUpdate(editedEntry);
        onClose();
    };

    // Обработчик изменений в полях ввода
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedEntry(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Обработчики для кнопок действий
    const handleDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить запись "${entry.description}"?`)) {
            onDelete(entry.id);
            onClose();
        }
    };

    const handleDuplicate = () => {
        onDuplicate(entry);
        onClose();
    };

    return (
        <div className="log-entry-details-overlay">
            <div className="log-entry-details-modal">
                <div className="log-entry-details-header">
                    <h2>Редактировать запись</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <form className="log-entry-details-content" onSubmit={handleSave}>
                    {/* Всегда отображаем поля для ввода */}
                    <div className="form-group">
                        <label>№ заказа</label>
                        <input
                            type="text"
                            name="orderNumber"
                            value={editedEntry.orderNumber || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Описание заказа</label>
                        <input
                            type="text"
                            name="description"
                            value={editedEntry.description || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Исполнитель роль</label>
                        <input
                            type="text"
                            name="executorRole"
                            value={editedEntry.executorRole || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Дата работы</label>
                        <input
                            type="date"
                            name="workDate"
                            value={editedEntry.workDate || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Часы</label>
                        <input
                            type="text"
                            name="hours"
                            value={editedEntry.hours || '0:00'}
                            readOnly
                            className="read-only-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Время начала</label>
                        <input
                            type="time"
                            name="startTime"
                            value={editedEntry.startTime || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Время окончания</label>
                        <input
                            type="time"
                            name="endTime"
                            value={editedEntry.endTime || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Что было сделано?</label>
                        <textarea
                            name="workDone"
                            value={editedEntry.workDone || ''}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Email исполнителя</label>
                        <input
                            type="email"
                            name="email"
                            value={editedEntry.email || ''}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Всегда отображаем кнопки действий */}
                    <div className="form-actions-bottom">
                        <button type="button" className="action-button delete-button" onClick={handleDelete}>Удалить</button>
                        <button type="button" className="action-button duplicate-button" onClick={handleDuplicate}>Дублировать</button>
                        <button type="submit" className="action-button save-button">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogEntryDetail;