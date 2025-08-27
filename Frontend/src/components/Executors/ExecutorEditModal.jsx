import React, { useState } from 'react';
// Мы можем переиспользовать стили, если они похожи, или создать новые
import '../../styles/AddExecutorModal.css'; 

const ExecutorEditModal = ({ order, onUpdate, onClose, onDelete, onDuplicate, fields }) => {
    // Инициализируем состояние формы данными из 'order'
    const [formData, setFormData] = useState({
        ...order,
        // Убедимся, что числовые значения не null/undefined, а строки
        orderSum: order.orderSum || '',
        hourlyRate: order.hourlyRate || '',
        workTime: order.workTime || '',
    });
    
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Перед отправкой преобразуем числовые поля из строк в числа
        const updatedOrder = {
            ...formData,
            orderSum: parseFloat(formData.orderSum) || 0,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            workTime: parseFloat(formData.workTime) || 0,
        };
        onUpdate(updatedOrder);
    };
    
    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };

    const handleDeleteClick = () => {
        if (window.confirm(`Вы уверены, что хотите удалить заказ №${order.orderNumber} для "${order.performer}"?`)) {
            onDelete(order.id);
            onClose();
        }
        setShowOptionsMenu(false);
    };

    const handleDuplicateClick = () => {
        onDuplicate(order);
        onClose();
        setShowOptionsMenu(false);
    };

    return (
        <div className="add-executor-overlay" onClick={onClose}>
            <div className="add-executor-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-executor-header">
                    <h2>Редактировать заказ</h2>
                    <div className="add-transaction-actions">
                         <button className="options-button" onClick={handleMenuToggle}>⋮</button>
                         {showOptionsMenu && (
                             <div className="options-menu">
                                 <button className="menu-item" onClick={handleDuplicateClick}>Дублировать</button>
                                 <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить</button>
                             </div>
                         )}
                        <span className="icon" onClick={onClose}>✖️</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-executor-form">
                    <div className="form-row">
                        <label className="form-label">Номер заказа</label>
                        <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleChange} className="form-input" required />
                    </div>
                    
                    <div className="form-row">
                        <label className="form-label">Исполнитель</label>
                        <select name="performer" value={formData.performer} onChange={handleChange} className="form-input" required>
                            {fields?.employees?.map((emp, index) => (
                                <option key={index} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label className="form-label">Описание</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="form-input" />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Роль в заказе</label>
                        <select name="performerRole" value={formData.performerRole} onChange={handleChange} className="form-input" required>
                            {fields?.role?.map((role, index) => (
                                <option key={index} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label className="form-label">Дата заказа</label>
                        <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="form-input" required />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Валюта</label>
                        <select name="orderCurrency" value={formData.orderCurrency} onChange={handleChange} className="form-input" required>
                            {fields?.currency?.map((item, index) => (
                                <option key={index} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label className="form-label">Сумма</label>
                        <input type="number" step="0.01" name="orderSum" value={formData.orderSum} onChange={handleChange} className="form-input" />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Ставка в час</label>
                        <input type="number" step="0.01" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="form-input" />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Время работы (часы)</label>
                        <input type="number" step="0.1" name="workTime" value={formData.workTime} onChange={handleChange} className="form-input" />
                    </div>

                    <div className="form-row checkbox-row">
                        <label className="form-label">Скрыть клиента</label>
                        <input type="checkbox" name="clientHidden" checked={formData.clientHidden} onChange={handleChange} className="form-checkbox" />
                    </div>
                    
                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>Отменить</button>
                        <button type="submit" className="save-button">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExecutorEditModal;