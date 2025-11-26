import React, { useEffect, useState } from 'react';
import '../../styles/AddAssetForm.css';
import { Plus, X } from 'lucide-react';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';
import AutoResizeTextarea from '../modals/OrderModal/AutoResizeTextarea';

const designNameMap = {
    'Монобанк': 'monobank-black',
    'ПриватБанк': 'privatbank-green',
    'Сбербанк': 'sberbank-light-green',
    'Bybit': 'bybit-white',
    'Рубин': 'ruby',
    'Сапфир': 'saphire',
    'Атлас': 'atlas',
    '3Д': '3d',
    'Красный': 'red',
};


const AddAssetForm = ({ onAdd, onClose, employees, fields }) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

   
    const { generalFields, assetsFields } = fields || { 
        generalFields: { currency: [] }, 
        assetsFields: { type: [], paymentSystem: [], cardDesigns: [] } 
    };

    

    const [formData, setFormData] = useState({
        accountName: '',
        currency: '',
        limitTurnover: '',
        type: '',
        paymentSystem: '',
        design: '',
        employee: '',
        requisites: [{ label: '', value: '' }],
    });

    useEffect(() => {
        
        setFormData((prev) => {
            const next = { ...prev };
            
            if ((!prev.currency || prev.currency === '') && generalFields.currency?.[0]) {
                const first = generalFields.currency[0];
                next.currency = typeof first === 'object' ? first.code || first.name : first;
            }
            
            if ((!prev.type || prev.type === '') && assetsFields.type?.[0]) {
                const first = assetsFields.type[0];
                next.type = typeof first === 'object' ? first.code || first.name : first;
            }
            if ((!prev.paymentSystem || prev.paymentSystem === '') && assetsFields.paymentSystem?.[0]) {
                const first = assetsFields.paymentSystem[0];
                next.paymentSystem = typeof first === 'object' ? first.code || first.name : first;
            }
            if ((!prev.design || prev.design === '') && assetsFields.cardDesigns?.[0]) {
                const first = assetsFields.cardDesigns[0];
                next.design = first?.id || '';
            }
            return next;
        });
    }, [assetsFields, generalFields]); 

    const handleFormChange = () => {
        if (!hasUnsavedChanges) setHasUnsavedChanges(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        handleFormChange();
    };

    const handleRequisiteChange = (index, e) => {
        const { name, value } = e.target;
        const newRequisites = [...formData.requisites];
        newRequisites[index][name] = value;
        setFormData((prevData) => ({
            ...prevData,
            requisites: newRequisites,
        }));
        handleFormChange();
    };

    const handleAddRequisite = () => {
        setFormData((prevData) => ({
            ...prevData,
            requisites: [...prevData.requisites, { label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleRemoveRequisite = (index) => {
        const newRequisites = formData.requisites.filter((_, i) => i !== index);
        setFormData((prevData) => ({
            ...prevData,
            requisites: newRequisites.length > 0 ? newRequisites : [{ label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return; 
        setIsLoading(true);

        const filteredRequisites = formData.requisites.filter(
            (req) => req.label.trim() !== '' || req.value.trim() !== ''
        );

        const newAssetPayload = {
            ...formData,
            limitTurnover: parseFloat(formData.limitTurnover) || 0,
            requisites: filteredRequisites,
        };

        try {
            if (onAdd) {
                await onAdd(newAssetPayload); 
            }
            setHasUnsavedChanges(false);
            
        } catch (error) {
            console.error('Ошибка при отправке данных родителю:', error);
            setIsLoading(false); 
        }
    };

    const handleAttemptClose = () => {
        if (hasUnsavedChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        onClose();
        setShowConfirmationModal(false);
    };

    const handleCancelClose = () => {
        setShowConfirmationModal(false);
    };

    const handleTextareaAutoResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    return (
        <>
            <div className="add-asset-overlay" onClick={handleAttemptClose}>
                <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-asset-header">
                        <h2>Добавить актив</h2>
                        <div className="add-asset-actions">
                            <span className="icon" onClick={handleAttemptClose}>
                                <X />
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="add-asset-form">
                        <div className="form-row">
                            <label htmlFor="accountName" className="form-label">
                                Наименование
                            </label>
                            <input
                                type="text"
                                id="accountName"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                placeholder="Например, ПриватБанк - Ключ к счету"
                                required
                                className="form-input1"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <label htmlFor="currency" className="form-label">
                                Валюта счета
                            </label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                required
                                className="form-input1"
                                disabled={isLoading}
                            >
                                <option value="" disabled>
                                    Выберите валюту
                                </option>
                                {(generalFields.currency || []).map((item, index) => {
                                    const value = typeof item === 'object' ? item.code || item.name : item;
                                    const display = typeof item === 'object' ? item.name : item;
                                    return (
                                        <option key={index} value={value}>
                                            {display}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="limitTurnover" className="form-label">
                                Лимит оборота
                            </label>
                            <input
                                type="number"
                                id="limitTurnover"
                                name="limitTurnover"
                                value={formData.limitTurnover}
                                onChange={handleChange}
                                placeholder="Введите лимит оборота"
                                className="form-input1"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <label htmlFor="type" className="form-label">
                                Тип
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                className="form-input1"
                                disabled={isLoading}
                            >
                                <option value="" disabled>
                                    Выберите тип
                                </option>
                                {(assetsFields.type || []).map((item, index) => {
                                    const value = typeof item === 'object' ? item.code || item.name : item;
                                    const display = typeof item === 'object' ? item.name : item;
                                    return (
                                        <option key={index} value={value}>
                                            {display}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="paymentSystem" className="form-label">
                                Платежная система
                            </label>
                            <select
                                id="paymentSystem"
                                name="paymentSystem"
                                value={formData.paymentSystem}
                                onChange={handleChange}
                                className="form-input1"
                                disabled={isLoading}
                            >
                                <option value="">Не выбрано</option>
                                {(assetsFields.paymentSystem || []).map((item, index) => {
                                    const value = typeof item === 'object' ? item.code || item.name : item;
                                    const display = typeof item === 'object' ? item.name : item;
                                    return (
                                        <option key={index} value={value}>
                                            {display}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="design" className="form-label">
                                Дизайн
                            </label>
                            <select
                                id="design"
                                name="design"
                                value={formData.design}
                                onChange={handleChange}
                                className="form-input1"
                                disabled={isLoading}
                            >
                                <option value="">Не выбрано</option>
                                {(assetsFields.cardDesigns || []).map((design, index) => (
                                    <option key={index} value={design.id}>
                                        {design.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="employee" className="form-label">
                                Сотрудник
                            </label>
                            <select
                                id="employee"
                                name="employee"
                                value={formData.employee}
                                onChange={handleChange}
                                required
                                className="form-input1"
                                disabled={isLoading}
                            >
                                <option value="" disabled>
                                    Выберите сотрудника
                                </option>
                                {employees &&
                                    employees.map((emp) => (
                                        <option key={emp.id} value={emp.fullName}>
                                            {emp.fullName}
                                        </option>
                                    ))}
                            </select>
                        </div>

                       
                        <div className="requisites-section">
                            <h3 className="requisites-header">Реквизиты</h3>
                            <div className="requisites-table-wrapper">
                                {formData.requisites.map((req, index) => (
                                    <div key={index} className="requisites-table-row">
                                        <div className="requisites-table-cell">
                                            <input
                                                type="text"
                                                name="label"
                                                value={req.label}
                                                onInput={(e) => {
                                                    handleRequisiteChange(index, e);
                                                }}
                                                placeholder="Введите название"
                                                className="form-input1"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        
                                        <div className="requisites-table-cell">
                                            <AutoResizeTextarea
                                                name="value"
                                                value={req.value}
                                                onChange={(e) => {
                                                    handleRequisiteChange(index, e);
                                                }}
                                                placeholder="Введите значение"
                                                className="assets-workplan-textarea" 
                                                disabled={isLoading}
                                            />
                                        </div>

                                       
                                        <div className="requisites-table-cell action-cell">
                                            {formData.requisites.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-category-btn"
                                                    onClick={() => handleRemoveRequisite(index)}
                                                    title="Удалить реквизит"
                                                    disabled={isLoading}
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="add-requisite-btn-icon"
                                onClick={handleAddRequisite}
                                title="Добавить реквизит"
                                disabled={isLoading}
                            >
                                <Plus size={20} color="white" /> Добавить
                            </button>
                        </div>

                       
                        <div className="assets-form-actions">
                            <button
                                type="button"
                                className="cancel-order-btn"
                                onClick={handleAttemptClose}
                                disabled={isLoading}
                            >
                                Отменить
                            </button>
                            <button type="submit" className="save-order-btn" disabled={isLoading}>
                                {isLoading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showConfirmationModal && (
                <ConfirmationModal
                    title="Сообщение"
                    message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
                    confirmText="OK"
                    cancelText="Отмена"
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                />
            )}
        </>
    );
};

export default AddAssetForm;