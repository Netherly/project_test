import React, { useState, useEffect, useMemo, useRef } from "react";
import "../../styles/ViewEditTransactionModal.css";
import ConfirmationModal from '../modals/confirm/ConfirmationModal'; 
import { Trash2, Copy, X, Plus, Minus } from 'lucide-react';
import CreatableSelect from "../../components/Client/ClientModal/CreatableSelect"; 

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

const toLowerText = (value) => String(value ?? '').trim().toLowerCase();

const resolveCounterpartyIds = (name, list) => {
  const needle = toLowerText(name);
  if (!needle) return { employeeId: null, clientId: null };
  const match = (Array.isArray(list) ? list : []).find(
    (cp) => toLowerText(cp?.name) === needle
  );
  if (!match) return {};
  if (match.type === "employee") return { employeeId: match.id };
  if (match.type === "client") return { clientId: match.id };
  return {};
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const raw = value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(raw.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  const year = raw.getFullYear();
  const month = pad(raw.getMonth() + 1);
  const day = pad(raw.getDate());
  const hours = pad(raw.getHours());
  const minutes = pad(raw.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ViewEditTransactionModal = ({ transaction, onUpdate, onClose, onDelete, onDuplicate, assets, financeFields, orders = [], counterparties = [], onAddNewField }) => {
  const formattedDate = toDateTimeLocalValue(transaction.date);
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
    receivedCounterparty: transaction.receivedCounterparty || false,
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
    } catch (error) {}
  }, []);

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
    setShowOrderBlock(!!formData.orderId);
    setShowSecondAccountBlock(formData.category === "Смена счета");
  }, [formData.category, formData.amount, formData.orderId]);
  
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
      if (newFormData.counterparty) {
        const selectedCounterparty = counterparties.find(cp => cp.name === newFormData.counterparty);
        if (selectedCounterparty && selectedCounterparty.requisites) {
          const requisitesForCurrency = selectedCounterparty.requisites[newFormData.accountCurrency];
          if (requisitesForCurrency && requisitesForCurrency.length > 0) {
            newFormData.counterpartyRequisites = requisitesForCurrency
              .map(formatRequisite)
              .filter(Boolean)
              .join(', ');
          } else {
            const firstAvailableCurrency = Object.keys(selectedCounterparty.requisites)[0];
            if (firstAvailableCurrency) {
              const firstRequisites = selectedCounterparty.requisites[firstAvailableCurrency];
              if (firstRequisites && firstRequisites.length > 0) {
                newFormData.counterpartyRequisites = firstRequisites
                  .map(formatRequisite)
                  .filter(Boolean)
                  .join(', ');
              }
            }
          }
        }
      }
    }

    if (name === "counterparty") {
      const selectedCounterparty = counterparties.find(cp => cp.name === newValue);
      let requisitesString = "";

      if (selectedCounterparty && selectedCounterparty.requisites) {
        const requisitesForCurrency = selectedCounterparty.requisites[newFormData.accountCurrency];

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
      }
      newFormData.counterpartyRequisites = requisitesString;
    }

    if (name === "amount" || name === "category") {
      const currentAmount = parseFloat(name === "amount" ? newValue : newFormData.amount);
      const currentCategory = name === "category" ? newValue : newFormData.category;
      setShowCommissionField(currentCategory === "Смена счета" && currentAmount > 0);
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
          newFormData.orderId = selectedOrder.id;
          newFormData.orderNumber = selectedOrder.numberOrder ?? String(selectedOrder.orderSequence ?? selectedOrder.id);
          newFormData.orderCurrency = orderCurrency; 
          newFormData.sumByRatesOrderAmountCurrency = orderAmount; 
          newFormData.sumByRatesUAH = convertCurrency(orderAmount, orderCurrency, "UAH");
          newFormData.sumByRatesUSD = convertCurrency(orderAmount, orderCurrency, "USD");
          newFormData.sumByRatesRUB = convertCurrency(orderAmount, orderCurrency, "RUB");
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

    const counterpartyIds = resolveCounterpartyIds(formData.counterparty, counterparties);
    if ("employeeId" in counterpartyIds) {
      updatedTransaction.employeeId = counterpartyIds.employeeId;
    }
    if ("clientId" in counterpartyIds) {
      updatedTransaction.clientId = counterpartyIds.clientId;
    }

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

  const formatNumberWithSpaces = (num) => {
    if (num === null || num === undefined || isNaN(Number(num))) {
      return '—'; 
    }
    const fixedNum = Number(num).toFixed(2);
    const parts = fixedNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  };

  const articleOptions = useMemo(() => {
    const list = financeFields?.articles
      ?.filter(a => !a.isDeleted)
      ?.map(getArticleValue)
      .filter(Boolean) || [];
    if (!list.includes("Смена счета")) {
      list.push("Смена счета");
    }
    return list;
  }, [financeFields]);
  
  const subcategoryOptions = useMemo(() => {
    return availableSubcategories.filter(s => !s.isDeleted).map(getSubarticleValue).filter(Boolean);
  }, [availableSubcategories]);

  return (
    <div className="add-transaction-overlay" onClick={handleCloseModal}>
      <div className="add-transaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="view-transaction-header">
          <h2>Информация о транзакции</h2>
          <div className="add-transaction-actions">
               <button className="options-button" onClick={handleMenuToggle}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
               </button>
               {showOptionsMenu && (
                 <div className="options-menu">
                   <button className="menu-item" onClick={handleDuplicateClick}><Copy size={14}/> Дублировать</button>
                   <button className="menu-item delete-item" onClick={handleDeleteClick}><Trash2 size={14}/> Удалить</button>
                 </div>
               )}
               <span className="icon" onClick={handleCloseModal}>
                 <X size={24} color="white" />
               </span>
            </div>
        </div>

        <form id="view-edit-transaction-form" onSubmit={handleSubmit} className="add-transaction-form custom-scrollbar">
          <div className="form-row">
            <label htmlFor="date" className="form-label">Дата и время</label>
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
            <CreatableSelect
              value={formData.category}
              onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
              options={articleOptions}
              placeholder="Выберите или введите статью..."
              onAdd={(val) => onAddNewField && onAddNewField("financeFields", "articles", val)}
            />
          </div>

          {(availableSubcategories.length > 0 || formData.category) && (
            <div className="form-row">
              <label htmlFor="subcategory" className="form-label">Подстатья</label>
              <CreatableSelect
                value={formData.subcategory}
                onChange={(val) => handleChange({ target: { name: 'subcategory', value: val } })}
                options={subcategoryOptions}
                placeholder="Выберите или введите подстатью..."
                disabled={!formData.category}
                onAdd={(val) => {
                  if (!formData.category) return alert("Сначала выберите статью!");
                  onAddNewField && onAddNewField("financeFields", "subarticles", val, { subarticleInterval: formData.category });
                }}
              />
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
              {showSecondAccountBlock ? "Счет списания" : "Счет"} 
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
              <option value="" disabled hidden>Не выбрано</option>
              {assets?.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
                <label className="form-label">Баланс до</label>
                <span className="form-input1">
                  {formatNumberWithSpaces(transaction.balanceBefore)}
                </span>
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
                className="form-input1"
                disabled={showSecondAccountBlock}
              >
                <option value="" disabled hidden>Не выбрано</option>
                <option value="Зачисление">Зачисление</option>
                <option value="Списание">Списание</option>
              </select>
            </div>

          <div className="form-row">
                <label className="form-label">Баланс после</label>
                <span className="form-input1">
                  {formatNumberWithSpaces(transaction.balanceAfter)}
                </span>
              </div>

            <div className="form-row">
              <label htmlFor="amount" className="form-label">
                Сумма операции
              </label>
              <div className="custom-number-input">
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Введите сумму"
                  required
                  step="0.01"
                  min={0}
                  className="form-input1"
                />
                <button 
                  type="button" 
                  className="num-btn minus-btn" 
                  onClick={() => {
                    const numValue = parseFloat(formData.amount) || 0;
                    handleChange({ target: { name: 'amount', value: Math.max(0, numValue - 100) } });
                  }} 
                  disabled={(parseFloat(formData.amount) || 0) <= 0}
                >
                  <Minus />
                </button>
                <button 
                  type="button" 
                  className="num-btn plus-btn" 
                  onClick={() => {
                    const numValue = parseFloat(formData.amount) || 0;
                    handleChange({ target: { name: 'amount', value: numValue + 100 } });
                  }}
                >
                  <Plus />
                </button>
              </div>
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
                <div className="custom-number-input">
                  <input
                    type="number"
                    id="commission"
                    name="commission"
                    value={formData.commission}
                    onChange={handleChange}
                    placeholder="Введите комиссию"
                    step="0.01"
                    min={0}
                    className="form-input1"
                  />
                  <button 
                    type="button" 
                    className="num-btn minus-btn" 
                    onClick={() => {
                      const numValue = parseFloat(formData.commission) || 0;
                      handleChange({ target: { name: 'commission', value: Math.max(0, numValue - 10) } });
                    }} 
                    disabled={(parseFloat(formData.commission) || 0) <= 0}
                  >
                    <Minus />
                  </button>
                  <button 
                    type="button" 
                    className="num-btn plus-btn" 
                    onClick={() => {
                      const numValue = parseFloat(formData.commission) || 0;
                      handleChange({ target: { name: 'commission', value: numValue + 10 } });
                    }}
                  >
                    <Plus />
                  </button>
                </div>
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
                className="form-input1"
              >
                <option value="" disabled hidden>Не выбрано</option>
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
                <option value="" disabled hidden>Не выбрано</option>
                {orders.map((order) => {
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

            <div className="form-row second-checkbox-row">
              <label htmlFor="receivedCounterparty" className="form-label">
                Получено контрагентом
              </label>
              <input
                type="checkbox"
                id="receivedCounterparty"
                name="receivedCounterparty"
                checked={formData.receivedCounterparty}
                onChange={handleChange}
                className="form-checkbox"
              />
            </div>

            <div className="form-row second-checkbox-row">
              <label htmlFor="inArchive" className="form-label">
                В архиве
              </label>
              <input
                type="checkbox"
                id="inArchive"
                name="inArchive"
                checked={true} 
                disabled={true}
                className="form-checkbox"
              />
            </div>
        </form>
        <div className="view-transaction-form-actions">
          <button type="button" className="cancel-order-btn" onClick={handleCloseModal}>
            Отменить
          </button>
          <button type="submit" form="view-edit-transaction-form" className="save-order-btn">
            Сохранить
          </button>
        </div>
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