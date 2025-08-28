import React, { useState, useEffect } from 'react';
import '../../styles/AddLogEntryForm.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal'; 

const AddLogEntryForm = ({ onAdd, onClose }) => {
    const [initialFormData] = useState({
        description: '',
        orderNumber: '',
        executorRole: '',
        workDate: '',
        startTime: '',
        endTime: '',
        hours: '0:00:00',
        workDone: '',
        email: '',
    });

    const [formData, setFormData] = useState(initialFormData);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    
    const hasUnsavedChanges = () => {
        
        for (const key in formData) {
            if (formData[key] !== initialFormData[key]) {
                return true;
            }
        }
        return false;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        onClose(); 
    };

    const calculateHours = (start, end) => {
        
        if (!start || !end || start === '-' || end === '-') return '0:00';
    
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
            const finalMinutes = String(diffMinutes).padStart(2, '0');
    
            return `${diffHours}:${finalMinutes}`;
        } catch (error) {
            console.error("Ошибка при расчете часов:", error);
            return '0:00';
        }
    };
    
    useEffect(() => {
        setFormData(prevData => ({
            ...prevData,
            hours: calculateHours(prevData.startTime, prevData.endTime)
        }));
    }, [formData.startTime, formData.endTime]);

    
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
            
            <div className="form-overlay" onClick={handleClose}>
                <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="form-header">
                        <h2>Новая запись</h2>
                        <span className="close-icon" onClick={handleClose}>✖️</span>
                    </div>
                    <form onSubmit={handleSubmit} className="form-content">
                        <div className="form-group">
                            <label htmlFor="orderNumber">№ заказа</label>
                            <input
                                type="text"
                                id="orderNumber"
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleChange}
                                placeholder="Например, 2416"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Описание заказа</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="'Название проекта'. Описание задачи"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="executorRole">Исполнитель роль</label>
                            <input
                                type="text"
                                id="executorRole"
                                name="executorRole"
                                value={formData.executorRole}
                                onChange={handleChange}
                                placeholder="Frontend Developer"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="workDate">Дата работы</label>
                            <input
                                type="date"
                                id="workDate"
                                name="workDate"
                                value={formData.workDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hours">Часы</label>
                            <div id="hours" className="hours-display">
                                {formData.hours}
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="startTime">Время начала</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endTime">Время окончания</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="workDone">Что было сделано?</label>
                            <textarea
                                id="workDone"
                                name="workDone"
                                value={formData.workDone}
                                onChange={handleChange}
                                placeholder="Подробное описание выполненной работы"
                                required
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email исполнителя</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@example.com"
                                required
                            />
                        </div>
                        <div className="form-actions-bottom1">
                            
                            <button type="button" className="cancel-button" onClick={handleClose}>
                                Отменить
                            </button>
                            <button type="submit" className="save-button">
                                Добавить
                            </button>
                        </div>
                    </form>
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