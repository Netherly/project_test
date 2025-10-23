import React, { useState, useEffect } from 'react';
import '../../styles/AddAssetForm.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';
import { Plus, X } from 'lucide-react';

const generateId = () => {
    return 'asset_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
};

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

const AddAssetForm = ({ onAdd, onClose, fields, employees }) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const [formData, setFormData] = useState({
        accountName: '',
        currency: fields?.currency?.[0] || '',
        limitTurnover: '',
        type: fields?.type?.[0] || '',
        paymentSystem: fields?.paymentSystem?.[0] || '',
        design: designNameMap[fields?.cardDesigns?.[0]?.name] || '',
        employee: '',
        requisites: [{ label: '', value: '' }],
    });

    useEffect(() => {
        console.log('Current formData.requisites state:', formData.requisites);
    }, [formData.requisites]);

    const handleFormChange = () => {
        setHasUnsavedChanges(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(`Field change: ${name} = ${value}`);
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        handleFormChange();
    };

    const handleRequisiteChange = (index, e) => {
        const { name, value } = e.target;
        console.log(`Requisite field change at index ${index}: ${name} = ${value}`);
        const newRequisites = [...formData.requisites];
        newRequisites[index][name] = value;
        setFormData(prevData => ({
            ...prevData,
            requisites: newRequisites,
        }));
        handleFormChange();
    };

    const handleAddRequisite = () => {
        console.log('Adding new requisite field.');
        setFormData(prevData => ({
            ...prevData,
            requisites: [...prevData.requisites, { label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleRemoveRequisite = (index) => {
        console.log(`Removing requisite field at index ${index}.`);
        const newRequisites = formData.requisites.filter((_, i) => i !== index);
        setFormData(prevData => ({
            ...prevData,
            requisites: newRequisites.length > 0 ? newRequisites : [{ label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newAssetId = generateId();
        const filteredRequisites = formData.requisites.filter(
            req => req.label.trim() !== '' || req.value.trim() !== ''
        );
        const newAsset = {
            id: newAssetId,
            accountName: formData.accountName,
            currency: formData.currency,
            limitTurnover: parseFloat(formData.limitTurnover) || 0,
            type: formData.type,
            paymentSystem: formData.paymentSystem,
            design: formData.design,
            employee: formData.employee,
            requisites: filteredRequisites,
            balance: 0.00,
            balanceUAH: 0.00,
            balanceUSD: 0.00,
            balanceRUB: 0.00,
            lastEntryDate: 'N/A',
            netMoneyUAH: 0.00,
            netMoneyUSD: 0.00,
            netMoneyRUB: 0.00,
            turnoverStartBalance: 0.00,
            turnoverIncoming: 0.00,
            turnoverOutgoing: 0.00,
            turnoverEndBalance: 0.00,
        };
        console.log('Final newAsset object to be added:', newAsset);
        onAdd(newAsset);
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

    const handleTextareaAutoResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    return (
        <>
            <div className="add-asset-overlay" onClick={handleOverlayClose}>
                <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-asset-header">
                        <h2>Добавить актив</h2>
                        <div className="add-asset-actions">
                            <span className="icon" onClick={onClose}><X/></span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="add-asset-form">
                        {/* --- General Information Section --- */}
                        <div className="form-row">
                            <label htmlFor="accountName" className="form-label">Наименование</label>
                            <input
                                type="text"
                                id="accountName"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                placeholder="Например, ПриватБанк - Ключ к счету"
                                required
                                className="form-input1"
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="currency" className="form-label">Валюта счета</label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                required
                                className="form-input1"
                            >
                                <option value="" disabled>Выберите валюту</option>
                                {fields?.currency?.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="limitTurnover" className="form-label">Лимит оборота</label>
                            <input
                                type="number"
                                id="limitTurnover"
                                name="limitTurnover"
                                value={formData.limitTurnover}
                                onChange={handleChange}
                                placeholder="Введите лимит оборота"
                                className="form-input1"
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="type" className="form-label">Тип</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                className="form-input1"
                            >
                                <option value="" disabled>Выберите тип</option>
                                {fields?.type?.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="paymentSystem" className="form-label">Платежная система</label>
                            <select
                                id="paymentSystem"
                                name="paymentSystem"
                                value={formData.paymentSystem}
                                onChange={handleChange}
                                className="form-input1"
                            >
                                <option value="">Не выбрано</option>
                                {fields?.paymentSystem?.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="design" className="form-label">Дизайн</label>
                            <select
                                id="design"
                                name="design"
                                value={formData.design}
                                onChange={handleChange}
                                className="form-input1"
                            >
                                <option value="">Не выбрано</option>
                                {fields?.cardDesigns?.map((design, index) => (
                                    <option key={index} value={designNameMap[design.name]}>
                                        {design.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <label htmlFor="employee" className="form-label">Сотрудник</label>
                            <select
                                id="employee"
                                name="employee"
                                value={formData.employee}
                                onChange={handleChange}
                                required
                                className="form-input1"
                            >
                                <option value="" disabled>Выберите сотрудника</option>
                                {employees && employees.map(emp => (
                                    <option key={emp.id} value={emp.fullName}>
                                        {emp.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* --- Requisites Section --- */}
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
                                                className="assets-workplan-textarea"
                                            />
                                        </div>
                                        <div className="requisites-table-cell">
                                            <textarea
                                                name="value"
                                                value={req.value}
                                                onInput={(e) => {
                                                    handleRequisiteChange(index, e); 
                                                    handleTextareaAutoResize(e); 
                                                }}
                                                placeholder="Введите реквизиты"
                                                className="assets-workplan-textarea"
                                            />
                                        </div>
                                        <div className="requisites-table-cell action-cell">
                                            {formData.requisites.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-category-btn"
                                                    onClick={() => handleRemoveRequisite(index)}
                                                    title="Удалить реквизит"
                                                >
                                                    <X size={18}/>
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
                            >
                                <Plus size={20} color='white'/> Добавить
                            </button>
                        </div>

                        <div className="assets-form-actions">
                            <button type="button" className="cancel-order-btn" onClick={onClose}>Отменить</button>
                            <button type="submit" className="save-order-btn">Сохранить</button>
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