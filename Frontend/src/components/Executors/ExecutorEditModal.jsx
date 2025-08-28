import React, { useState } from 'react';
import '../../styles/AddExecutorModal.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

const ExecutorEditModal = ({ order, onUpdate, onClose, onDelete, onDuplicate, fields }) => {
    const [formData, setFormData] = useState({
        ...order,
        orderSum: order.orderSum || '',
        hourlyRate: order.hourlyRate || '',
        workTime: order.workTime || '',
    });
    
    
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
        setHasUnsavedChanges(true); 
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedOrder = {
            ...formData,
            orderSum: parseFloat(formData.orderSum) || 0,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            workTime: parseFloat(formData.workTime) || 0,
        };
        onUpdate(updatedOrder);
        setHasUnsavedChanges(false); 
    };
    
    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };
    
    
    const handleOpenDeleteConfirmation = () => {
        setShowDeleteConfirmation(true);
        setShowOptionsMenu(false);
    };

    const handleConfirmDelete = () => {
        onDelete(order.id);
        onClose();
        setShowDeleteConfirmation(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleDuplicateClick = () => {
        onDuplicate(order);
        onClose();
        setShowOptionsMenu(false);
    };
    
    
    const handleOpenCloseConfirmation = () => {
        if (hasUnsavedChanges) {
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

    return (
        <>
            <div className="add-executor-overlay" onClick={handleOpenCloseConfirmation}>
                <div className="add-executor-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-executor-header">
                        <h2>Редактировать заказ</h2>
                        <div className="add-transaction-actions">
                             <button className="options-button" onClick={handleMenuToggle}>⋮</button>
                             {showOptionsMenu && (
                                 <div className="options-menu">
                                     <button className="menu-item" onClick={handleDuplicateClick}>Дублировать</button>
                                     <button className="menu-item delete-item" onClick={handleOpenDeleteConfirmation}>Удалить</button>
                                 </div>
                             )}
                            <span className="icon" onClick={handleOpenCloseConfirmation}>✖️</span>
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
                                {fields?.employees?.map((employee) => (
                                    <option key={employee.id} value={employee.fullName}>
                                        {employee.fullName}
                                    </option>
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
                            <button type="button" className="cancel-button" onClick={handleOpenCloseConfirmation}>Отменить</button>
                            <button type="submit" className="save-button">Сохранить</button>
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
                    message={`Вы уверены, что хотите удалить заказ №${order.orderNumber} для "${order.performer}"?`}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </>
    );
};

export default ExecutorEditModal;