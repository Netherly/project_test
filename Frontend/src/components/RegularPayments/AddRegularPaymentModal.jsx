import React, { useState, useMemo, useEffect } from "react";
import "../../styles/AddTransactionModal.css"; 
import ConfirmationModal from '../modals/confirm/ConfirmationModal';


const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);


const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const AddRegularPaymentModal = ({ onAdd, onClose, assets = [], financeFields = {} }) => {
    const initialFormData = useMemo(() => ({
        category: financeFields?.articles?.[0]?.articleValue || "",
        subcategory: "",
        description: "", 
        account: assets?.[0]?.id || "",
        accountCurrency: assets?.[0]?.currency || "UAH",
        operation: "Списание",
        amount: "",
        period: "Ежемесячно",
        cycleDay: '1', 
        time: "10:00",
        startDate: getTodayDate(), 
    }), [financeFields, assets]);

    const [formData, setFormData] = useState(initialFormData);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const availableSubcategories = useMemo(() => {
        if (!formData.category || !financeFields?.subarticles) {
            return [];
        }
        return financeFields.subarticles.filter(
            (sub) => sub.subarticleInterval === formData.category
        );
    }, [formData.category, financeFields]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, subcategory: "" }));
    }, [formData.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === "account") {
            const selectedAccount = assets.find(acc => acc.id === value);
            newFormData.accountCurrency = selectedAccount ? selectedAccount.currency : "UAH";
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
        setHasUnsavedChanges(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData); 
        setHasUnsavedChanges(false);
        onClose();
    };
    
    const handleConfirmClose = () => {
        onClose();
        setShowConfirmationModal(false);
    };

    const handleCancelClose = () => {
        setShowConfirmationModal(false);
    };

    const handleOverlayClose = () => {
        if (hasUnsavedChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };
    
    return (
        <div className="add-transaction-overlay" onClick={handleOverlayClose}>
            <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-transaction-header">
                    <h2>Добавить регулярный платеж</h2>
                    <span className="icon" onClick={handleOverlayClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                </div>

                <form id="add-regular-payment-form" onSubmit={handleSubmit} className="add-transaction-form custom-scrollbar">
                    
                    
                     {/* Статья */}
                     <div className="form-row">
                        <label htmlFor="category" className="form-label">Статья</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} required className="form-input1">
                            <option value="" disabled>Выберите статью</option>
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

                    {/* Описание */}
                    <div className="form-row">
                        <label htmlFor="description" className="form-label">Описание</label>
                        <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Введите описание" className="form-input1" />
                    </div>

                    {/* Счет */}
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">
                            Счет {formData.accountCurrency && `(${formData.accountCurrency})`}
                        </label>
                        <select id="account" name="account" value={formData.account} onChange={handleChange} required className="form-input1">
                            <option value="">Выберите счет</option>
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

                    {/* Сумма операции */}
                    <div className="form-row">
                        <label htmlFor="amount" className="form-label">Сумма операции</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="Введите сумму" required step="0.01" className="form-input1" />
                    </div>

                    {/* NEW: Дата начала */}
                    <div className="form-row">
                        <label htmlFor="startDate" className="form-label">Дата начала</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required className="form-input1" />
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

                    {/* Конкретизация цикла */}
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
                </form>

                <div className="transaction-form-actions">
                    <button type="button" className="cancel-order-btn" onClick={handleOverlayClose}>Отмена</button>
                    <button type="submit" form="add-regular-payment-form" className="save-order-btn">Сохранить</button>
                </div>
            </div>

            {showConfirmationModal && (
                <ConfirmationModal
                    message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно?"
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                />
            )}
        </div>
    );
};

export default AddRegularPaymentModal;