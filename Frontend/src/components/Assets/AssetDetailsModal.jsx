import React, { useState, useEffect, useRef } from 'react';
import '../../styles/AssetDetailsModal.css';

const AssetDetailsModal = ({ asset, onClose, onDelete, onDuplicate, onSave }) => {
    const [showPaymentSystem, setShowPaymentSystem] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [showTurnoverTooltip, setShowTurnoverTooltip] = useState(false);
    const [isEditingMainRequisite, setIsEditingMainRequisite] = useState(false);
    const [currentRequisites, setCurrentRequisites] = useState(asset.requisites || []);

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

    useEffect(() => {
        setCurrentRequisites(asset.requisites || []);
    }, [asset.requisites]);

    if (!asset || !exchangeRates) return null;

    const mainRequisite = currentRequisites.length > 0 ? currentRequisites[0] : null;
    const otherRequisites = currentRequisites.slice(1);

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

        if (fromCurrency === toCurrency) {
            return amount.toFixed(2);
        }

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

        const newRequisites = [...currentRequisites];
        const [movedItem] = newRequisites.splice(draggedIndex, 1);
        newRequisites.splice(droppedIndex, 0, movedItem);

        setCurrentRequisites(newRequisites);
        setIsEditingMainRequisite(false);
        
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const allowDrop = (e) => {
        e.preventDefault();
    };

    const handleSave = () => {
        onSave(asset.id, currentRequisites);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Актив "{asset.accountName}"</h2>
                    <div className="header-actions-right">
                        <span>{asset.currency}</span>
                        <div className="modal-header-actions">
                            <button className="options-button" onClick={handleMenuToggle}>
                                &#x22EF;
                            </button>
                            {showOptionsMenu && (
                                <div className="options-menu">
                                    <button className="menu-item" onClick={handleDuplicateClick}>Дублировать актив</button>
                                    <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить актив</button>
                                </div>
                            )}
                            <button className="modal-close-button" onClick={onClose}>&times;</button>
                        </div>
                    </div>
                </div>
                <div className="modal-body custom-scrollbar">
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

                    <div className="modal-buttons-group">
                        <button className="modal-button-outline">Дизайн карты</button>
                        <button className="modal-button-outline" onClick={() => setShowPaymentSystem(!showPaymentSystem)}>
                            Платежная система
                        </button>
                    </div>
                    {showPaymentSystem && (
                        <div className="payment-system-display">
                            <p><strong>Платежная система:</strong> {asset.type}</p>
                        </div>
                    )}

                    <div className="modal-section main-requisite-block">
                        <h3>Основной реквизит</h3>
                        {mainRequisite ? (
                            <div
                                className={`main-requisite-item ${isEditingMainRequisite ? 'editable' : ''}`}
                                draggable={isEditingMainRequisite}
                                onDragStart={(e) => handleDragStart(e, 0)}
                                onDragEnter={(e) => handleDragEnter(e, 0)}
                                onDragLeave={handleDragLeave}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                                onDragOver={allowDrop}
                            >
                                <label>{mainRequisite.label}</label>
                                <span>{mainRequisite.value}</span>
                                <button
                                    className="edit-requisite-button"
                                    onClick={() => setIsEditingMainRequisite(!isEditingMainRequisite)}
                                    title={isEditingMainRequisite ? "Завершить редактирование" : "Редактировать основной реквизит"}
                                >
                                    {isEditingMainRequisite ? '✖' : '✎'}
                                </button>
                            </div>
                        ) : (
                            <p>Основной реквизит не указан.</p>
                        )}
                    </div>

                    <div className="modal-section requisites-block">
                        <h3>Дополнительные реквизиты</h3>
                        {otherRequisites.length > 0 ? (
                            <div className="other-requisites-list">
                                {otherRequisites.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className={`other-requisite-item ${isEditingMainRequisite ? 'editable' : ''}`}
                                        draggable={isEditingMainRequisite}
                                        onDragStart={(e) => handleDragStart(e, index + 1)}
                                        onDragEnter={(e) => handleDragEnter(e, index + 1)}
                                        onDragLeave={handleDragLeave}
                                        onDragEnd={handleDragEnd}
                                        onDrop={handleDrop}
                                        onDragOver={allowDrop}
                                    >
                                        <label>{item.label}</label>
                                        <span>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Дополнительные реквизиты не указаны.</p>
                        )}
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
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-button" onClick={onClose}>Отменить</button>
                    <button className="modal-save-button" onClick={handleSave}>Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailsModal;