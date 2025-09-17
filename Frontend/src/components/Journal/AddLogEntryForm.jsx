import React, { useState, useEffect } from 'react';
import '../../styles/AddLogEntryForm.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal'; 

const AddLogEntryForm = ({ onAdd, onClose, employees = [], orders = [] }) => {
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
                        <span className="close-icon" onClick={handleClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                    </div>
                    <form onSubmit={handleSubmit} className="form-content">
                        <div className="form-group">
                            <label htmlFor="orderNumber">№ заказа</label>
                            <select
                                id="orderNumber"
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Выберите заказ</option>
                                {orders.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        Заказ №{order.id}
                                    </option>
                                ))}
                            </select>
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
                            <label htmlFor="executorRole">Исполнитель</label>
                            <select
                                id="executorRole"
                                name="executorRole"
                                value={formData.executorRole}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Выберите исполнителя</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.fullName}>
                                        {employee.fullName}
                                    </option>
                                ))}
                            </select>
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