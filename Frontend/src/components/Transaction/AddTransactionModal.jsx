import React, { useState, useEffect, useMemo } from "react";
import "../../styles/AddTransactionModal.css";

const generateId = (prefix) => {
    return prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
};


const AddTransactionModal = ({ onAdd, onClose, assets, financeFields }) => {
    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        date: getCurrentDateTime(),
        category: financeFields?.articles?.[0]?.articleValue || "",
        subcategory: "",
        description: "",
        account: "",
        accountCurrency: "UAH",
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
    });

    
    const [currentRates, setCurrentRates] = useState(null);
    const [showCommissionField, setShowCommissionField] = useState(false);
    const [showOrderBlock, setShowOrderBlock] = useState(false);
    const [destinationAccounts, setDestinationAccounts] = useState([{
        id: generateId("DEST_"),
        account: "",
        accountCurrency: "UAH",
        amount: "",
        commission: "",
    }]);
    const [showDestinationAccountsBlock, setShowDestinationAccountsBlock] = useState(false);


    
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


    const counterparties = ["Иванов И.И.", "ООО 'Поставщик'", "Петров П.П.", "Binance Exchange", "ООО 'Клиент'", "Государственная Налоговая Служба"];
    const counterpartyRequisitesMap = {
        "Иванов И.И.": { UAH: "UA987654321098765432109876543", USD: "US987654321098765432109876543" },
        "ООО 'Поставщик'": { UAH: "EDRPOU 12345678" },
        "Петров П.П.": { UAH: "Паспорт СН123456" },
        "Binance Exchange": { USDT: "Binance ID: 987654321" },
        "ООО 'Клиент'": { UAH: "ИНН 87654321" },
        "Государственная Налоговая Служба": { UAH: "UA456789012345678901234567890" },
    };


    const activeOrders = [
        { id: "ORD001", number: "P-54321", currency: "UAH", amount: 1200 },
        { id: "ORD002", number: "S-98765", currency: "USD", amount: 50 },
        { id: "ORD003", number: "K-11223", currency: "RUB", amount: 3000 },
    ];

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === "checkbox" ? checked : value;
        let newFormData = { ...formData, [name]: newValue };

        if (name === "category") {
            newFormData.subcategory = "";
            if (value === "Смена счета") {
                setShowDestinationAccountsBlock(true);
                newFormData.operation = "Списание";
                setDestinationAccounts([{
                    id: generateId("DEST_"),
                    account: "",
                    accountCurrency: "UAH",
                    amount: "",
                    commission: "",
                }]);
            } else {
                setShowDestinationAccountsBlock(false);
            }
        }

        if (name === "account") {
            const selectedAccount = assets.find(acc => acc.id === newValue);
            newFormData.accountCurrency = selectedAccount ? selectedAccount.currency : "UAH";
        }
        
        if (name === "counterparty") {
            const selectedRequisites = counterpartyRequisitesMap[newValue];
            newFormData.counterpartyRequisites = selectedRequisites ? selectedRequisites[newFormData.accountCurrency] || Object.values(selectedRequisites)[0] || "" : "";
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
        
        if (name === "orderNumber") {
            if (newValue) {
                const selectedOrder = activeOrders.find(order => order.number === newValue);
                if (selectedOrder) {
                    newFormData = {
                        ...newFormData,
                        orderId: selectedOrder.id,
                        orderCurrency: selectedOrder.currency,
                        sumByRatesOrderAmountCurrency: selectedOrder.amount.toFixed(2),
                        sumByRatesUAH: convertCurrency(selectedOrder.amount, selectedOrder.currency, "UAH"),
                        sumByRatesUSD: convertCurrency(selectedOrder.amount, selectedOrder.currency, "USD"),
                        sumByRatesRUB: convertCurrency(selectedOrder.amount, selectedOrder.currency, "RUB"),
                    };
                }
                setShowOrderBlock(true);
            } else {
                setShowOrderBlock(false);
                newFormData = {
                    ...newFormData,
                    orderId: "",
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
    };


    const addDestinationAccount = () => {
        if (destinationAccounts.length < 3) {
            setDestinationAccounts(prevAccounts => [
                ...prevAccounts,
                { id: generateId("DEST_"), account: "", accountCurrency: "UAH", amount: "", commission: "" }
            ]);
        }
    };


    const removeDestinationAccount = (id) => {
        setDestinationAccounts(prevAccounts => prevAccounts.filter(account => account.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.category === "Смена счета") {
            const transactions = [];
            const totalAmountToTransfer = destinationAccounts.reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0);
            const totalCommission = destinationAccounts.reduce((sum, acc) => sum + parseFloat(acc.commission || 0), 0);
            const totalWithdrawal = totalAmountToTransfer + totalCommission;
            
            const transaction1 = {
                ...formData,
                id: generateId("TRX_"),
                date: formData.date.replace("T", " "),
                operation: "Списание",
                amount: totalWithdrawal,
                commission: totalCommission,
                description: `Перевод на счета: ${destinationAccounts.map(acc => assets.find(a => a.id === acc.account)?.accountName).join(', ')}`,
            };
            transactions.push(transaction1);
            
            destinationAccounts.forEach(destAcc => {
                const transaction2 = {
                    ...formData,
                    id: generateId("TRX_"),
                    date: formData.date.replace("T", " "),
                    account: destAcc.account,
                    accountCurrency: destAcc.accountCurrency,
                    operation: "Зачисление",
                    amount: parseFloat(destAcc.amount || 0),
                    commission: parseFloat(destAcc.commission || 0),
                    description: `Перевод со счета ${assets.find(a => a.id === formData.account)?.accountName}`,
                    sentToCounterparty: false,
                    sendLion: false,
                };
                transactions.push(transaction2);
            });

            onAdd(transactions);
        } else {
            const newTransactionBase = {
                ...formData,
                date: formData.date.replace("T", " "),
                amount: parseFloat(formData.amount),
                commission: showCommissionField ? parseFloat(formData.commission || 0) : 0,
                sumUAH: parseFloat(formData.sumUAH) || 0,
                sumUSD: parseFloat(formData.sumUSD) || 0,
                sumRUB: parseFloat(formData.sumRUB) || 0,
                sumByRatesOrderAmountCurrency: parseFloat(formData.sumByRatesOrderAmountCurrency) || 0,
                sumByRatesUAH: parseFloat(formData.sumByRatesUAH) || 0,
                sumByRatesUSD: parseFloat(formData.sumByRatesUSD) || 0,
                sumByRatesRUB: parseFloat(formData.sumByRatesRUB) || 0,
                balanceBefore: 0,
                balanceAfter: 0,
            };
            onAdd(newTransactionBase);
        }
        onClose();
    };


    return (
        <div className="add-transaction-overlay">
            <div className="add-transaction-modal">
                <div className="add-transaction-header">
                    <h2>Добавить транзакцию</h2>
                    <div className="add-transaction-actions">
                        <span className="icon" onClick={onClose}>✖️</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-transaction-form">
                   
                    <div className="form-row">
                         <label htmlFor="date" className="form-label">
                             Дата и время операции
                         </label>
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
                            className="form-input"
                        />
                    </div>
                    
                    
                    <div className="form-row">
                        <label htmlFor="account" className="form-label">
                            Счет {formData.accountCurrency && `(${formData.accountCurrency})`}
                        </label>
                        <select
                            id="account"
                            name="account"
                            value={formData.account}
                            onChange={handleChange}
                            required
                            className="form-input"
                        >
                            <option value="">Выберите счет</option>
                            {assets && assets.length > 0 ? (
                                assets.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.accountName}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Нет доступных счетов</option>
                            )}
                        </select>
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
                            disabled={showDestinationAccountsBlock}
                        >
                            <option value="Зачисление">Зачисление</option>
                            <option value="Списание">Списание</option>
                        </select>
                    </div>
                    
                    {!showDestinationAccountsBlock && (
                        <>
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
                        </>
                    )}
                    
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
                                        <label htmlFor={`dest-account-${destAcc.id}`} className="form-label">
                                            Счет зачисления {destAcc.accountCurrency && `(${destAcc.accountCurrency})`}
                                        </label>
                                        <div className="input-with-actions">
                                            <select
                                                id={`dest-account-${destAcc.id}`}
                                                name="account"
                                                value={destAcc.account}
                                                onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                                required
                                                className="form-input"
                                            >
                                                <option value="">Выберите счет зачисления</option>
                                                {assets && assets.length > 0 ? (
                                                    assets.map((acc) => (
                                                        <option key={`dest-acc-${destAcc.id}-${acc.id}`} value={acc.id}>
                                                            {acc.accountName}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>Нет доступных счетов</option>
                                                )}
                                            </select>
                                            {index === 0 && destinationAccounts.length < 3 && (
                                                <button type="button" onClick={addDestinationAccount} className="action-button add-button">+</button>
                                            )}
                                            {index > 0 && (
                                                <button type="button" onClick={() => removeDestinationAccount(destAcc.id)} className="action-button remove-button">✖️</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <label htmlFor={`dest-amount-${destAcc.id}`} className="form-label">
                                            Сумма
                                        </label>
                                        <input
                                            type="number"
                                            id={`dest-amount-${destAcc.id}`}
                                            name="amount"
                                            value={destAcc.amount}
                                            onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                            placeholder="Введите сумму"
                                            required
                                            step="0.01"
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label htmlFor={`dest-commission-${destAcc.id}`} className="form-label">
                                            Комиссия
                                        </label>
                                        <input
                                            type="number"
                                            id={`dest-commission-${destAcc.id}`}
                                            name="commission"
                                            value={destAcc.commission}
                                            onChange={(e) => handleDestinationAccountChange(e, destAcc.id)}
                                            placeholder="Введите комиссию"
                                            step="0.01"
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-row-divider"></div>
                                </div>
                            ))}
                        </>
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
                                <option key={cp} value={cp}>
                                    {cp}
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
                            {activeOrders.map(order => (
                                <option key={order.id} value={order.number}>
                                    {order.number}
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
                        <button type="button" className="cancel-button" onClick={onClose}>Отменить</button>
                        <button type="submit" className="save-button">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;