import React, { useState, useEffect } from 'react';
import '../../styles/LogEntryDetails.css';


const calculateHours = (start, end) => {
    if (!start || !end) return '0:00:00';

    try {
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);

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
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return `${diffHours}:${String(diffMinutes).padStart(2, '0')}:${String(diffSeconds).padStart(2, '0')}`;
    } catch (error) {
        console.error("Ошибка при расчете часов:", error);
        return '0:00:00';
    }
};


const LogEntryDetail = ({ entry, onClose, onDelete, onDuplicate, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEntry, setEditedEntry] = useState({});

    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    
    useEffect(() => {
        if (entry) {
            setEditedEntry(entry);
        }
    }, [entry]);

    if (!entry) {
        return null;
    }

    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setShowOptionsMenu(false);
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        onUpdate(editedEntry); 
        setIsEditing(false);
        onClose();
    };

    const handleCancelClick = () => {
        setEditedEntry(entry);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedEntry(prevData => ({
            ...prevData,
            [name]: value
        }));
    };
    
    
    useEffect(() => {
        if(isEditing) {
            setEditedEntry(prevData => ({
                ...prevData,
                hours: calculateHours(prevData.startTime, prevData.endTime)
            }));
        }
    }, [editedEntry.startTime, editedEntry.endTime, isEditing]);


    const handleDeleteClick = () => {
        if (window.confirm(`Вы уверены, что хотите удалить запись "${entry.description}"?`)) {
            onDelete(entry.id);
            onClose(); 
        }
        setShowOptionsMenu(false); 
    };

    const handleDuplicateClick = () => {
        onDuplicate(entry);
        onClose(); 
        setShowOptionsMenu(false); 
    };

    return (
        <div className="log-entry-details-overlay">
            <div className="log-entry-details-modal">
                <div className="log-entry-details-header">
                    <h2>{isEditing ? 'Редактировать запись' : 'Информация о записи'}</h2>
                    <div className="log-entry-details-actions">
                        <button className="options-button" onClick={handleMenuToggle}>
                            &#x22EF;
                        </button>
                        {showOptionsMenu && (
                            <div className="options-menu">
                                <button className="menu-item" onClick={handleEditClick}>Редактировать</button>
                                <button className="menu-item" onClick={handleDuplicateClick}>Дублировать запись</button>
                                <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить запись</button>
                            </div>
                        )}
                        <button className="modal-close-button" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <form className="log-entry-details-content" onSubmit={handleSaveClick}>
                    <div className="form-group">
                        <label>№ заказа</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="orderNumber"
                                value={editedEntry.orderNumber || ''}
                                onChange={handleChange}
                            />
                        ) : (
                            <span>{entry.orderNumber}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Описание заказа</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="description"
                                value={editedEntry.description || ''}
                                onChange={handleChange}
                            />
                        ) : (
                            <span>{entry.description}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Исполнитель роль</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="executorRole"
                                value={editedEntry.executorRole || ''}
                                onChange={handleChange}
                            />
                        ) : (
                            <span>{entry.executorRole}</span>
                        )}
                    </div>
                    <div className="form-row date-time-group">
                        <div className="form-group half-width">
                            <label>Дата работы</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    name="workDate"
                                    value={editedEntry.workDate || ''}
                                    onChange={handleChange}
                                />
                            ) : (
                                <span>{entry.workDate}</span>
                            )}
                        </div>
                        <div className="form-group half-width">
                            <label>Часы</label>
                            <input
                                type="text"
                                name="hours"
                                value={editedEntry.hours || ''}
                                readOnly
                                className="read-only"
                            />
                        </div>
                    </div>
                    <div className="form-row time-inputs">
                        <div className="form-group quarter-width">
                            <label>Время начала</label>
                            {isEditing ? (
                                <input
                                    type="time"
                                    name="startTime"
                                    value={editedEntry.startTime || ''}
                                    onChange={handleChange}
                                />
                            ) : (
                                <span>{entry.startTime}</span>
                            )}
                        </div>
                        <div className="form-group quarter-width">
                            <label>Время окончания</label>
                            {isEditing ? (
                                <input
                                    type="time"
                                    name="endTime"
                                    value={editedEntry.endTime || ''}
                                    onChange={handleChange}
                                />
                            ) : (
                                <span>{entry.endTime}</span>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Что было сделано?</label>
                        {isEditing ? (
                            <textarea
                                name="workDone"
                                value={editedEntry.workDone || ''}
                                onChange={handleChange}
                            ></textarea>
                        ) : (
                            <p>{entry.workDone}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Email исполнителя</label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={editedEntry.email || ''}
                                onChange={handleChange}
                            />
                        ) : (
                            <span>{entry.email}</span>
                        )}
                    </div>

                    {isEditing && (
                        <div className="form-actions-bottom">
                            <button type="button" className="cancel-button" onClick={handleCancelClick}>Отменить</button>
                            <button type="submit" className="save-button">Сохранить</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LogEntryDetail;