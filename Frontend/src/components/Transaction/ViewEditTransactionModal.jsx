import React, { useState, useEffect } from "react";
import "../../styles/ViewEditTransactionModal.css";

const generateId = (prefix) => {
  return prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
};


const ViewEditTransactionModal = ({ transaction, onUpdate, onClose, onDelete, onDuplicate }) => {
  const formattedDate = transaction.date ? transaction.date.replace(" ", "T") : "";

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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); // Новое состояние для меню

  const categories = ["Продажи", "Расходы", "Зарплата", "Инвестиции", "Доходы", "Налоги", "Смена счета"];
  const subcategories = {
    "Продажи": ["Онлайн-продажи", "Оффлайн-продажи"],
    "Расходы": ["Закупка материалов", "Оплата услуг"],
    "Зарплата": ["Выдача ЗП", "Аванс"],
    "Инвестиции": ["Покупка криптовалюты", "Покупка акций"],
    "Доходы": ["Возврат средств", "Кэшбэк"],
    "Налоги": ["Уплата ЕСВ", "Единый налог"],
    "Смена счета": ["Внутренний перевод"],
  };
  const accounts = [
    { name: "ПриватБанк - Ключ к счету", currency: "UAH" },
    { name: "Монобанк - Черная (V) (0574)", currency: "UAH" },
    { name: "Binance - Спотовый", currency: "USDT" },
    { name: "Ощадбанк - Текущий", currency: "UAH" },
    { name: "Наличные - Офис", currency: "UAH" },
    { name: "Revolut - USD", currency: "USD" },
    { name: "Тинькофф - RUB", currency: "RUB" },
  ];
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
    if (formData.orderNumber) {
      const selectedOrder = activeOrders.find(order => order.number === formData.orderNumber);
      if (selectedOrder) {
        setFormData(prevData => ({
          ...prevData,
          orderId: selectedOrder.id,
          orderCurrency: selectedOrder.currency,
          sumByRatesOrderAmountCurrency: selectedOrder.amount.toFixed(2),
          sumByRatesUAH: convertCurrency(selectedOrder.amount, selectedOrder.currency, "UAH"),
          sumByRatesUSD: convertCurrency(selectedOrder.amount, selectedOrder.currency, "USD"),
          sumByRatesRUB: convertCurrency(selectedOrder.amount, selectedOrder.currency, "RUB"),
        }));
      } else {
        setFormData(prevData => ({
          ...prevData,
          orderId: generateId("ORD_"),
          orderCurrency: "",
          sumByRatesOrderAmountCurrency: "",
          sumByRatesUAH: "",
          sumByRatesUSD: "",
          sumByRatesRUB: "",
        }));
      }
      setShowOrderBlock(true);
    } else {
      setShowOrderBlock(false);
      setFormData(prevData => ({
        ...prevData,
        orderId: "",
        orderCurrency: "",
        sumByRatesOrderAmountCurrency: "",
        sumByRatesUAH: "",
        sumByRatesUSD: "",
        sumByRatesRUB: "",
      }));
    }
  }, [formData.orderNumber, currentRates, activeOrders]);

  useEffect(() => {
    setShowCommissionField(formData.category === "Смена счета" && parseFloat(formData.amount) > 0);
    setShowOrderBlock(!!formData.orderNumber);
    setShowSecondAccountBlock(formData.category === "Смена счета");
  }, [formData.category, formData.amount, formData.orderNumber]);

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
      const selectedAccount = accounts.find(acc => acc.name === newValue);
      if (selectedAccount) {
        newFormData.accountCurrency = selectedAccount.currency;
      }
    }

    if (name === "counterparty") {
      const selectedRequisites = counterpartyRequisitesMap[newValue];
      if (selectedRequisites) {
        newFormData.counterpartyRequisites = selectedRequisites[newFormData.accountCurrency] || Object.values(selectedRequisites)[0] || "";
      } else {
        newFormData.counterpartyRequisites = "";
      }
    }

    if (name === "amount" || name === "category") {
      const currentAmount = parseFloat(name === "amount" ? newValue : newFormData.amount);
      const currentCategory = name === "category" ? newValue : newFormData.category;
      setShowCommissionField(currentCategory === "Смена счета" && currentAmount > 0);
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
    if (window.confirm(`Вы уверены, что хотите удалить транзакцию с ID "${transaction.id}"?`)) {
      if (onDelete) { 
        onDelete(transaction.id);
      }
      onClose();
    }
    setShowOptionsMenu(false);
  };

  const handleDuplicateClick = () => {
    if (onDuplicate) { 
      onDuplicate(transaction);
    }
    onClose();
    setShowOptionsMenu(false);
  };

  
  return (
    <div className="add-transaction-overlay">
      <div className="add-transaction-modal">
        <div className="add-transaction-header">
          <h2>Редактировать транзакцию</h2>
          <div className="add-transaction-actions">
            <button className="options-button" onClick={handleMenuToggle}>
              &#x22EF;
            </button>
            {showOptionsMenu && (
              <div className="options-menu">
                <button className="menu-item" onClick={handleDuplicateClick}>Дублировать транзакцию</button>
                <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить транзакцию</button>
              </div>
            )}
            <span className="icon" onClick={onClose}>
              ✖️
            </span>
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
            <label htmlFor="category" className="form-label">
              Статья
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="">Выберите статью</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {formData.category && subcategories[formData.category] && (
            <div className="form-row">
              <label htmlFor="subcategory" className="form-label">
                Подстатья
              </label>
              <select
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Выберите подстатью</option>
                {subcategories[formData.category].map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
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
                {accounts.map((acc) => (
                  <option key={acc.name} value={acc.name}>
                    {acc.name}
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
                <label className="form-label">Счет зачисления</label>
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
            <button type="button" className="cancel-button" onClick={onClose}>
              Отменить
            </button>
            <button type="submit" className="save-button">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewEditTransactionModal;