import React, { useState, useEffect } from 'react';
import '../../styles/AddAssetForm.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';

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

const AddAssetForm = ({ onAdd, onClose, fields }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false); // 👈 Новое состояние для модала

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
        console.log(`General field change: ${name} = ${value}`);
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
        setFormData(prevData => {
            console.log('New requisites state after change:', newRequisites);
            return {
                ...prevData,
                requisites: newRequisites,
            };
        });
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
        console.log('--- Submitting Form ---');
        console.log('formData before filtering requisites:', formData);
        console.log('Requisites array to be filtered:', formData.requisites);
        const filteredRequisites = formData.requisites.filter(
            req => {
                const isNotEmpty = req.label.trim() !== '' || req.value.trim() !== '';
                console.log(`Filtering requisite: label='${req.label}', value='${req.value}', isNotEmpty=${isNotEmpty}`);
                return isNotEmpty;
            }
        );
        console.log('Filtered requisites:', filteredRequisites);
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

    return (
        <>
            <div className="add-asset-overlay" onClick={handleOverlayClose}>
                <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-asset-header">
                        <h2>Добавить счет</h2>
                        <div className="add-asset-actions">
                            <span className="icon" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                        </div>
                    </div>
                    <div className="tabs">
                        <button
                            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            Общая информация
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'requisites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('requisites')}
                        >
                            Реквизиты
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="add-asset-form">
                        {activeTab === 'general' && (
                            <div className="tab-content">
                                <div className="form-row">
                                    <label htmlFor="accountName" className="form-label">Наименование счета</label>
                                    <input
                                        type="text"
                                        id="accountName"
                                        name="accountName"
                                        value={formData.accountName}
                                        onChange={handleChange}
                                        placeholder="Например, ПриватБанк - Ключ к счету"
                                        required
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                    <input
                                        type="text"
                                        id="employee"
                                        name="employee"
                                        value={formData.employee}
                                        onChange={handleChange}
                                        placeholder="Выберите сотрудника"
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}
                        {activeTab === 'requisites' && (
                            <div className="tab-content">
                                {formData.requisites.map((req, index) => (
                                    <div key={index} className="requisite-item">
                                        <div className="form-row-inner">
                                            <label className="form-label">Название:</label>
                                            <input
                                                type="text"
                                                name="label"
                                                value={req.label}
                                                onChange={(e) => handleRequisiteChange(index, e)}
                                                placeholder="Например, Ключ к счету"
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-row-inner">
                                            <label className="form-label">Значение:</label>
                                            <input
                                                type="text"
                                                name="value"
                                                value={req.value}
                                                onChange={(e) => handleRequisiteChange(index, e)}
                                                placeholder="Введите значение"
                                                className="form-input"
                                            />
                                        </div>
                                        {formData.requisites.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-requisite-button"
                                                onClick={() => handleRemoveRequisite(index)}
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="add-requisite-button"
                                    onClick={handleAddRequisite}
                                >
                                    Добавить еще реквизит
                                </button>
                            </div>
                        )}
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={onClose}>Отменить</button>
                            <button type="submit" className="save-button">Сохранить</button>
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