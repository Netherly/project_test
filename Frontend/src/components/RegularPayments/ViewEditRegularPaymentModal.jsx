
import React, { useState, useMemo, useRef } from "react";
import "../../styles/ViewEditTransactionModal.css"; 
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

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
                    <h2>Редактировать платеж</h2>
                    <div className="add-transaction-actions">
                        <button className="options-button" onClick={handleMenuToggle}>⋮</button>
                        {showOptionsMenu && (
                            <div className="options-menu">
                                <button className="menu-item" onClick={handleDuplicateClick}>Дублировать</button>
                                <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить</button>
                            </div>
                        )}
                        <span className="icon" onClick={handleCloseModal}>✖️</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-transaction-form">
                    <div className="form-row">
                        <label htmlFor="category" className="form-label">Статья</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} required className="form-input">
                            {financeFields?.articles?.map((article, index) => (
                                <option key={index} value={article.articleValue}>{article.articleValue}</option>
                            ))}
                        </select>
                    </div>

                    {availableSubcategories.length > 0 && (
                        <div className="form-row">
                            <label htmlFor="subcategory" className="form-label">Подстатья</label>
                            <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} className="form-input">
                                <option value="">Выберите подстатью</option>
                                {availableSubcategories.map((sub, index) => (
                                    <option key={index} value={sub.subarticleValue}>{sub.subarticleValue}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">Счет ({formData.accountCurrency})</label>
                        <select id="account" name="account" value={formData.account} onChange={handleChange} required className="form-input">
                            {assets?.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label htmlFor="operation" className="form-label">Операция</label>
                        <select id="operation" name="operation" value={formData.operation} onChange={handleChange} required className="form-input">
                            <option value="Списание">Списание</option>
                            <option value="Зачисление">Зачисление</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <label htmlFor="amount" className="form-label">Сумма операции</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" className="form-input" />
                    </div>

                    <div className="form-row">
                        <label htmlFor="period" className="form-label">Период</label>
                        <select id="period" name="period" value={formData.period} onChange={handleChange} required className="form-input">
                            <option value="Ежедневно">Ежедневно</option>
                            <option value="Еженедельно">Еженедельно</option>
                            <option value="Ежемесячно">Ежемесячно</option>
                            <option value="Ежегодно">Ежегодно</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <label htmlFor="time" className="form-label">Время</label>
                        <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className="form-input" />
                    </div>

                    
                    <div className="form-row">
                        <label htmlFor="status" className="form-label">Статус</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} required className="form-input">
                            <option value="Активен">Активен</option>
                            <option value="На паузе">На паузе</option>
                        </select>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="cancel-button" onClick={handleCloseModal}>Отмена</button>
                        <button type="submit" className="submit-button">Сохранить</button>
                    </div>
                </form>
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
                    onConfirm={() => onClose()}
                    onCancel={() => setShowUnsavedChangesConfirmation(false)}
                />
            )}
        </div>
    );
};

export default ViewEditRegularPaymentModal;