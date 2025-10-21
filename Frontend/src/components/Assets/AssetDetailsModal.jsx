import React, { useState, useEffect, useRef } from 'react';
import '../../styles/AssetDetailsModal.css';

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

const AssetDetailsModal = ({ asset, onClose, onDelete, onDuplicate, onSave, fields, employees }) => {
    const [showPaymentSystem, setShowPaymentSystem] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [showTurnoverTooltip, setShowTurnoverTooltip] = useState(false);
    const [isEditingRequisites, setIsEditingRequisites] = useState(false);
    const [editableAsset, setEditableAsset] = useState({ ...asset });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableAsset(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRequisiteChange = (index, e) => {
        const { name, value } = e.target;
        const newRequisites = [...editableAsset.requisites];
        newRequisites[index] = { ...newRequisites[index], [name]: value };
        setEditableAsset(prev => ({
            ...prev,
            requisites: newRequisites,
        }));
    };

    const handleAddRequisite = () => {
        setEditableAsset(prev => ({
            ...prev,
            requisites: [...prev.requisites, { label: '', value: '' }],
        }));
        if (!isEditingRequisites) {
            setIsEditingRequisites(true);
        }
    };

    const handleRequisitesSave = () => {
        const filteredRequisites = editableAsset.requisites.filter(
            req => req.label.trim() !== '' || req.value.trim() !== ''
        );
        setEditableAsset(prev => ({
            ...prev,
            requisites: filteredRequisites
        }));
        setIsEditingRequisites(false);
    };

    const handleRemoveRequisite = (index) => {
        const newRequisites = editableAsset.requisites.filter((_, i) => i !== index);
        setEditableAsset(prev => ({
            ...prev,
            requisites: newRequisites,
        }));
    };

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    useEffect(() => {
        const getExchangeRates = () => {
            try {
                const rates = localStorage.getItem('exchangeRates');
                return rates ? JSON.parse(rates) : null;
            } catch (error) {
                console.error("Error reading exchange rates from localStorage:", error);
                return null;
            }
        };

        const rates = getExchangeRates();
        if (rates && rates.length > 0) {
            setExchangeRates(rates[0]);
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
    }, []);

    if (!asset || !exchangeRates) return null;

    const turnoverLimit = 1000;
    const currentTurnoverIncoming = asset.turnoverIncoming || 0;
    const currentTurnoverOutgoing = asset.turnoverOutgoing || 0;
    const totalCurrentTurnover = currentTurnoverIncoming + currentTurnoverOutgoing;
    const turnoverPercentage = (totalCurrentTurnover / turnoverLimit) * 100;
    const formattedTurnoverPercentage = Math.min(100, Math.max(0, turnoverPercentage)).toFixed(2);

    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
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

    const convertToCurrency = (amount, fromCurrency, toCurrency) => {
        if (!exchangeRates) return amount.toFixed(2);
        if (fromCurrency === toCurrency) return amount.toFixed(2);
        
        let amountInUAH = amount;
        if (fromCurrency && fromCurrency !== 'UAH') {
            const rateKey = `${fromCurrency}_UAH`;
            if (exchangeRates[rateKey]) {
                amountInUAH = amount * exchangeRates[rateKey];
            } else {
                console.warn(`Exchange rate for ${rateKey} not found.`);
                return amount.toFixed(2);
            }
        }

        if (toCurrency === 'UAH') {
            return amountInUAH.toFixed(2);
        } else {
            const rateKey = `UAH_${toCurrency}`;
            if (exchangeRates[rateKey]) {
                return (amountInUAH * exchangeRates[rateKey]).toFixed(2);
            } else {
                console.warn(`Exchange rate for ${rateKey} not found.`);
                return amount.toFixed(2);
            }
        }
    };

    const currentBalance = asset.balance || 0;
    const freeBalance = asset.freeBalance !== undefined ? asset.freeBalance : asset.balance;

    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e, index) => {
        dragOverItem.current = index;
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const draggedIndex = dragItem.current;
        const droppedIndex = dragOverItem.current;

        if (draggedIndex === null || droppedIndex === null || draggedIndex === droppedIndex) {
            return;
        }

        const newRequisites = [...editableAsset.requisites];
        const [movedItem] = newRequisites.splice(draggedIndex, 1);
        newRequisites.splice(droppedIndex, 0, movedItem);

        setEditableAsset(prev => ({
            ...prev,
            requisites: newRequisites,
        }));

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const allowDrop = (e) => {
        e.preventDefault();
    };

    const handleSave = () => {
        const filteredRequisites = editableAsset.requisites.filter(
            req => req.label.trim() !== '' || req.value.trim() !== ''
        );
        onSave({ ...editableAsset, requisites: filteredRequisites });
    };

    const mainRequisite = editableAsset.requisites.length > 0 ? editableAsset.requisites[0] : null;
    const otherRequisites = editableAsset.requisites.slice(1);

    return (
        <div className="assets-modal-overlay" onClick={onClose}>
            <div className="assets-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="asset-modal-header">
                    <h2>"{asset.accountName}"</h2>
                    <div className="header-actions-right">
                        <span>{asset.currency}</span>
                        <div className="modal-header-actions">
                            <button className="options-button" onClick={handleMenuToggle}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                            {showOptionsMenu && (
                                <div className="options-menu">
                                    <button className="menu-item" onClick={handleDuplicateClick}>&#x2398; Дублировать</button>
                                    <button className="menu-item delete-item" onClick={handleDeleteClick}>🗑️ Удалить</button>
                                </div>
                            )}
                            <button className="modal-close-button" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                    </div>
                </div>
                <div className="modal-body1 custom-scrollbar">
                    <div className="modal-section">
                        <h3>Баланс</h3>
                        <div className="balance-grid-header">
                            <span>{asset.currency}</span>
                            <span>В грн</span>
                            <span>В $</span>
                            <span>В руб</span>
                        </div>
                        <div className="balance-grid-row">
                            <span>{currentBalance.toFixed(2)}</span>
                            <span>{convertToCurrency(currentBalance, asset.currency, 'UAH')}</span>
                            <span>{convertToCurrency(currentBalance, asset.currency, 'USD')}</span>
                            <span>{convertToCurrency(currentBalance, asset.currency, 'RUB')}</span>
                        </div>
                    </div>

                    <div className="modal-section">
                        <h3>Свободный</h3>
                        <div className="balance-grid-header">
                            <span>{asset.currency}</span>
                            <span>В грн</span>
                            <span>В $</span>
                            <span>В руб</span>
                        </div>
                        <div className="balance-grid-row">
                            <span className={Number(freeBalance) === Number(asset.turnoverEndBalance) ? 'highlight-green' : ''}>
                                {freeBalance.toFixed(2)}
                            </span>
                            <span className={Number(freeBalance) === Number(asset.turnoverEndBalance) ? 'highlight-green' : ''}>
                                {convertToCurrency(freeBalance, asset.currency, 'UAH')}
                            </span>
                            <span className={Number(freeBalance) === Number(asset.turnoverEndBalance) ? 'highlight-green' : ''}>
                                {convertToCurrency(freeBalance, asset.currency, 'USD')}
                            </span>
                            <span className={Number(freeBalance) === Number(asset.turnoverEndBalance) ? 'highlight-green' : ''}>
                                {convertToCurrency(freeBalance, asset.currency, 'RUB')}
                            </span>
                        </div>
                    </div>

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
                                    style={{ width: `${formattedTurnoverPercentage}%` }}
                                ></div>
                            </div>
                            <span className="modal-limit-value">{formattedTurnoverPercentage}%</span>
                            {showTurnoverTooltip && (
                                <div className="turnover-tooltip">
                                    Зачислено: {currentTurnoverIncoming.toFixed(2)} / Списано: {currentTurnoverOutgoing.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-section turnover-section">
                        <h3>Оборот за текущий месяц</h3>
                        <div className="turnover-table">
                            <div className="turnover-table-header">
                                <span>Баланс на начал.</span>
                                <span>Зачисления</span>
                                <span>Списания</span>
                                <span>Баланс на конец</span>
                            </div>
                            <div className="turnover-table-row">
                                <span>{asset.turnoverStartBalance.toFixed(2)}</span>
                                <span>{asset.turnoverIncoming.toFixed(2)}</span>
                                <span>{asset.turnoverOutgoing.toFixed(2)}</span>
                                <span>{asset.turnoverEndBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div className="modal-section main-requisite-block">
                        <h3>Основной реквизит</h3>
                        {mainRequisite && (
                            <div
                                className={`requisite-item ${isEditingRequisites ? 'editable' : ''}`}
                                draggable={isEditingRequisites}
                                onDragStart={(e) => handleDragStart(e, 0)}
                                onDragEnter={(e) => handleDragEnter(e, 0)}
                                onDragLeave={handleDragLeave}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                                onDragOver={allowDrop}
                            >
                                {isEditingRequisites && (
                                    <span className="drag-handle" title="Перетянуть">
                                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="9.5" cy="2.5" r="1.5"/>
                                            <circle cx="2.5" cy="10" r="1.5"/><circle cx="9.5" cy="10" r="1.5"/>
                                            <circle cx="2.5" cy="17.5" r="1.5"/><circle cx="9.5" cy="17.5" r="1.5"/>
                                        </svg>
                                    </span>
                                )}
                                {isEditingRequisites ? (
                                    <>
                                        <input
                                            type="text" name="label" value={mainRequisite.label}
                                            onChange={(e) => handleRequisiteChange(0, e)} placeholder="Название"
                                            className="requisite-input"
                                        />
                                        <input
                                            type="text" name="value" value={mainRequisite.value}
                                            onChange={(e) => handleRequisiteChange(0, e)} placeholder="Значение"
                                            className="requisite-input"
                                        />
                                        <button onClick={() => handleRemoveRequisite(0)} className="remove-requisite-icon-button">✖</button>
                                    </>
                                ) : (
                                    <>
                                        <label>{mainRequisite.label}</label>
                                        <span>{mainRequisite.value}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-section requisites-block">
                        <div className="requisites-header">
                            <h3>Дополнительные реквизиты</h3>
                            <div className="requisite-header-controls">
                               {isEditingRequisites && (
                                    <button onClick={handleAddRequisite} className="add-requisite-icon-button" title="Добавить реквизит">+</button>
                               )}
                                <button
                                    className="edit-requisite-button"
                                    onClick={isEditingRequisites ? handleRequisitesSave : () => setIsEditingRequisites(true)}
                                    title={isEditingRequisites ? "Сохранить реквизиты" : "Редактировать реквизиты"}
                                >
                                    {isEditingRequisites ? '💾' : '✎'}
                                </button>
                            </div>
                        </div>
                        {otherRequisites.length > 0 && (
                            <div className="other-requisites-list">
                                {otherRequisites.map((item, index) => {
                                    const originalIndex = index + 1;
                                    return (
                                        <div
                                            key={item.id || originalIndex}
                                            className={`requisite-item ${isEditingRequisites ? 'editable' : ''}`}
                                            draggable={isEditingRequisites}
                                            onDragStart={(e) => handleDragStart(e, originalIndex)}
                                            onDragEnter={(e) => handleDragEnter(e, originalIndex)}
                                            onDragLeave={handleDragLeave}
                                            onDragEnd={handleDragEnd}
                                            onDrop={handleDrop}
                                            onDragOver={allowDrop}
                                        >
                                            {isEditingRequisites && (
                                                <span className="drag-handle" title="Перетянуть">
                                                    <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="9.5" cy="2.5" r="1.5"/>
                                                        <circle cx="2.5" cy="10" r="1.5"/><circle cx="9.5" cy="10" r="1.5"/>
                                                        <circle cx="2.5" cy="17.5" r="1.5"/><circle cx="9.5" cy="17.5" r="1.5"/>
                                                    </svg>
                                                </span>
                                            )}
                                            {isEditingRequisites ? (
                                                <>
                                                    <input
                                                        type="text" name="label" value={item.label}
                                                        onChange={(e) => handleRequisiteChange(originalIndex, e)} placeholder="Название"
                                                        className="requisite-input"
                                                    />
                                                    <input
                                                        type="text" name="value" value={item.value}
                                                        onChange={(e) => handleRequisiteChange(originalIndex, e)} placeholder="Значение"
                                                        className="requisite-input"
                                                    />
                                                    <button onClick={() => handleRemoveRequisite(originalIndex)} className="remove-requisite-icon-button">✖</button>
                                                </>
                                            ) : (
                                                <>
                                                    <label>{item.label}</label>
                                                    <span>{item.value}</span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="modal-section edit-section">
                        <h3>Данные актива</h3>
                        <div className="edit-form">
                            <div className="form-row">
                                <label htmlFor="accountName" className="form-label">Наименование</label>
                                <input
                                    type="text"
                                    id="accountName"
                                    name="accountName"
                                    value={editableAsset.accountName}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row">
                                <label htmlFor="currency" className="form-label">Валюта</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={editableAsset.currency}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    {fields?.currency?.map((item, index) => {
                                        const value = typeof item === 'object' ? item.code || item.name : item;
                                        const display = typeof item === 'object' ? item.name : item;
                                        return <option key={index} value={value}>{display}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="type" className="form-label">Тип</label>
                                <select name="type" value={editableAsset.type} onChange={handleChange} className="form-input">
                                    {fields?.type?.map((item, index) => {
                                        const value = typeof item === 'object' ? item.code || item.name : item;
                                        const display = typeof item === 'object' ? item.name : item;
                                        return <option key={index} value={value}>{display}</option>;
                                    })}
                                </select>
                            </div>
                            
                            <div className="form-row">
                                <label htmlFor="paymentSystem" className="form-label">Платежная система</label>
                                <select name="paymentSystem" value={editableAsset.paymentSystem || ''} onChange={handleChange} className="form-input">
                                    <option value="">Не выбрано</option>
                                    {fields?.paymentSystem?.map((item, index) => {
                                        const value = typeof item === 'object' ? item.code || item.name : item;
                                        const display = typeof item === 'object' ? item.name : item;
                                        return <option key={index} value={value}>{display}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="design" className="form-label">Дизайн</label>
                                <select name="design" value={editableAsset.design} onChange={handleChange} className="form-input">
                                    <option value="">Не выбрано</option>
                                    {fields?.cardDesigns?.map((design, index) => (
                                        <option key={index} value={design.id}>
                                            {design.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <label htmlFor="employee" className="form-label">Сотрудник</label>
                                <select name="employee" value={editableAsset.employee} onChange={handleChange} className="form-input">
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.fullName}>
                                            {emp.fullName}
                                        </option>
                                    ))}
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