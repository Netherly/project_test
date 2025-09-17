<<<<<<< HEAD
import React, { useState } from 'react';
// Мы можем переиспользовать стили, если они похожи, или создать новые
import '../../styles/AddExecutorModal.css'; 

const ExecutorEditModal = ({ order, onUpdate, onClose, onDelete, onDuplicate, fields }) => {
    // Инициализируем состояние формы данными из 'order'
    const [formData, setFormData] = useState({
        ...order,
        // Убедимся, что числовые значения не null/undefined, а строки
=======
import React, { useState, useMemo } from 'react';
import '../../styles/AddExecutorModal.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

const ExecutorEditModal = ({ order, onUpdate, onClose, onDelete, onDuplicate, fields, orders, transactions = [], assets = [] }) => {
    const [formData, setFormData] = useState({
        ...order,
>>>>>>> Alexander
        orderSum: order.orderSum || '',
        hourlyRate: order.hourlyRate || '',
        workTime: order.workTime || '',
    });
    
<<<<<<< HEAD
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
=======
    
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
>>>>>>> Alexander

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
<<<<<<< HEAD
=======
        setHasUnsavedChanges(true); 
>>>>>>> Alexander
    };

    const handleSubmit = (e) => {
        e.preventDefault();
<<<<<<< HEAD
        // Перед отправкой преобразуем числовые поля из строк в числа
=======
>>>>>>> Alexander
        const updatedOrder = {
            ...formData,
            orderSum: parseFloat(formData.orderSum) || 0,
            hourlyRate: parseFloat(formData.hourlyRate) || 0,
            workTime: parseFloat(formData.workTime) || 0,
        };
        onUpdate(updatedOrder);
<<<<<<< HEAD
=======
        setHasUnsavedChanges(false); 
>>>>>>> Alexander
    };
    
    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };
<<<<<<< HEAD

    const handleDeleteClick = () => {
        if (window.confirm(`Вы уверены, что хотите удалить заказ №${order.orderNumber} для "${order.performer}"?`)) {
            onDelete(order.id);
            onClose();
        }
        setShowOptionsMenu(false);
    };

=======
    
    
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

>>>>>>> Alexander
    const handleDuplicateClick = () => {
        onDuplicate(order);
        onClose();
        setShowOptionsMenu(false);
    };
<<<<<<< HEAD

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
=======
    
    
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

    const executorTransactions = useMemo(() => {
        if (!formData.orderNumber || !formData.performer || !formData.performerRole) {
            return [];
        }

        
        return transactions.filter(trx => 
            String(trx.orderNumber) === String(formData.orderNumber) &&
            trx.counterparty === formData.performer &&
            trx.subcategory === formData.performerRole
        );
    }, [transactions, formData.orderNumber, formData.performer, formData.performerRole]);

    return (
        <>
            <div className="add-executor-overlay" onClick={handleOpenCloseConfirmation}>
                <div className="add-executor-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-executor-header">
                        <h2>Редактировать заказ</h2>
                        <div className="add-transaction-actions">
                             <button className="options-button" onClick={handleMenuToggle}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                             {showOptionsMenu && (
                                 <div className="options-menu">
                                     <button className="menu-item" onClick={handleDuplicateClick}>Дублировать</button>
                                     <button className="menu-item delete-item" onClick={handleOpenDeleteConfirmation}>Удалить</button>
                                 </div>
                             )}
                            <span className="icon" onClick={handleOpenCloseConfirmation}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="add-executor-form">
                        <div className="form-row">
                            <label className="form-label">Номер заказа</label>
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

                        <div className="tab-content-row-column" style={{ marginTop: '20px' }}>
                            <div className="tab-content-title">Журнал операций</div>
                            <div className="executor-payment-log-table">
                                <div className="executor-payment-log-header">
                                    <div>Дата и время</div>
                                    <div>Статья</div>
                                    <div>Подстатья</div>
                                    <div>Счет</div>
                                    <div>Сумма операции</div>
                                </div>
                                
                                {executorTransactions.map((trx) => (
                                    <div key={trx.id} className="executor-payment-log-row">
                                        <input type="text" value={trx.date} readOnly />
                                        <input type="text" value={trx.category} readOnly />
                                        <input type="text" value={trx.subcategory} readOnly />
                                        <input type="text" value={trx.account} readOnly /> 
                                        <input 
                                            type="text" 
                                            value={`${trx.amount.toFixed(2)} ${trx.accountCurrency}`}
                                            className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                                            readOnly 
                                        />
                                    </div>
                                ))}
                            </div>
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
>>>>>>> Alexander
    );
};

export default ExecutorEditModal;