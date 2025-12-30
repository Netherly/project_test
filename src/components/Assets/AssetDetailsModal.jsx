import React, { useState, useEffect, useRef } from 'react';
import '../../styles/AssetDetailsModal.css';
import { Save, Plus, X, Pencil, Trash2, Copy } from 'lucide-react';

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

const formatNumberWithSpaces = (num) => {
    if (num === null || num === undefined || isNaN(Number(num))) {
        return '0.00';
    }
    const fixedNum = Number(num).toFixed(2);
    const parts = fixedNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
};

const AssetDetailsModal = ({ asset, onClose, onDelete, onDuplicate, onSave, fields, employees }) => {
    const [showPaymentSystem, setShowPaymentSystem] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [showTurnoverTooltip, setShowTurnoverTooltip] = useState(false);
    const [isEditingRequisites, setIsEditingRequisites] = useState(false);
    const [editableAsset, setEditableAsset] = useState({ ...asset });

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableAsset((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRequisiteChange = (index, e) => {
        const { name, value } = e.target;
        const newRequisites = [...editableAsset.requisites];
        newRequisites[index] = { ...newRequisites[index], [name]: value };
        setEditableAsset((prev) => ({
            ...prev,
            requisites: newRequisites,
        }));
    };

    const handleAddRequisite = () => {
        setEditableAsset((prev) => ({
            ...prev,
            requisites: [...prev.requisites, { label: '', value: '' }],
        }));
        if (!isEditingRequisites) setIsEditingRequisites(true);
    };

    const handleRequisitesSave = () => {
        const filtered = editableAsset.requisites.filter(
            (req) => req.label.trim() !== '' || req.value.trim() !== ''
        );
        setEditableAsset((prev) => ({
            ...prev,
            requisites: filtered,
        }));
        setIsEditingRequisites(false);
    };

    const handleRemoveRequisite = (index) => {
        const newRequisites = editableAsset.requisites.filter((_, i) => i !== index);
        setEditableAsset((prev) => ({
            ...prev,
            requisites: newRequisites,
        }));
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem('exchangeRates');
            if (stored) {
                setExchangeRates(JSON.parse(stored)[0]);
            } else {
                setExchangeRates({
                    UAH: 1,
                    USD: 43,
                    RUB: 0.5,
                    UAH_RUB: 2,
                    UAH_USD: 0.023255813953488372,
                    USD_UAH: 43,
                    USD_RUB: 16.0004,
                    RUB_UAH: 0.5,
                    RUB_USD: 0.06249843753906153,
                });
            }
        } catch (err) {
            console.error('Error loading exchange rates:', err);
        }
    }, []);

    if (!asset || !exchangeRates) return null;

    const turnoverLimit = parseFloat(editableAsset.limitTurnover) || 0;
    const incoming = asset.turnoverIncoming || 0;
    const outgoing = asset.turnoverOutgoing || 0;
    const totalTurnover = incoming + outgoing;
    const turnoverPercentage = turnoverLimit > 0 ? (totalTurnover / turnoverLimit) * 100 : 0;
    const progressBarWidth = Math.min(turnoverPercentage, 100);

    const getProgressColor = (pct) => {
        if (pct > 100) return '#ff4d4f';
        if (pct > 80) return '#fa8c16';
        if (pct > 50) return '#fadb14';
        return '#4CAF50';
    };

    const convertToCurrency = (amount, from, to) => {
        if (!exchangeRates) return amount.toFixed(2);
        if (from === to) return amount.toFixed(2);
        let inUAH = amount;
        if (from !== 'UAH') {
            const key = `${from}_UAH`;
            if (exchangeRates[key]) inUAH = amount * exchangeRates[key];
        }
        if (to === 'UAH') return inUAH.toFixed(2);
        const key = `UAH_${to}`;
        return exchangeRates[key]
            ? (inUAH * exchangeRates[key]).toFixed(2)
            : amount.toFixed(2);
    };

    const handleSave = () => {
        const filtered = editableAsset.requisites.filter(
            (req) => req.label.trim() !== '' || req.value.trim() !== ''
        );
        onSave({ ...editableAsset, requisites: filtered });
    };

    const handleDeleteClick = () => {
        if (window.confirm(`Вы уверены, что хотите удалить актив "${asset.accountName}"?`)) {
            onDelete(asset.id);
            onClose();
        }
        setShowOptionsMenu(false);
    };

    const handleDuplicateClick = () => {
        onDuplicate(asset);
        onClose();
        setShowOptionsMenu(false);
    };

    const allowDrop = (e) => e.preventDefault();

    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e, index) => {
        dragOverItem.current = index;
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over');

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragged = dragItem.current;
        const dropped = dragOverItem.current;
        if (dragged === null || dropped === null || dragged === dropped) return;
        const newReq = [...editableAsset.requisites];
        const [moved] = newReq.splice(dragged, 1);
        newReq.splice(dropped, 0, moved);
        setEditableAsset((prev) => ({ ...prev, requisites: newReq }));
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const currentBalance = asset.balance || 0;
    const freeBalance = asset.freeBalance ?? asset.balance;
    const mainRequisite = editableAsset.requisites[0] || null;
    const otherRequisites = editableAsset.requisites.slice(1);

    return (
        <div className="assets-modal-overlay" onClick={onClose}>
            <div className="assets-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="asset-modal-header">
                    <h2>{asset.accountName}</h2>
                    <div className="header-actions-right">
                        <span>{asset.currency}</span>
                        <div className="modal-header-actions">
                            <button className="options-button" onClick={() => setShowOptionsMenu((p) => !p)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                                </svg>
                            </button>
                            {showOptionsMenu && (
                                <div className="options-menu">
                                    <button className="menu-item" onClick={handleDuplicateClick}><Copy size={14}/> Дублировать</button>
                                    <button className="menu-item delete-item" onClick={handleDeleteClick}><Trash2 size={14}/> Удалить</button>
                                </div>
                            )}
                            <button className="modal-close-button" onClick={onClose}><X /></button>
                        </div>
                    </div>
                </div>

                <div className="modal-body1 custom-scrollbar">
                    {/* Баланс */}
                    <div className="modal-section">
                        <h3>Баланс</h3>
                        <div className="balance-grid-header">
                            <span>{asset.currency}</span>
                            <span>В грн</span>
                            <span>В $</span>
                            <span>В руб</span>
                        </div>
                        <div className="balance-grid-row">
                            <span>{formatNumberWithSpaces(currentBalance)}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, 'UAH'))}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, 'USD'))}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, 'RUB'))}</span>
                        </div>
                    </div>

                    {/* Свободный баланс */}
                    <div className="modal-section">
                        <h3>Свободный</h3>
                        <div className="balance-grid-header">
                            <span>{asset.currency}</span>
                            <span>В грн</span>
                            <span>В $</span>
                            <span>В руб</span>
                        </div>
                        <div className="balance-grid-row">
                            <span>{formatNumberWithSpaces(freeBalance)}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, 'UAH'))}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, 'USD'))}</span>
                            <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, 'RUB'))}</span>
                        </div>
                    </div>

                    {/* Лимит оборота */}
                    <div className="modal-section">
                        <h3>Лимит оборота</h3>
                        <div
                            className="modal-limit-input-container"
                            onMouseEnter={() => setShowTurnoverTooltip(true)}
                            onMouseLeave={() => setShowTurnoverTooltip(false)}
                        >
                            <div className="modal-limit-progress-bar-wrapper">
                                <div
                                    className="modal-limit-progress-bar"
                                    style={{
                                        width: `${progressBarWidth}%`,
                                        backgroundColor: getProgressColor(turnoverPercentage),
                                    }}
                                />
                            </div>
                            <span className="modal-limit-value">{formatNumberWithSpaces(turnoverPercentage)}%</span>
                            {showTurnoverTooltip && (
                                <div className="turnover-tooltip">
                                    Зачислено: {formatNumberWithSpaces(incoming)} / Списано: {formatNumberWithSpaces(outgoing)}
                                    {turnoverPercentage > 100 && (
                                        <div className="turnover-tooltip-overlimit">
                                            Превышен на {formatNumberWithSpaces(turnoverPercentage - 100)}%
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Параметры */}
                    <div className="modal-section edit-section">
                        <h3>Параметры</h3>
                        <div className="edit-form">
                            <div className="form-row">
                                <label htmlFor="accountName" className="form-label">Наименование</label>
                                <input
                                    type="text"
                                    id="accountName"
                                    name="accountName"
                                    value={editableAsset.accountName}
                                    onChange={handleChange}
                                    className="form-input1"
                                />
                            </div>

                            <div className="form-row">
                                <label htmlFor="currency" className="form-label">Валюта</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={editableAsset.currency}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    {/* Изменено: fields.generalFields.currency */}
                                    {fields?.generalFields?.currency?.map((item, index) => {
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
                                    value={editableAsset.limitTurnover}
                                    onChange={handleChange}
                                    className="form-input1"
                                />
                            </div>

                            <div className="form-row">
                                <label htmlFor="type" className="form-label">Тип</label>
                                <select
                                    name="type"
                                    value={editableAsset.type}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    {/* Изменено: fields.assetsFields.type */}
                                    {fields?.assetsFields?.type?.map((item, index) => {
                                        const value = typeof item === 'object' ? item.code || item.name : item;
                                        const display = typeof item === 'object' ? item.name : item;
                                        return <option key={index} value={value}>{display}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="paymentSystem" className="form-label">Платежная система</label>
                                <select
                                    name="paymentSystem"
                                    value={editableAsset.paymentSystem || ''}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    <option value="">Не выбрано</option>
                                    {/* Изменено: fields.assetsFields.paymentSystem */}
                                    {fields?.assetsFields?.paymentSystem?.map((item, index) => {
                                        const value = typeof item === 'object' ? item.code || item.name : item;
                                        const display = typeof item === 'object' ? item.name : item;
                                        return <option key={index} value={value}>{display}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="design" className="form-label">Дизайн</label>
                                <select
                                    name="design"
                                    value={editableAsset.design}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    <option value="">Не выбрано</option>
                                    {/* Изменено: fields.assetsFields.cardDesigns */}
                                    {fields?.assetsFields?.cardDesigns?.map((design, index) => (
                                        <option key={index} value={design.id}>{design.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="employee" className="form-label">Сотрудник</label>
                                <select
                                    name="employee"
                                    value={editableAsset.employee}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    {employees?.map((emp) => (
                                        <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label htmlFor="status" className="form-label">Статус</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={editableAsset.status || 'Активен'}
                                    onChange={handleChange}
                                    className="form-input1"
                                >
                                    <option value="Активен">Активен</option>
                                    <option value="Неактивен">Неактивен</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-order-btn" onClick={onClose}>Отменить</button>
                    <button className="save-order-btn" onClick={handleSave}>Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailsModal;