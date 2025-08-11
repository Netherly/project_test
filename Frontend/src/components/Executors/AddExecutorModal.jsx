import React, { useState } from 'react';
import '../../styles/AddExecutorModal.css';

const generateId = () => {
    return 'executor_' + Math.random().toString(36).substring(2, 9);
};

const AddExecutorModal = ({ onAdd, onClose, fields }) => {
    const [formData, setFormData] = useState({
        orderNumber: '',
        performer: '',
        role: fields?.roles?.[0] || '',
        dateForPerformer: '',
        hideClient: false,
        roundHours: false,
        currency: fields?.currency?.[0] || '',
        hourlyRate: '',
        amountInput: '',
        maxAmount: '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newExecutor = {
            id: generateId(),
            orderNumber: formData.orderNumber,
            orderStatus: "В работе", 
            orderStatusEmoji: "⏳", 
            orderDate: new Date().toISOString().split('T')[0], 
            description: "", 
            client: "",
            clientHidden: formData.hideClient,
            performer: formData.performer,
            performerRole: formData.role,
            orderCurrency: formData.currency,
            orderSum: parseFloat(formData.amountInput) || 0,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            paymentBalance: parseFloat(formData.maxAmount) || 0,
            workTime: 0, 
            paymentSum: 0,
            paymentRemaining: 0,
            accountingCurrency: "UAH", 
        };

        onAdd(newExecutor);
        onClose();
    };

    return (
        <div className="add-executor-overlay">
            <div className="add-executor-modal">
                <div className="add-executor-header">
                    <h2>Добавить исполнителя</h2>
                    <div className="add-executor-actions">
                        <span className="icon" onClick={onClose}>✖️</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-executor-form">
                    <div className="tab-content">
                        <div className="form-row">
                            <label htmlFor="orderNumber" className="form-label">Номер заказа</label>
                            <input
                                type="text"
                                id="orderNumber"
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="performer" className="form-label">Исполнитель</label>
                            <select
                                id="performer"
                                name="performer"
                                value={formData.performer}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="" disabled>Выберите сотрудника</option>
                                {fields?.employees?.map((emp, index) => (
                                    <option key={index} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="role" className="form-label">Роль в заказе</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="" disabled>Выберите роль</option>
                                {fields?.role?.map((role, index) => (
                                    <option key={index} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="dateForPerformer" className="form-label">Дата для исполнителя</label>
                            <input
                                type="date"
                                id="dateForPerformer"
                                name="dateForPerformer"
                                value={formData.dateForPerformer}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-row checkbox-row">
                            <label htmlFor="hideClient" className="form-label">Скрыть клиента</label>
                            <input
                                type="checkbox"
                                id="hideClient"
                                name="hideClient"
                                checked={formData.hideClient}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                        </div>
                        <div className="form-row checkbox-row">
                            <label htmlFor="roundHours" className="form-label">Округление часа</label>
                            <input
                                type="checkbox"
                                id="roundHours"
                                name="roundHours"
                                checked={formData.roundHours}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="currency" className="form-label">Валюта</label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="" disabled>Выберите валюту</option>
                                {fields?.currency?.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="hourlyRate" className="form-label">Ставка в час</label>
                            <input
                                type="number"
                                id="hourlyRate"
                                name="hourlyRate"
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="amountInput" className="form-label">Сумма ввод</label>
                            <input
                                type="number"
                                id="amountInput"
                                name="amountInput"
                                value={formData.amountInput}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="maxAmount" className="form-label">Сумма макс</label>
                            <input
                                type="number"
                                id="maxAmount"
                                name="maxAmount"
                                value={formData.maxAmount}
                                onChange={handleChange}
                                className="form-input"
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

export default AddExecutorModal;