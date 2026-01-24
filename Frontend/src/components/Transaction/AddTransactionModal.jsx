import React, { useState, useEffect, useMemo } from "react";
import "../../styles/AddTransactionModal.css";
import ConfirmationModal from '../modals/confirm/ConfirmationModal';
import { Plus, X } from 'lucide-react';
import { createTransaction } from '../../api/transactions';

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

const generateId = (prefix) => {
    return prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
};

const AddTransactionModal = ({ onAdd, onClose, assets, financeFields, initialData = {}, orders = [], counterparties = [] }) => {

    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const defaultCategory = useMemo(() => {
        if (financeFields?.articles && financeFields.articles.length > 0) {
            return getArticleValue(financeFields.articles[0]);
        }
        return "";
    }, [financeFields]);

    const initialFormData = useMemo(() => ({
        date: getCurrentDateTime(),
        category: defaultCategory,
        subcategory: "",
        description: "",
        account: "",
        accountCurrency: "",
        operation: "Зачисление",
        amount: "",
        commission: "",
        counterparty: "",
        counterpartyRequisites: "",
        orderId: "", 
        orderNumber: "", 
        orderCurrency: "",
        sumUAH: "",
        sumUSD: "",
        sumRUB: "",
        sumByRatesOrderAmountCurrency: "",
        sumByRatesUAH: "",
        sumByRatesUSD: "",
        sumByRatesRUB: "",
        sentToCounterparty: false,
        sendLion: false,
        id: generateId("TRX_"),
        ...initialData,
    }), [defaultCategory, initialData]);


    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (!formData.category && defaultCategory) {
            setFormData(prev => ({ ...prev, category: defaultCategory }));
        }
    }, [defaultCategory]);

    useEffect(() => {
        setShowOrderBlock(Boolean(formData.orderId));
    }, [formData.orderId]);

    const [isLoading, setIsLoading] = useState(false);
    const [currentRates, setCurrentRates] = useState(null);
    const [showCommissionField, setShowCommissionField] = useState(false);
    const [showOrderBlock, setShowOrderBlock] = useState(false);
    const [destinationAccounts, setDestinationAccounts] = useState([{
        id: generateId("DEST_"),
        account: "",
        accountCurrency: "",
        amount: "",
        commission: "",
        operation: "Зачисление",
    }]);
    const [showDestinationAccountsBlock, setShowDestinationAccountsBlock] = useState(false);

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
            return "";
        }
        return (amount * rate).toFixed(2);
    };

    const formatRequisite = (req) => {
        const text = String(req?.text ?? req?.value ?? "").trim();
        if (text) return text;
        const bank = String(req?.bank ?? "").trim();
        const card = String(req?.card ?? "").trim();
        const owner = String(req?.owner ?? req?.holder ?? "").trim();
        if (bank && card) return `${bank}: ${card}`;
        if (bank) return bank;
        if (card) return card;
        if (owner) return owner;
        return "";
    };

    const getRequisitesString = (counterpartyName, currency, counterpartiesList) => {
        if (!counterpartyName) {
            return "";
        }
        const selectedCounterparty = counterpartiesList.find(cp => cp.name === counterpartyName);
        if (!selectedCounterparty || !selectedCounterparty.requisites) {
            return "";
        }
        let requisitesString = "";
        const requisitesForCurrency = selectedCounterparty.requisites[currency];
        if (requisitesForCurrency && requisitesForCurrency.length > 0) {
            requisitesString = requisitesForCurrency
                .map(formatRequisite)
                .filter(Boolean)
                .join(', ');
        } else {
            const firstAvailableCurrency = Object.keys(selectedCounterparty.requisites)[0];
            if (firstAvailableCurrency) {
                const firstRequisites = selectedCounterparty.requisites[firstAvailableCurrency];
                if (firstRequisites && firstRequisites.length > 0) {
                    requisitesString = firstRequisites
                        .map(formatRequisite)
                        .filter(Boolean)
                        .join(', ');
                }
            }
        }
        return requisitesString;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === "checkbox" ? checked : value;
        let newFormData = { ...formData, [name]: newValue };

        setHasUnsavedChanges(true);

        if (name === "category") {
            newFormData.subcategory = "";
            if (value === "Смена счета") {
                setShowDestinationAccountsBlock(true);
                newFormData.operation = "Списание";
                setDestinationAccounts([{
                    id: generateId("DEST_"),
                    account: "",
                    accountCurrency: "",
                    amount: "",
                    commission: "",
                    operation: "Зачисление",
                }]);
            } else {
                setShowDestinationAccountsBlock(false);
            }
        }

        if (name === "account") {
            const selectedAccount = assets.find(acc => acc.id === newValue);
            const newCurrency = selectedAccount ? selectedAccount.currency : "UAH";
            newFormData.accountCurrency = newCurrency;
            newFormData.counterpartyRequisites = getRequisitesString(newFormData.counterparty, newCurrency, counterparties);
        }
        
        if (name === "counterparty") {
            newFormData.counterpartyRequisites = getRequisitesString(newValue, newFormData.accountCurrency, counterparties);
        }

        if (name === "amount" || name === "category") {
            const currentAmount = parseFloat(name === "amount" ? newValue : newFormData.amount);
            const currentCategory = name === "category" ? newValue : newFormData.category;
            setShowCommissionField(currentCategory === "Смена счета" && currentAmount > 0);
        }

        if (name === "amount" || name === "account") {
            const currentAmount = parseFloat(name === "amount" ? newValue : newFormData.amount);
            const currentCurrency = name === "account" ? (assets.find(acc => acc.id === newValue)?.currency || "UAH") : newFormData.accountCurrency;
            if (currentAmount && currentRates && currentCurrency) {
                newFormData.sumUAH = convertCurrency(currentAmount, currentCurrency, "UAH");
                newFormData.sumUSD = convertCurrency(currentAmount, currentCurrency, "USD");
                newFormData.sumRUB = convertCurrency(currentAmount, currentCurrency, "RUB");
            } else {
                newFormData.sumUAH = "";
                newFormData.sumUSD = "";
                newFormData.sumRUB = "";
            }
        }
        
        if (name === "orderId" || name === "orderNumber") { 
            if (newValue) {
                const selectedOrder = orders.find(order => String(order.id) === String(newValue));
                const orderCurrency =
                    selectedOrder?.currency?.code ||
                    selectedOrder?.currency?.name ||
                    selectedOrder?.currency ||
                    "";
                const orderAmount =
                    selectedOrder?.amount ??
                    selectedOrder?.price ??
                    0;

                if (selectedOrder) {
                    newFormData = {
                        ...newFormData,
                        orderId: selectedOrder.id,
                        orderNumber: selectedOrder.numberOrder ?? String(selectedOrder.orderSequence ?? selectedOrder.id),
                        orderCurrency,
                        sumByRatesOrderAmountCurrency: orderAmount,
                        sumByRatesUAH: convertCurrency(orderAmount, orderCurrency, "UAH"),
                        sumByRatesUSD: convertCurrency(orderAmount, orderCurrency, "USD"),
                        sumByRatesRUB: convertCurrency(orderAmount, orderCurrency, "RUB"),
                    };
                }
                setShowOrderBlock(Boolean(selectedOrder));
            } else {
                setShowOrderBlock(false);
                newFormData = {
                    ...newFormData,
                    orderId: "",
                    orderNumber: "",
                    orderCurrency: "",
                    sumByRatesOrderAmountCurrency: "",
                    sumByRatesUAH: "",
                    sumByRatesUSD: "",
                    sumByRatesRUB: "",
                };
            }
        }

        setFormData(newFormData);
    };


    const handleDestinationAccountChange = (e, id) => {
        const { name, value } = e.target;
        setDestinationAccounts(prevAccounts =>
            prevAccounts.map(account => {
                if (account.id === id) {
                    const newAccountData = { ...account, [name]: value };
                    if (name === "account") {
                        const selectedAccount = assets.find(acc => acc.id === value);
                        newAccountData.accountCurrency = selectedAccount ? selectedAccount.currency : "UAH";
                    }
                    return newAccountData;
                }
                return account;
            })
        );
        setHasUnsavedChanges(true);
    };


    const addDestinationAccount = () => {
        if (destinationAccounts.length < 5) {
            setDestinationAccounts(prevAccounts => [
                ...prevAccounts,
                { id: generateId("DEST_"), account: "", accountCurrency: "", amount: "", commission: "",  operation: "Зачисление" }
            ]);
        }
        setHasUnsavedChanges(true);
    };


    const removeDestinationAccount = (id) => {
        setDestinationAccounts(prevAccounts => prevAccounts.filter(account => account.id !== id));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        let newTransactions = [];
        
        const orderIdStr = formData.orderId ? String(formData.orderId) : null;
        const orderNumberStr = formData.orderNumber ? String(formData.orderNumber) : null;

        if (formData.category === "Смена счета") {
            const totalAmountFromDestinations = destinationAccounts.reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0);
            const sourceCommission = parseFloat(formData.commission || 0);
            const sourceAccountName = assets.find(a => a.id === formData.account)?.accountName || 'счета';
            const destinationAccountNames = destinationAccounts.map(acc => assets.find(a => a.id === acc.account)?.accountName).filter(Boolean).join(', ');
            
            const sourceTransaction = {
                date: formData.date.replace("T", " "),
                category: formData.category,
                subcategory: formData.subcategory || "",
                description: `Перевод на: ${destinationAccountNames}`,
                accountId: formData.account, 
                accountCurrency: formData.accountCurrency,
                operation: "WITHDRAW",
                amount: totalAmountFromDestinations,
                commission: sourceCommission,
                counterparty: formData.counterparty || "",
                counterpartyRequisites: formData.counterpartyRequisites || "",
                orderId: orderIdStr,
                orderNumber: orderNumberStr,
                orderCurrency: formData.orderCurrency || null,
                sumUAH: parseFloat(formData.sumUAH) || 0,
                sumUSD: parseFloat(formData.sumUSD) || 0,
                sumRUB: parseFloat(formData.sumRUB) || 0,
                sumByRatesOrderAmountCurrency: parseFloat(formData.sumByRatesOrderAmountCurrency) || 0,
                sumByRatesUAH: parseFloat(formData.sumByRatesUAH) || 0,
                sumByRatesUSD: parseFloat(formData.sumByRatesUSD) || 0,
                sumByRatesRUB: parseFloat(formData.sumByRatesRUB) || 0,
                sentToCounterparty: formData.sentToCounterparty,
                sendLion: formData.sendLion,
            };
            newTransactions.push(sourceTransaction);
            
            destinationAccounts.forEach(destAcc => {
                const destinationTransaction = {
                    date: formData.date.replace("T", " "),
                    category: formData.category,
                    subcategory: formData.subcategory || "",
                    description: `Перевод со счета: ${sourceAccountName}`,
                    accountId: destAcc.account,
                    operation: destAcc.operation === "Зачисление" ? "DEPOSIT" : "WITHDRAW",
                    amount: parseFloat(destAcc.amount || 0),
                    commission: parseFloat(destAcc.commission || 0),
                    counterparty: formData.counterparty || "",
                    counterpartyRequisites: formData.counterpartyRequisites || "",
                    orderId: orderIdStr,
                    orderNumber: orderNumberStr,
                    orderCurrency: formData.orderCurrency || null,
                    sumUAH: 0,
                    sumUSD: 0,
                    sumRUB: 0,
                    sumByRatesOrderAmountCurrency: 0,
                    sumByRatesUAH: 0,
                    sumByRatesUSD: 0,
                    sumByRatesRUB: 0,
                    sentToCounterparty: formData.sentToCounterparty,
                    sendLion: formData.sendLion,
                };
                newTransactions.push(destinationTransaction);
            });
        } else {
            const newTransactionBase = {
                date: formData.date.replace("T", " "),
                category: formData.category,
                subcategory: formData.subcategory || "",
                description: formData.description || "",
                accountId: formData.account,
                accountCurrency: formData.accountCurrency,
                operation: formData.operation === "Зачисление" ? "DEPOSIT" : "WITHDRAW",
                amount: parseFloat(formData.amount || 0),
                commission: showCommissionField ? parseFloat(formData.commission || 0) : 0,
                counterparty: formData.counterparty || "",
                counterpartyRequisites: formData.counterpartyRequisites || "",
                
                orderId: orderIdStr,
                orderNumber: orderNumberStr,
                orderCurrency: formData.orderCurrency || null,
                
                sumUAH: parseFloat(formData.sumUAH) || 0,
                sumUSD: parseFloat(formData.sumUSD) || 0,
                sumRUB: parseFloat(formData.sumRUB) || 0,
                sumByRatesOrderAmountCurrency: parseFloat(formData.sumByRatesOrderAmountCurrency) || 0,
                sumByRatesUAH: parseFloat(formData.sumByRatesUAH) || 0,
                sumByRatesUSD: parseFloat(formData.sumByRatesUSD) || 0,
                sumByRatesRUB: parseFloat(formData.sumByRatesRUB) || 0,
                
                sentToCounterparty: formData.sentToCounterparty,
                sendLion: formData.sendLion,
            };
            newTransactions.push(newTransactionBase);
        }
        
        try {
            const createdTransactions = [];
            for (const trx of newTransactions) {
                const created = await createTransaction(trx);
                createdTransactions.push(created);
            }
            onAdd(createdTransactions);
            setHasUnsavedChanges(false);
            onClose();
        } catch (error) {
            console.error("ОШИБКА handleSubmit:", error);
        } finally {
            setIsLoading(false);
        }
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
                    <h2>Добавить транзакцию</h2>
                    <div className="add-transaction-actions">
                        <span className="icon" onClick={handleOverlayClose}>
                            <X size={24} color="white" />
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-transaction-form custom-scrollbar">
                    {/* ... (Форма осталась прежней, логика внутри исправлена в handleSubmit) ... */}
                    <div className="form-row">
                         <label htmlFor="date" className="form-label">
                             Дата и время
                         </label>
                         <input
                             type="datetime-local"
                             id="date"
                             name="date"
                             value={formData.date}
                             onChange={handleChange}
                             required
                             className="form-input1"
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
                            className="form-input1"
                        >
                            <option value="" disabled>Выберите статью</option>
                            {financeFields?.articles
                                ?.map((article) => ({
                                    id: article?.id,
                                    value: getArticleValue(article),
                                }))
                                .filter((article) => article.value)
                                .map((article) => (
                                    <option key={article.id || article.value} value={article.value}>
                                        {article.value}
                                    </option>
                                ))}
                            {!financeFields?.articles?.some((a) => getArticleValue(a) === "Смена счета") && (
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
                                className="form-input1"
                            >
                                <option value="">Выберите подстатью</option>
                                {availableSubcategories
                                    .map((sub) => ({
                                        id: sub?.id,
                                        value: getSubarticleValue(sub),
                                    }))
                                    .filter((sub) => sub.value)
                                    .map((sub, index) => (
                                        <option key={sub.id || index} value={sub.value}>
                                            {sub.value}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div className="form-row">
                        <label htmlFor="description" className="form-label">
                            Описание
                        </label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Введите описание"
                            className="form-input1"
                        />
                    </div>
                    
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">
                            {showDestinationAccountsBlock ? "Счет списания" : "Счет"} 
                            {formData.account && formData.accountCurrency && ` (${formData.accountCurrency})`}
                        </label>
                        <select
                            id="account"
                            name="account"
                            value={formData.account}
                            onChange={handleChange}
                            required
                            className="form-input1"
                        >
                            <option value="">Выберите счет</option>
                            {assets?.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label htmlFor="operation" className="form-label">Операция</label>
                        <select
                            id="operation"
                            name="operation"
                            value={formData.operation}
                            onChange={handleChange}
                            required
                            className="form-input1"
                            disabled={showDestinationAccountsBlock} 
                        >
                            <option value="Зачисление">Зачисление</option>
                            <option value="Списание">Списание</option>
                        </select>
                    </div>
                    
                    <div className="form-row">
                        <label htmlFor="amount" className="form-label">Сумма</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Введите сумму"
                            required
                            className="form-input1" 
                            step="0.01"
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="commission" className="form-label">Комиссия</label>
                        <input
                            type="number"
                            id="commission"
                            name="commission"
                            value={formData.commission}
                            onChange={handleChange}
                            placeholder="Введите комиссию"
                            step="0.01"
                            className="form-input1"
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
                    
                    {showDestinationAccountsBlock && (
                    <>
                        {destinationAccounts.map((destAcc, index) => (
                            <div className="duplicated-account-block" key={destAcc.id}>
                                <div className="form-row flex-row">
                                    <label htmlFor={`dest-account-${destAcc?.id}`} className="form-label">
                                            {index === destinationAccounts.length - 1 ? 'Счет зачисления' : 'Счет'}
                                            {destAcc?.id && destAcc.accountCurrency ? ` (${destAcc.accountCurrency})` : ''}
                                    </label>
                                    <div className="input-with-actions">
                                            <select
                                                id={`dest-account-${destAcc.id}`}
                                                name="account"
                                                value={destAcc.account}
                                                onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                                required
                                                className="form-input1"
                                            >
                                                <option value="">Выберите счет</option>
                                                {assets?.map((acc) => (
                                                    <option key={`dest-acc-${destAcc.id}-${acc.id}`} value={acc.id}>{acc.accountName}</option>
                                                ))}
                                            </select>
                                    </div>
                                </div>
                                {/* ... остальные поля смены счета ... */}
                                <div className="form-row">
                                    <label htmlFor={`dest-operation-${destAcc.id}`} className="form-label">Операция</label>
                                    <select
                                        id={`dest-operation-${destAcc.id}`}
                                        name="operation"
                                        value={destAcc.operation}
                                        onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                        className="form-input1"
                                    >
                                        <option value="Зачисление">Зачисление</option>
                                        <option value="Списание">Списание</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label htmlFor={`dest-amount-${destAcc.id}`} className="form-label">Сумма</label>
                                    <input
                                        type="number"
                                        id={`dest-amount-${destAcc.id}`}
                                        name="amount"
                                        value={destAcc.amount}
                                        onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                        placeholder="Введите сумму"
                                        required
                                        step="0.01"
                                        className="form-input1"
                                    />
                                </div>
                                <div className="form-row">
                                    <label htmlFor={`dest-commission-${destAcc.id}`} className="form-label">Комиссия</label>
                                    <input
                                        type="number"
                                        id={`dest-commission-${destAcc.id}`}
                                        name="commission"
                                        value={destAcc.commission}
                                        onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                        placeholder="Введите комиссию"
                                        step="0.01"
                                        className="form-input1"
                                    />
                                </div>
                                 <div className="destination-account-actions">
                                    {index === destinationAccounts.length - 1 && destinationAccounts.length < 5 ? (
                                        <button
                                            type="button"
                                            onClick={addDestinationAccount}
                                            className="transaction-action-button add-button"
                                        >
                                            <Plus size={24} />
                                            <span>Добавить</span>
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    {destinationAccounts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDestinationAccount(destAcc.id)}
                                            className="transaction-action-button remove-button"
                                        >
                                            <X size={24} />
                                            <span>Удалить</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                    )}

                    <div className="form-row counterparty-section-start">
                        <label htmlFor="counterparty" className="form-label">
                            Контрагент
                        </label>
                        <select
                            id="counterparty"
                            name="counterparty"
                            value={formData.counterparty}
                            onChange={handleChange}
                            className="form-input1"
                        >
                            <option value="">Выберите контрагента</option>
                            {counterparties.map((cp) => {
                                const typeLabel = cp.type === "employee" ? "сотрудник" : "клиент";
                                return (
                                    <option key={`${cp.type}-${cp.id}`} value={cp.name}>
                                        {cp.name} ({typeLabel})
                                    </option>
                                );
                            })}
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
                            className="form-input1 readonly"
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="orderId" className="form-label">
                            № заказа
                        </label>
                        <select
                            id="orderId"
                            name="orderId"
                            value={formData.orderId || ""}
                            onChange={handleChange}
                            className="form-input1"
                        >
                            <option value="">Выберите номер заказа</option>
                            {orders.map(order => {
                                const orderLabel = order.numberOrder ?? order.orderSequence ?? order.id;
                                const clientLabel = order.clientName || order.name;
                                const typeLabel = order.orderSequence != null ? "заказ" : "заявка";
                                const baseLabel = clientLabel ? `${orderLabel} — ${clientLabel}` : orderLabel;
                                return (
                                    <option key={order.id} value={order.id}>
                                        {typeLabel === "заявка" ? `${baseLabel} (заявка)` : baseLabel}
                                    </option>
                                );
                            })}
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

                    <div className="transaction-form-actions">
                        <button type="button" className="cancel-order-btn" onClick={handleOverlayClose} disabled={isLoading}>Отмена</button>
                        <button 
                            type="submit" 
                            className="save-order-btn" 
                            disabled={isLoading}
                        >
                            {isLoading ? "Добавление..." : "Добавить"}
                        </button>
                    </div>
                </form>
            </div>
            
            {showConfirmationModal && (
                <ConfirmationModal
                    title="Есть несохраненные изменения"
                    message="Вы уверены, что хотите закрыть окно? Все несохраненные данные будут утеряны."
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                    confirmText="Да, закрыть"
                    cancelText="Остаться"
                />
            )}
        </div>
    );
};

export default AddTransactionModal;
