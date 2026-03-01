import React, { useState, useMemo, useEffect } from "react";
import "../../styles/AddTransactionModal.css"; 
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

const getArticleValue = (article) =>
    String(article?.articleValue ?? article?.name ?? article?.value ?? '').trim();
const getSubarticleInterval = (sub) =>
    String(
        sub?.subarticleInterval ??
        sub?.parentArticleName ??
        sub?.articleName ??
        sub?.interval ??
        sub?.group ??
        ''
    ).trim();
const getSubarticleValue = (sub) =>
    String(sub?.subarticleValue ?? sub?.name ?? sub?.value ?? '').trim();

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
        category: financeFields?.articles?.[0] ? getArticleValue(financeFields.articles[0]) : "",
        subcategory: "",
        description: "", 
        account: assets?.[0]?.id || "",
        accountCurrency: assets?.[0]?.currency || "UAH",
        operation: "Списание",
        amount: "",
        period: "Ежемесячно",
        cycleDay: '1', 
        time: "10:00",
    }), [financeFields, assets]);

    const [formData, setFormData] = useState(initialFormData);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const availableSubcategories = useMemo(() => {
        if (!formData.category || !financeFields?.subarticles) {
            return [];
        }
        return financeFields.subarticles.filter(
            (sub) => getSubarticleInterval(sub) === formData.category
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
                newFormData.cycleDay = '1'; 
            } else if (value === "Ежемесячно") {
                newFormData.cycleDay = '1'; 
            } else if (value === "Ежегодно") {
                newFormData.cycleDay = '01.01'; 
            } else { 
                newFormData.cycleDay = null; 
            }
        }

       
        if (name === "cycleDay") {
            const { period } = formData; 
            let valueToSave = value;

            if (period === "Еженедельно") {
                
                valueToSave = value.replace(/[^1-7]/g, '');
                
                if (valueToSave.length > 1) {
                    valueToSave = valueToSave[0];
                }
            } else if (period === "Ежемесячно") {
                
                valueToSave = value.replace(/\D/g, '');
                if (valueToSave) {
                    const num = parseInt(valueToSave, 10);
                    if (num > 31) valueToSave = '31';
                    if (num < 1 && valueToSave.length > 0) valueToSave = '1';
                }
            } else if (period === "Ежегодно") {
                
                let formattedValue = value.replace(/[^0-9.]/g, ''); 

                
                if (formattedValue.length === 2 && formData.cycleDay.length === 1 && !formattedValue.includes('.')) {
                    formattedValue += '.';
                }
                
                if (formattedValue === '.') {
                    formattedValue = '';
                }
                
                valueToSave = formattedValue.substring(0, 5);
            }
            
            newFormData.cycleDay = valueToSave;
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
                            <option value="" disabled hidden>Не выбрано</option>
                            {financeFields?.articles
                                ?.map((article, index) => ({
                                    key: article?.id || index,
                                    value: getArticleValue(article),
                                }))
                                .filter((article) => article.value)
                                .map((article) => (
                                    <option key={article.key} value={article.value}>
                                        {article.value}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Подстатья */}
                    {availableSubcategories.length > 0 && (
                        <div className="form-row">
                            <label htmlFor="subcategory" className="form-label">Подстатья</label>
                            <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} className="form-input1">
                                <option value="" disabled hidden>Не выбрано</option>
                            {availableSubcategories
                                .map((sub, index) => ({
                                    key: sub?.id || index,
                                    value: getSubarticleValue(sub),
                                }))
                                .filter((sub) => sub.value)
                                .map((sub) => (
                                    <option key={sub.key} value={sub.value}>
                                        {sub.value}
                                    </option>
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
                            <option value="" disabled hidden>Не выбрано</option>
                            {assets?.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Операция */}
                    <div className="form-row">
                        <label htmlFor="operation" className="form-label">Операция</label>
                        <select id="operation" name="operation" value={formData.operation} onChange={handleChange} required className="form-input1">
                            <option value="" disabled hidden>Не выбрано</option>
                            <option value="Списание">Списание</option>
                            <option value="Зачисление">Зачисление</option>
                        </select>
                    </div>

                    {/* Сумма операции */}
                    <div className="form-row">
                        <label htmlFor="amount" className="form-label">Сумма операции</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="Введите сумму" required step="0.01" className="form-input1" />
                    </div>

        
                    {/* Период */}
                    <div className="form-row">
                        <label htmlFor="period" className="form-label">Период</label>
                        <select id="period" name="period" value={formData.period} onChange={handleChange} required className="form-input1">
                            <option value="" disabled hidden>Не выбрано</option>
                            <option value="Ежедневно">Ежедневно</option>
                            <option value="Еженедельно">Еженедельно</option>
                            <option value="Ежемесячно">Ежемесячно</option>
                            <option value="Ежегодно">Ежегодно</option>
                        </select>
                    </div>

                    {/* --- ИЗМЕНЕНИЕ 3: Новые инпуты для Конкретизации цикла --- */}

                    {/* Еженедельно */}
                    {formData.period === "Еженедельно" && (
                        <div className="form-row">
                            <label htmlFor="cycleDay" className="form-label">День недели (1-7)</label>
                            <input
                                type="number" // Используем number для авто-валидации
                                id="cycleDay"
                                name="cycleDay"
                                value={formData.cycleDay}
                                onChange={handleChange}
                                min="1"
                                max="7"
                                placeholder="1-7 (Пн-Вс)"
                                className="form-input1"
                            />
                        </div>
                    )}

                    {/* Ежемесячно */}
                    {formData.period === "Ежемесячно" && (
                        <div className="form-row">
                            <label htmlFor="cycleDay" className="form-label">Число месяца (1-31)</label>
                            <input
                                type="number" // Используем number для авто-валидации
                                id="cycleDay"
                                name="cycleDay"
                                value={formData.cycleDay}
                                onChange={handleChange}
                                min="1"
                                max="31"
                                placeholder="1-31"
                                className="form-input1"
                            />
                        </div>
                    )}

                    {/* Ежегодно */}
                    {formData.period === "Ежегодно" && (
                        <div className="form-row">
                            <label htmlFor="cycleDay" className="form-label">Дата (в формате ДД.ММ)</label>
                            <input
                                type="text"
                                id="cycleDay"
                                name="cycleDay"
                                value={formData.cycleDay}
                                onChange={handleChange}
                                placeholder="05.05"
                                maxLength="5" // ДД.ММ
                                className="form-input1"
                            />
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
