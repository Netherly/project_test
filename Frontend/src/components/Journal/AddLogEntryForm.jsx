import React, { useState, useEffect } from 'react';
import './AddLogEntryForm.css';

const AddLogEntryForm = ({ onAdd, onClose }) => {
    const [formData, setFormData] = useState({
        description: '',
        orderNumber: '',
        executorRole: '',
        workDate: '',
        startTime: '',
        endTime: '',
        hours: '',
        workDone: '',
        email: '',
    });

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
    };

    
    const calculateHours = (start, end) => {
        if (!start || !end || start === '-' || end === '-') return '0:00:00';

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

   
    useEffect(() => {
        setFormData(prevData => ({
            ...prevData,
            hours: calculateHours(prevData.startTime, prevData.endTime)
        }));
    }, [formData.startTime, formData.endTime]);


    return (
        <div className="add-log-entry-overlay">
            <div className="add-log-entry-modal">
                <div className="add-log-entry-header">
                    <h2>Новая запись</h2>
                    <div className="add-log-entry-actions">
                        <span className="icon" onClick={onClose}>✖️</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="add-log-entry-form">
                    <div className="form-row">
                        <div className="form-group large">
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
                    </div>
                    <div className="form-row">
                        <div className="form-group small">
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
                        <div className="form-group large">
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
                    </div>
                    <div className="form-row">
                        <div className="form-group small">
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
                        <div className="form-group small">
                            <label htmlFor="startTime">Время начала</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group small">
                            <label htmlFor="endTime">Время окончания</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group small">
                            <label htmlFor="hours">Часы</label>
                            <input
                                type="text"
                                id="hours"
                                name="hours"
                                value={formData.hours}
                                readOnly 
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group full-width">
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
                    </div>
                    <div className="form-row">
                        <div className="form-group large">
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
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>Отменить</button>
                        <button type="submit" className="save-button">Добавить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLogEntryForm;