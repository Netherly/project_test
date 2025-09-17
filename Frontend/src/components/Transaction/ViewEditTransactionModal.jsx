import React, { useState, useEffect, useMemo, useRef } from "react";
import "../../styles/ViewEditTransactionModal.css";
import ConfirmationModal from '../modals/confirm/ConfirmationModal'; 

const generateId = (prefix) => {
    return prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
};


const ViewEditTransactionModal = ({ transaction, onUpdate, onClose, onDelete, onDuplicate, assets, financeFields, orders = [], counterparties = [] }) => {
    const formattedDate = transaction.date ? transaction.date.replace(" ", "T") : "";
    const originalTransactionRef = useRef(transaction);

    const [formData, setFormData] = useState({
        id: transaction.id,
        date: formattedDate,
        category: transaction.category || "",
        subcategory: transaction.subcategory || "",
        description: transaction.description || "",
        account: transaction.account || "", 
        accountCurrency: transaction.accountCurrency || "UAH",
        operation: transaction.operation || "Зачисление",
        amount: transaction.amount || "",
        commission: transaction.commission || "",
        counterparty: transaction.counterparty || "",
        counterpartyRequisites: transaction.counterpartyRequisites || "",
        orderId: transaction.orderId || "",
        orderNumber: transaction.orderNumber || "",
        orderCurrency: transaction.orderCurrency || "",
        sumUAH: transaction.sumUAH || "",
        sumUSD: transaction.sumUSD || "",
        sumRUB: transaction.sumRUB || "",
        sumByRatesOrderAmountCurrency: transaction.sumByRatesOrderAmountCurrency || "",
        sumByRatesUAH: transaction.sumByRatesUAH || "",
        sumByRatesUSD: transaction.sumByRatesUSD || "",
        sumByRatesRUB: transaction.sumByRatesRUB || "",
        sentToCounterparty: transaction.sentToCounterparty || false,
        sendLion: transaction.sendLion || false,
    });
    

    const [currentRates, setCurrentRates] = useState(null);
    const [showCommissionField, setShowCommissionField] = useState(false);
    const [showOrderBlock, setShowOrderBlock] = useState(false);
    const [showSecondAccountBlock, setShowSecondAccountBlock] = useState(transaction.category === "Смена счета");
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




    useEffect(() => {
      try {
        const savedRates = localStorage.getItem("currencyRates");
        if (savedRates) {
          const rates = JSON.parse(savedRates);
          if (rates && rates.length > 0) {
            setCurrentRates(rates[0]);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки курсов из localStorage:", error);
      }
    }, []);

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        if (!currentRates || !amount || isNaN(amount) || amount === 0) {
            return "";
        }

        if (fromCurrency === toCurrency) {
            return amount.toFixed(2);
        }

        const rateKey = `${fromCurrency}_${toCurrency}`;
        const reverseRateKey = `${toCurrency}_${fromCurrency}`;

        let rate = currentRates[rateKey];

        if (rate === undefined && currentRates[reverseRateKey] !== undefined) {
            rate = 1 / currentRates[reverseRateKey];
        }

        if (rate === undefined) {
            console.warn(`Курс для ${fromCurrency} -> ${toCurrency} не найден.`);
            return "";
        }

        return (amount * rate).toFixed(2);
    };

    useEffect(() => {
        const amount = parseFloat(formData.amount);
        const currency = formData.accountCurrency;

        if (amount && currentRates && currency) {
            setFormData(prevData => ({
                ...prevData,
                sumUAH: convertCurrency(amount, currency, "UAH"),
                sumUSD: convertCurrency(amount, currency, "USD"),
                sumRUB: convertCurrency(amount, currency, "RUB"),
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                sumUAH: "",
                sumUSD: "",
                sumRUB: "",
            }));
        }
    }, [formData.amount, formData.accountCurrency, currentRates]);


    useEffect(() => {
        setShowCommissionField(formData.category === "Смена счета" && parseFloat(formData.amount) > 0);
        setShowOrderBlock(!!formData.orderNumber);
        setShowSecondAccountBlock(formData.category === "Смена счета");
    }, [formData.category, formData.amount, formData.orderNumber]);
    
    
    const hasUnsavedChanges = () => {
        const currentData = { ...formData, date: formData.date.replace("T", " ") };
        const originalData = { ...originalTransactionRef.current, date: originalTransactionRef.current.date };

        for (const key in originalData) {
            if (key in currentData) {
                if (key === "date") {
                    
                    if (new Date(currentData[key]).setSeconds(0,0) !== new Date(originalData[key]).setSeconds(0,0)) {
                        return true;
                    }
                } else if (key === "amount" || key === "commission") {
                    if (parseFloat(currentData[key]) !== parseFloat(originalData[key])) {
                        return true;
                    }
                } else if (currentData[key] !== originalData[key]) {
                    return true;
                }
            }
        }
        return false;
    };


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === "checkbox" ? checked : value;

        let newFormData = { ...formData, [name]: newValue };

        if (name === "category") {
            newFormData.subcategory = "";
            if (value === "Смена счета") {
                setShowSecondAccountBlock(true);
                newFormData.operation = "Списание";
            } else {
                setShowSecondAccountBlock(false);
            }
        }

        if (name === "account") {
            const selectedAccount = assets.find(acc => acc.id === newValue);
            if (selectedAccount) {
                newFormData.accountCurrency = selectedAccount.currency;
            }
        }

        if (name === "counterparty") {
            const selectedCounterparty = counterparties.find(cp => cp.name === newValue);
            let requisitesString = "";

            if (selectedCounterparty && selectedCounterparty.requisites) {
               
                const requisitesForCurrency = selectedCounterparty.requisites[newFormData.accountCurrency];

                if (requisitesForCurrency && requisitesForCurrency.length > 0) {
                    
                    requisitesString = requisitesForCurrency
                        .map(req => `${req.bank}: ${req.card}`)
                        .join(', ');
                } else {
                    
                    const firstAvailableCurrency = Object.keys(selectedCounterparty.requisites)[0];
                    if (firstAvailableCurrency) {
                        const firstRequisites = selectedCounterparty.requisites[firstAvailableCurrency];
                        if (firstRequisites && firstRequisites.length > 0) {
                           requisitesString = firstRequisites
                             .map(req => `${req.bank}: ${req.card}`)
                             .join(', ');
                        }
                    }
                }
            }
            newFormData.counterpartyRequisites = requisitesString;
        }

        if (name === "amount" || name === "category") {
            const currentAmount = parseFloat(name === "amount" ? newValue : newFormData.amount);
            const currentCategory = name === "category" ? newValue : newFormData.category;
            setShowCommissionField(currentCategory === "Смена счета" && currentAmount > 0);
        }

        if (name === "orderNumber") {
            if (newValue) { 
                const selectedOrder = orders.find(order => String(order.id) === newValue);
                if (selectedOrder) {
                    
                    newFormData.orderId = selectedOrder.id;
                    newFormData.orderCurrency = selectedOrder.currency; 
                    newFormData.sumByRatesOrderAmountCurrency = selectedOrder.amount; 
                    newFormData.sumByRatesUAH = convertCurrency(selectedOrder.amount, selectedOrder.currency, "UAH");
                    newFormData.sumByRatesUSD = convertCurrency(selectedOrder.amount, selectedOrder.currency, "USD");
                    newFormData.sumByRatesRUB = convertCurrency(selectedOrder.amount, selectedOrder.currency, "RUB");
                }
            } else {
                newFormData.orderId = "";
                newFormData.orderNumber = "";
                newFormData.orderCurrency = "";
                newFormData.sumByRatesOrderAmountCurrency = "";
                newFormData.sumByRatesUAH = "";
                newFormData.sumByRatesUSD = "";
                newFormData.sumByRatesRUB = "";
            }
        }

        setFormData(newFormData);
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedTransaction = {
            id: formData.id,
            date: formData.date.replace("T", " "),
            category: formData.category,
            subcategory: formData.subcategory,
            description: formData.description,
            account: formData.account,
            accountCurrency: formData.accountCurrency,
            operation: formData.operation,
            amount: parseFloat(formData.amount),
            commission: showCommissionField ? parseFloat(formData.commission || 0) : 0,
            counterparty: formData.counterparty,
            counterpartyRequisites: formData.counterpartyRequisites,
            orderId: formData.orderId,
            orderNumber: formData.orderNumber,
            orderCurrency: formData.orderCurrency,
            sumUAH: parseFloat(formData.sumUAH) || 0,
            sumUSD: parseFloat(formData.sumUSD) || 0,
            sumRUB: parseFloat(formData.sumRUB) || 0,
            sumByRatesOrderAmountCurrency: parseFloat(formData.sumByRatesOrderAmountCurrency) || 0,
            sumByRatesUAH: parseFloat(formData.sumByRatesUAH) || 0,
            sumByRatesUSD: parseFloat(formData.sumByRatesUSD) || 0,
            sumByRatesRUB: parseFloat(formData.sumByRatesRUB) || 0,
            sentToCounterparty: formData.sentToCounterparty,
            sendLion: formData.sendLion,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
        };

        onUpdate(updatedTransaction);
    };

    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
        setShowOptionsMenu(false);
    };

    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete(transaction.id);
        }
        setShowDeleteConfirmation(false);
        onClose();
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleDuplicateClick = () => {
        if (onDuplicate) {
            onDuplicate(transaction);
        }
        onClose();
        setShowOptionsMenu(false);
    };

    
    const handleCloseModal = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedChangesConfirmation(true);
        } else {
            onClose();
        }
    };

    const handleConfirmUnsavedChanges = () => {
        setShowUnsavedChangesConfirmation(false);
        onClose();
    };

    const handleCancelUnsavedChanges = () => {
        setShowUnsavedChangesConfirmation(false);
    };


    return (
        <div className="add-transaction-overlay" onClick={handleCloseModal}>
            <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-transaction-header">
                    <h2>Редактировать транзакцию</h2>
                    <div className="add-transaction-actions">
                             <button className="options-button" onClick={handleMenuToggle}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                             </button>
                             {showOptionsMenu && (
                                 <div className="options-menu">
                                     <button className="menu-item" onClick={handleDuplicateClick}>Дублировать транзакцию</button>
                                     <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить транзакцию</button>
                                 </div>
                             )}
                             <span className="icon" onClick={handleCloseModal}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                             </span>
                         </div>
                </div>

                <form onSubmit={handleSubmit} className="add-transaction-form">
                    <div className="form-row">
                        <label htmlFor="date" className="form-label">Дата и время операции</label>
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>

                    
                    <div className="form-row">
                        <label htmlFor="category" className="form-label">Статья</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="form-input"
                        >
                            <option value="" disabled>Выберите статью</option>
                            {financeFields?.articles?.map((article, index) => (
                                <option key={index} value={article.articleValue}>
                                    {article.articleValue}
                                </option>
                            ))}
                            {!financeFields?.articles?.some(a => a.articleValue === "Смена счета") && (
                                <option value="Смена счета">Смена счета</option>
                            )}
                        </select>
                    </div>

                    
                    {availableSubcategories.length > 0 && (
                        <div className="form-row">
                            <label htmlFor="subcategory" className="form-label">Подстатья</label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="">Выберите подстатью</option>
                                {availableSubcategories.map((sub, index) => (
                                    <option key={index} value={sub.subarticleValue}>
                                        {sub.subarticleValue}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-row">
                        <label htmlFor="description" className="form-label">Описание</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Введите описание"
                            className="form-input"
                        />
                    </div>

                    
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">
                            Счет {formData.accountCurrency && `(${formData.accountCurrency})`}
                        </label>
                        <div className="currency-select-wrapper">
                            <select
                                id="account"
                                name="account"
                                value={formData.account}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="">Выберите счет</option>
                                {assets?.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.accountName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    
                    <div className="form-row">
                            <label htmlFor="operation" className="form-label">
                                Операция
                            </label>
                            <select
                                id="operation"
                                name="operation"
                                value={formData.operation}
                                onChange={handleChange}
                                required
                                className="form-input"
                                disabled={showSecondAccountBlock}
                            >
                                <option value="Зачисление">Зачисление</option>
                                <option value="Списание">Списание</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="amount" className="form-label">
                                Сумма операции
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="Введите сумму"
                                required
                                step="0.01"
                                className="form-input"
                            />
                        </div>

                        {formData.amount && (
                            <div className="currency-recalculation-block">
                                <div className="form-row">
                                    <label className="form-label">Сумма операции (₴)</label>
                                    <span className="form-value readonly">{formData.sumUAH}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма операции ($)</label>
                                    <span className="form-value readonly">{formData.sumUSD}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма операции (руб)</label>
                                    <span className="form-value readonly">{formData.sumRUB}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label small-label">Пересчет согласно текущим курсам</label>
                                    <span className="form-value"></span>
                                </div>
                            </div>
                        )}

                        {showCommissionField && (
                            <div className="form-row">
                                <label htmlFor="commission" className="form-label">
                                    Комиссия
                                </label>
                                <input
                                    type="number"
                                    id="commission"
                                    name="commission"
                                    value={formData.commission}
                                    onChange={handleChange}
                                    placeholder="Введите комиссию"
                                    step="0.01"
                                    className="form-input"
                                />
                            </div>
                        )}

                        {showSecondAccountBlock && (
                            <div className="form-row duplicated-account-block">
                            </div>
                        )}

                        <div className="form-row">
                            <label htmlFor="counterparty" className="form-label">
                                Контрагент
                            </label>
                            <select
                                id="counterparty"
                                name="counterparty"
                                value={formData.counterparty}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">Выберите контрагента</option>
                                {counterparties.map((cp) => (
                                    <option key={`${cp.type}-${cp.id}`} value={cp.name}>
                                        {cp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <label htmlFor="counterpartyRequisites" className="form-label">
                                Реквизиты контрагента
                            </label>
                            <input
                                type="text"
                                id="counterpartyRequisites"
                                name="counterpartyRequisites"
                                value={formData.counterpartyRequisites}
                                readOnly
                                className="form-input readonly"
                            />
                        </div>

                        <div className="form-row">
                            <label htmlFor="orderNumber" className="form-label">
                                № заказа
                            </label>
                            <select
                                id="orderNumber"
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">Выберите номер заказа</option>
                                {orders.map(order => (
                                    <option key={order.id} value={order.number}>
                                        {order.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {showOrderBlock && (
                            <div className="order-details-block">
                                <div className="form-row">
                                    <label className="form-label">ID заказа</label>
                                    <span className="form-value readonly">{formData.orderId}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Валюта заказа</label>
                                    <span className="form-value readonly">{formData.orderCurrency}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма по курсам заказа в валюте заказа</label>
                                    <span className="form-value readonly">{formData.sumByRatesOrderAmountCurrency}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма по курсам заказа в гривне</label>
                                    <span className="form-value readonly">{formData.sumByRatesUAH}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма по курсам заказа в долларах</label>
                                    <span className="form-value readonly">{formData.sumByRatesUSD}</span>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Сумма по курсам заказа в рублях</label>
                                    <span className="form-value readonly">{formData.sumByRatesRUB}</span>
                                </div>
                            </div>
                        )}

                        <div className="form-row checkbox-row">
                            <label htmlFor="sentToCounterparty" className="form-label">
                                Отправлено контрагенту
                            </label>
                            <input
                                type="checkbox"
                                id="sentToCounterparty"
                                name="sentToCounterparty"
                                checked={formData.sentToCounterparty}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                        </div>

                        <div className="form-row second-checkbox-row">
                            <label htmlFor="sendLion" className="form-label">
                                Отправить 🦁
                            </label>
                            <input
                                type="checkbox"
                                id="sendLion"
                                name="sendLion"
                                checked={formData.sendLion}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                        </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={handleCloseModal}>
                            Отменить
                        </button>
                        <button type="submit" className="save-button">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
            
            {showDeleteConfirmation && (
                <ConfirmationModal
                    title="Подтверждение удаления"
                    message={`Вы уверены, что хотите удалить транзакцию с ID "${transaction.id}"? Это действие необратимо.`}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
            
            {showUnsavedChangesConfirmation && (
                <ConfirmationModal
                    title="Несохраненные изменения"
                    message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
                    confirmText="Закрыть без сохранения"
                    cancelText="Отмена"
                    onConfirm={handleConfirmUnsavedChanges}
                    onCancel={handleCancelUnsavedChanges}
                />
            )}
        </div>
    );
};

export default ViewEditTransactionModal;