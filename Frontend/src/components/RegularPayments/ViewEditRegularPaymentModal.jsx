import React, { useState, useMemo, useRef } from "react";
import "../../styles/ViewEditTransactionModal.css"; 
import ConfirmationModal from '../modals/confirm/ConfirmationModal';
import { Trash2, Copy} from 'lucide-react';

const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

const ViewEditRegularPaymentModal = ({
    payment,
    onUpdate,
    onClose,
    onDelete,
    onDuplicate,
    assets = [],
    financeFields = {}
}) => {
    
    const originalPaymentRef = useRef(payment);
    
    const [formData, setFormData] = useState({ ...payment });
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showUnsavedChangesConfirmation, setShowUnsavedChangesConfirmation] = useState(false);

    const availableSubcategories = useMemo(() => {
        if (!formData.category || !financeFields?.subarticles) {
            return [];
        }
        return financeFields.subarticles.filter(
            (sub) => sub.subarticleInterval === formData.category
        );
    }, [formData.category, financeFields]);

    const hasUnsavedChanges = () => {
        return JSON.stringify(originalPaymentRef.current) !== JSON.stringify(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === "account") {
            const selectedAccount = assets.find(acc => acc.id === value);
            newFormData.accountCurrency = selectedAccount ? selectedAccount.currency : "UAH";
        }
        
        if (name === "category") {
            newFormData.subcategory = "";
        }

        
        if (name === "period") {
            if (value === "Еженедельно") {
                newFormData.cycleDay = "Понедельник"; 
            } else if (value === "Ежемесячно") {
                newFormData.cycleDay = '1';
            } else {
                newFormData.cycleDay = null; 
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData); 
        onClose();
    };

    const handleMenuToggle = () => setShowOptionsMenu(prev => !prev);

    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
        setShowOptionsMenu(false);
    };

    const handleConfirmDelete = () => {
        onDelete(payment.id);
        setShowDeleteConfirmation(false);
    };

    const handleDuplicateClick = () => {
        onDuplicate(payment);
        setShowOptionsMenu(false);
    };

    const handleCloseModal = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedChangesConfirmation(true);
        } else {
            onClose();
        }
    };

    return (
        <div className="add-transaction-overlay" onClick={handleCloseModal}>
            <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-transaction-header">
                    <h2>Редактировать регулярный платеж</h2>
                    <div className="add-transaction-actions">
                        <button className="options-button" onClick={handleMenuToggle}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                        {showOptionsMenu && (
                            <div className="options-menu">
                                <button className="menu-item" onClick={handleDuplicateClick}><Copy size={14}/> Дублировать</button>
                                <button className="menu-item delete-item" onClick={handleDeleteClick}><Trash2 size={14}/> Удалить</button>
                            </div>
                        )}
                        <span className="icon" onClick={handleCloseModal}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="white" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                    </div>
                </div>

                <form id="edit-regular-payment-form" onSubmit={handleSubmit} className="add-transaction-form custom-scrollbar">
                    {/* Статья */}
                    <div className="form-row">
                        <label htmlFor="category" className="form-label">Статья</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} required className="form-input1">
                            {financeFields?.articles?.map((article, index) => (
                                <option key={index} value={article.articleValue}>{article.articleValue}</option>
                            ))}
                        </select>
                    </div>

                    {/* Подстатья */}
                    {availableSubcategories.length > 0 && (
                        <div className="form-row">
                            <label htmlFor="subcategory" className="form-label">Подстатья</label>
                            <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} className="form-input1">
                                <option value="">Выберите подстатью</option>
                                {availableSubcategories.map((sub, index) => (
                                    <option key={index} value={sub.subarticleValue}>{sub.subarticleValue}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {/* NEW: Описание */}
                    <div className="form-row">
                        <label htmlFor="description" className="form-label">Описание</label>
                        <input type="text" id="description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Введите описание" className="form-input1" />
                    </div>

                    {/* Счет */}
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">Счет ({formData.accountCurrency})</label>
                        <select id="account" name="account" value={formData.account} onChange={handleChange} required className="form-input1">
                            {assets?.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Операция */}
                    <div className="form-row">
                        <label htmlFor="operation" className="form-label">Операция</label>
                        <select id="operation" name="operation" value={formData.operation} onChange={handleChange} required className="form-input1">
                            <option value="Списание">Списание</option>
                            <option value="Зачисление">Зачисление</option>
                        </select>
                    </div>

                    {/* Сумма */}
                    <div className="form-row">
                        <label htmlFor="amount" className="form-label">Сумма операции</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" className="form-input1" />
                    </div>
                    
                    {/* NEW: Дата начала */}
                    <div className="form-row">
                        <label htmlFor="startDate" className="form-label">Дата начала</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate || ''} onChange={handleChange} required className="form-input1" />
                    </div>

                    {/* Период */}
                    <div className="form-row">
                        <label htmlFor="period" className="form-label">Период</label>
                        <select id="period" name="period" value={formData.period} onChange={handleChange} required className="form-input1">
                            <option value="Ежедневно">Ежедневно</option>
                            <option value="Еженедельно">Еженедельно</option>
                            <option value="Ежемесячно">Ежемесячно</option>
                            <option value="Ежегодно">Ежегодно</option>
                        </select>
                    </div>

                    {/* NEW: Конкретизация цикла */}
                    {formData.period === "Еженедельно" && (
                        <div className="form-row">
                            <label htmlFor="cycleDay" className="form-label">День недели</label>
                            <select id="cycleDay" name="cycleDay" value={formData.cycleDay} onChange={handleChange} className="form-input1">
                                {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                        </div>
                    )}

                    {formData.period === "Ежемесячно" && (
                        <div className="form-row">
                            <label htmlFor="cycleDay" className="form-label">Число месяца</label>
                            <select id="cycleDay" name="cycleDay" value={formData.cycleDay} onChange={handleChange} className="form-input1">
                                {daysOfMonth.map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                        </div>
                    )}


                    {/* Время */}
                    <div className="form-row">
                        <label htmlFor="time" className="form-label">Время</label>
                        <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className="form-input1" />
                    </div>

                    {/* Статус */}
                    <div className="form-row">
                        <label htmlFor="status" className="form-label">Статус</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} required className="form-input1">
                            <option value="Активен">Активен</option>
                            <option value="На паузе">На паузе</option>
                        </select>
                    </div>
                </form>

                <div className="view-transaction-form-actions">
                    <button type="button" className="cancel-order-btn" onClick={handleCloseModal}>Отмена</button>
                    <button type="submit" form="edit-regular-payment-form" className="save-order-btn">Сохранить</button>
                </div>
            </div>
            
            {showDeleteConfirmation && (
                <ConfirmationModal
                    message={`Вы уверены, что хотите удалить регулярный платеж "${formData.category}"?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirmation(false)}
                />
            )}
            {showUnsavedChangesConfirmation && (
                <ConfirmationModal
                    message="У вас есть несохраненные изменения. Закрыть без сохранения?"
                    onConfirm={onClose}
                    onCancel={() => setShowUnsavedChangesConfirmation(false)}
                />
            )}
        </div>
    );
};

export default ViewEditRegularPaymentModal;