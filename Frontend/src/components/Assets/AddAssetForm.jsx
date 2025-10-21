import React, { useEffect, useState } from 'react';
import '../../styles/AddAssetForm.css';
import ConfirmationModal from '../modals/confirm/ConfirmationModal';
import { createAsset } from '../../api/assets';
import { FieldsAPI } from '../../api/fields';

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
    const [activeTab, setActiveTab] = useState('general');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // загрузка и хранение групп полей для вкладки "assets"
    const [assetsFields, setAssetsFields] = useState({
        currency: [],
        type: [],
        paymentSystem: [],
        cardDesigns: [],
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const af = await FieldsAPI.getAssets();
                console.log('Loaded assets fields:', af);
                if (mounted && af) {
                    setAssetsFields({
                        currency: af.currency || [],
                        type: af.type || [],
                        paymentSystem: af.paymentSystem || [],
                        cardDesigns: af.cardDesigns || [],
                    });
                    console.log('All assets fields set:', {
                        currency: af.currency || [],
                        type: af.type || [],
                        paymentSystem: af.paymentSystem || [],
                        cardDesigns: af.cardDesigns || [],
                    });
                }
            } catch (err) {
                console.error("Failed to load assets fields", err);
            }
        })();
        return () => { mounted = false; };
    }, []);

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
        // при загрузке assetsFields подставляем значения по-умолчанию, если еще не заполнено
        console.log('Setting default formData from assetsFields:', assetsFields);
        setFormData(prev => {
            const next = { ...prev };
            if ((!prev.currency || prev.currency === '') && assetsFields.currency?.[0]) {
                const first = assetsFields.currency[0];
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
            console.log('Updated formData:', next);
            return next;
        });
    }, [assetsFields]);

    const handleFormChange = () => {
        if (!hasUnsavedChanges) {
            setHasUnsavedChanges(true);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Form change:', name, value);
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        handleFormChange();
    };

    const handleRequisiteChange = (index, e) => {
        const { name, value } = e.target;
        const newRequisites = [...formData.requisites];
        newRequisites[index][name] = value;
        setFormData(prevData => ({
            ...prevData,
            requisites: newRequisites,
        }));
        handleFormChange();
    };

    const handleAddRequisite = () => {
        setFormData(prevData => ({
            ...prevData,
            requisites: [...prevData.requisites, { label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleRemoveRequisite = (index) => {
        const newRequisites = formData.requisites.filter((_, i) => i !== index);
        setFormData(prevData => ({
            ...prevData,
            requisites: newRequisites.length > 0 ? newRequisites : [{ label: '', value: '' }],
        }));
        handleFormChange();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const filteredRequisites = formData.requisites.filter(
            req => req.label.trim() !== '' || req.value.trim() !== ''
        );

        const newAssetPayload = {
            ...formData,
            limitTurnover: parseFloat(formData.limitTurnover) || 0,
            requisites: filteredRequisites,
        };
        
        console.log('Submitting asset payload:', newAssetPayload);
        
        try {
            const savedAsset = await createAsset(newAssetPayload);
            console.log('Created asset:', savedAsset);
            
            setHasUnsavedChanges(false);
            // Removed onAdd(savedAsset) to avoid duplicate
            onClose();

        } catch (error) {
            console.error("Failed to create asset:", error);
        } finally {
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

    return (
        <>
            <div className="add-asset-overlay" onClick={handleAttemptClose}>
                <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-asset-header">
                        <h2>Добавить счет</h2>
                        <div className="add-asset-actions">
                            <span className="icon" onClick={handleAttemptClose}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </span>
                        </div>
                    </div>
                    <div className="tabs">
                        <button
                            className={`tab-menu-btn ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            Общая информация
                        </button>
                        <button
                            className={`tab-menu-btn ${activeTab === 'requisites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('requisites')}
                        >
                            Реквизиты
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="add-asset-form">
                        {activeTab === 'general' && (
                            <div className="tab-content">
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
                                        disabled={isLoading}
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
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>Выберите валюту</option>
                                        {(assetsFields.currency || []).map((item, index) => {
                                            const value = typeof item === 'object' ? item.code || item.name : item;
                                            const display = typeof item === 'object' ? item.name : item;
                                            return <option key={index} value={value}>{display}</option>;
                                        })}
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
                                        disabled={isLoading}
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
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>Выберите тип</option>
                                        {(assetsFields.type || []).map((item, index) => {
                                            const value = typeof item === 'object' ? item.code || item.name : item;
                                            const display = typeof item === 'object' ? item.name : item;
                                            return <option key={index} value={value}>{display}</option>;
                                        })}
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
                                        disabled={isLoading}
                                    >
                                        <option value="">Не выбрано</option>
                                        {(assetsFields.paymentSystem || []).map((item, index) => {
                                            const value = typeof item === 'object' ? item.code || item.name : item;
                                            const display = typeof item === 'object' ? item.name : item;
                                            return <option key={index} value={value}>{display}</option>;
                                        })}
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
                                    <label htmlFor="employee" className="form-label">Сотрудник</label>
                                    <select
                                        id="employee"
                                        name="employee"
                                        value={formData.employee}
                                        onChange={handleChange}
                                        required
                                        className="form-input1"
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>Выберите сотрудника</option>
                                        {employees && employees.map(emp => (
                                            <option key={emp.id} value={emp.fullName}>
                                                {emp.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        {activeTab === 'requisites' && (
                            <div className="tab-content">
                                {formData.requisites.map((req, index) => (
                                    <div key={index} className="add-asset-requisite-item">
                                        <div className="form-row-inner">
                                            <label className="form-label">Название:</label>
                                            <input
                                                type="text"
                                                name="label"
                                                value={req.label}
                                                onChange={(e) => handleRequisiteChange(index, e)}
                                                placeholder="Введите название"
                                                className="form-input1"
                                                disabled={isLoading}
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
                                                className="form-input1"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {formData.requisites.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-requisite-button"
                                                onClick={() => handleRemoveRequisite(index)}
                                                disabled={isLoading}
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
                                    disabled={isLoading}
                                >
                                    Добавить еще реквизит
                                </button>
                            </div>
                        )}
                        <div className="assets-form-actions">
                            <button type="button" className="cancel-order-btn" onClick={handleAttemptClose} disabled={isLoading}>
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