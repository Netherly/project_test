import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/AssetDetailsModal.css";
import { Copy, Pencil, Plus, Trash2, X, GripVertical, Minus } from "lucide-react";
import { useTransactions } from "../../context/TransactionsContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { rid } from "../../api/fields.js";
import CreatableSelect from "../Client/ClientModal/CreatableSelect"; 
import { 
  readLatestRatesSnapshot, 
  writeLatestRatesSnapshot, 
  convertAmountByRates, 
  normalizeCurrencyCode 
} from "../../utils/exchangeRates.js";
import { fetchLatestRatesSnapshot } from "../../api/rates.js";

const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return "0.00";
  }
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

const formatDateShort = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month} ${hours}:${minutes}`;
};

const normalizeComparableRequisites = (requisites = []) =>
  (Array.isArray(requisites) ? requisites : [])
    .map((item) => ({
      label: String(item?.label ?? "").trim(),
      value: String(item?.value ?? "").trim(),
    }))
    .filter((item) => item.label || item.value);

const getComparableAssetState = (data) => ({
  accountName: String(data?.accountName ?? "").trim(),
  currency: String(data?.currency ?? "").trim(),
  limitTurnover:
    data?.limitTurnover === "" || data?.limitTurnover === null || data?.limitTurnover === undefined
      ? ""
      : String(Number(data.limitTurnover)),
  type: String(data?.type ?? "").trim(),
  paymentSystem: String(data?.paymentSystem ?? "").trim(),
  design: String(data?.design ?? "").trim(),
  employeeId: String(data?.employeeId ?? data?.employee?.id ?? "").trim(),
  status: String(data?.status ?? "Активен").trim(),
  cardDate: String(data?.cardDate ?? "").trim(),
  cardCVV: String(data?.cardCVV ?? "").trim(),
  requisites: normalizeComparableRequisites(data?.requisites),
});

const SortableRequisiteItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="requisite-item editable">
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>
      {children}
    </div>
  );
};

const AssetDetailsModal = ({
  asset,
  onClose,
  onDelete,
  onDuplicate,
  onSave,
  fields,
  employees,
  onAddNewField,
}) => {
  const { transactions } = useTransactions();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(() => readLatestRatesSnapshot());
  const [showTurnoverTooltip, setShowTurnoverTooltip] = useState(false);
  const [isEditingRequisites, setIsEditingRequisites] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getInitialState = (data) => {
    const allReqs = Array.isArray(data?.requisites) 
      ? data.requisites.map(r => ({ ...r, internalId: r.internalId || rid() })) 
      : [];
    
    const cardDate = allReqs.find(r => r.label === "Срок действия")?.value || "";
    const cardCVV = allReqs.find(r => r.label === "CVV")?.value || "";
    
    const dynamicReqs = allReqs.filter(r => r.label !== "Срок действия" && r.label !== "CVV");

    return {
      ...data,
      limitTurnover:
        data?.limitTurnover !== undefined && data?.limitTurnover !== null
          ? data.limitTurnover
          : "",
      status: data?.status || "Активен",
      employeeId: data?.employeeId || data?.employee?.id || "",
      employee: data?.employee || data?.employeeName || "",
      paymentSystem: data?.paymentSystem || "",
      design: data?.design || "",
      currency: data?.currency || "UAH",
      type: data?.type || "",
      cardDate,
      cardCVV, 
      requisites: dynamicReqs,
    };
  };

  const initialEditableAsset = useMemo(() => getInitialState(asset || {}), [asset]);
  const [editableAsset, setEditableAsset] = useState(initialEditableAsset);

  const recentTransactions = useMemo(() => {
    if (!asset || !transactions) return [];
    const filtered = transactions.filter((t) => {
      const accountId = t?.accountId ?? t?.account?.id ?? t?.account;
      return String(accountId) === String(asset.id);
    });
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered.slice(0, 5);
  }, [transactions, asset]);

  const currencyOptions = useMemo(() => {
    return fields?.generalFields?.currency?.map(item => item?.code ?? item?.name ?? item?.value ?? item) || [];
  }, [fields]);

  const typeOptions = useMemo(() => {
    return fields?.assetsFields?.type?.map(item => item?.name ?? item?.value ?? item) || [];
  }, [fields]);

  const paymentSystemOptions = useMemo(() => {
    return fields?.assetsFields?.paymentSystem?.map(item => item?.name ?? item?.value ?? item) || [];
  }, [fields]);

  useEffect(() => {
    setEditableAsset(initialEditableAsset);
    setIsEditingRequisites(false);
    setShowOptionsMenu(false);
  }, [initialEditableAsset]);

  useEffect(() => {
    let ignore = false;

    const cached = readLatestRatesSnapshot();
    if (cached) setExchangeRates(cached);

    const loadLatestRates = async () => {
      try {
        const latest = await fetchLatestRatesSnapshot();
        if (!ignore && latest) {
          setExchangeRates(latest);
          writeLatestRatesSnapshot(latest);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadLatestRates();
    return () => {
      ignore = true;
    };
  }, []);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(getComparableAssetState(editableAsset)) !==
      JSON.stringify(getComparableAssetState(initialEditableAsset)),
    [editableAsset, initialEditableAsset]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableAsset((prev) => {
      if (name === "employeeId") {
        const selected = employees?.find((emp) => emp.id === value);
        return {
          ...prev,
          employeeId: value,
          employee: selected?.fullName || selected?.full_name || "",
          employeeName: selected?.fullName || selected?.full_name || "",
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCardDateChange = (e) => {
    const prevValue = editableAsset.cardDate || "";
    const value = e.target.value;
    
    if (value.length < prevValue.length) {
      setEditableAsset(prev => ({ ...prev, cardDate: value }));
      return;
    }
    
    let v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      let month = v.substring(0, 2);
      if (parseInt(month, 10) > 12) month = '12';
      if (month === '00') month = '01';
      v = `${month}/${v.substring(2)}`;
    }
    
    setEditableAsset(prev => ({ ...prev, cardDate: v }));
  };

  const handleCardCVVChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').substring(0, 3);
    setEditableAsset(prev => ({ ...prev, cardCVV: v }));
  };

  const handleRequisiteChange = (index, e) => {
    const { name, value } = e.target;
    const newRequisites = [...(editableAsset.requisites || [])];
    newRequisites[index] = { ...newRequisites[index], [name]: value };
    setEditableAsset((prev) => ({ ...prev, requisites: newRequisites }));
  };

  const handleAddRequisite = () => {
    setEditableAsset((prev) => ({
      ...prev,
      requisites: [...(prev.requisites || []), { internalId: rid(), label: "", value: "" }],
    }));
    setIsEditingRequisites(true);
  };

  const handleRemoveRequisite = (index) => {
    const newRequisites = (editableAsset.requisites || []).filter(
      (_, i) => i !== index
    );
    setEditableAsset((prev) => ({ ...prev, requisites: newRequisites }));
  };

  const handleRequisitesSave = () => {
    const filtered = (editableAsset.requisites || []).filter(
      (req) => req.label.trim() !== "" || req.value.trim() !== ""
    );
    setEditableAsset((prev) => ({ ...prev, requisites: filtered }));
    setIsEditingRequisites(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setEditableAsset((prev) => {
        const oldIndex = prev.requisites.findIndex((item) => item.internalId === active.id);
        const newIndex = prev.requisites.findIndex((item) => item.internalId === over.id);
        return {
          ...prev,
          requisites: arrayMove(prev.requisites, oldIndex, newIndex)
        };
      });
    }
  };

  const handleSave = () => {
    const filteredRequisites = (editableAsset.requisites || []).filter(
      (req) => req.label.trim() !== "" || req.value.trim() !== ""
    );
    const requisitesToSave = filteredRequisites.map(({ internalId, ...rest }) => rest);

    if (editableAsset.cardDate?.trim()) {
      requisitesToSave.push({ label: "Срок действия", value: editableAsset.cardDate.trim() });
    }
    if (editableAsset.cardCVV?.trim()) {
      requisitesToSave.push({ label: "CVV", value: editableAsset.cardCVV.trim() });
    }

    const limitToSave =
      editableAsset.limitTurnover === "" ? null : parseFloat(editableAsset.limitTurnover);

    const assetToSave = {
      ...editableAsset,
      limitTurnover: limitToSave,
      requisites: requisitesToSave,
    };

    delete assetToSave.cardDate;
    delete assetToSave.cardCVV;

    onSave(assetToSave);
  };

  const handleDeleteClick = async () => {
    if (!window.confirm(`Удалить актив "${asset.accountName}"?`)) {
      setShowOptionsMenu(false);
      return;
    }

    try {
      await onDelete(asset.id);
      onClose();
    } finally {
      setShowOptionsMenu(false);
    }
  };

  const handleDuplicateClick = () => {
    onDuplicate(asset);
    onClose();
    setShowOptionsMenu(false);
  };

  if (!asset) return null;

  const turnoverLimit = parseFloat(editableAsset.limitTurnover) || 0;
  const incoming = asset.turnoverIncoming || 0;
  const outgoing = asset.turnoverOutgoing || 0;
  const totalTurnover = incoming + outgoing;
  const turnoverPercentage = turnoverLimit > 0 ? (totalTurnover / turnoverLimit) * 100 : 0;
  const progressBarWidth = Math.min(turnoverPercentage, 100);

  const getProgressColor = (pct) => {
    if (pct > 100) return "#ff4d4f";
    if (pct > 80) return "#fa8c16";
    if (pct > 50) return "#fadb14";
    return "#4CAF50";
  };

  const convertToCurrency = (amount, from, to) => {
    return convertAmountByRates(
      amount,
      normalizeCurrencyCode(from),
      normalizeCurrencyCode(to),
      exchangeRates,
      amount
    ).toFixed(2);
  };

  const currentBalance = asset.balance || 0;
  const freeBalance = asset.freeBalance ?? asset.balance;

  const designOptions = (fields?.assetsFields?.cardDesigns || []).map(d => d?.name).filter(Boolean);
  const getDesignName = (id) => (fields?.assetsFields?.cardDesigns || []).find(d => d?.id === id)?.name || "";

  const employeeOptions = employees?.map(emp => emp.fullName || emp.full_name || emp.name || emp.id).filter(Boolean) || [];
  const getEmployeeName = (id) => {
    const emp = employees?.find(e => e.id === id);
    return emp ? (emp.fullName || emp.full_name || emp.name || emp.id) : "";
  };

  return (
    <div className="assets-modal-overlay" onClick={onClose}>
      <div className="assets-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="asset-modal-header">
          <h2>{asset.accountName}</h2>
          <div className="header-actions-right">
            <span>{asset.currency}</span>
            <div className="modal-header-actions">
              <button className="options-button" onClick={() => setShowOptionsMenu((p) => !p)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {showOptionsMenu && (
                <div className="options-menu">
                  <button className="menu-item" onClick={handleDuplicateClick}>
                    <Copy size={14} /> Дублировать
                  </button>
                  <button className="menu-item delete-item" onClick={handleDeleteClick}>
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              )}
              <button className="modal-close-button" onClick={onClose}>
                <X />
              </button>
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
              <span>{formatNumberWithSpaces(currentBalance)}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, "UAH"))}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, "USD"))}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(currentBalance, asset.currency, "RUB"))}</span>
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
              <span>{formatNumberWithSpaces(freeBalance)}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, "UAH"))}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, "USD"))}</span>
              <span>{formatNumberWithSpaces(convertToCurrency(freeBalance, asset.currency, "RUB"))}</span>
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
                  style={{
                    width: `${progressBarWidth}%`,
                    backgroundColor: getProgressColor(turnoverPercentage),
                  }}
                />
              </div>
              <span className="modal-limit-value">
                {formatNumberWithSpaces(turnoverPercentage)}%
              </span>
              {showTurnoverTooltip && (
                <div className="turnover-tooltip">
                  Зачислено: {formatNumberWithSpaces(incoming)} / Списано:{" "}
                  {formatNumberWithSpaces(outgoing)}
                </div>
              )}
            </div>
          </div>

          <div className="modal-section edit-section">
            <h3>Параметры</h3>
            <div className="edit-form">
              <div className="form-row">
                <label htmlFor="accountName" className="form-label">
                  Наименование
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={editableAsset.accountName || ""}
                  onChange={handleChange}
                  className="form-input1"
                />
              </div>

              <div className="form-row">
                <label htmlFor="currency" className="form-label">
                  Валюта
                </label>
                <CreatableSelect
                  value={editableAsset.currency}
                  onChange={(val) => handleChange({ target: { name: 'currency', value: val } })}
                  options={currencyOptions}
                  placeholder="Выберите или введите валюту..."
                  onAdd={(val) => onAddNewField && onAddNewField("generalFields", "currency", val)}
                />
              </div>

              <div className="form-row">
                <label htmlFor="limitTurnover" className="form-label">
                  Лимит оборота
                </label>
                <div className="custom-number-input">
                  <input
                    type="number"
                    id="limitTurnover"
                    name="limitTurnover"
                    value={editableAsset.limitTurnover}
                    onChange={handleChange}
                    className="form-input1"
                    placeholder="0"
                    min={0}
                  />
                  <button 
                    type="button" 
                    className="num-btn minus-btn" 
                    onClick={() => {
                      const numValue = parseFloat(editableAsset.limitTurnover) || 0;
                      handleChange({ target: { name: 'limitTurnover', value: Math.max(0, numValue - 1000) } });
                    }} 
                    disabled={(parseFloat(editableAsset.limitTurnover) || 0) <= 0}
                  >
                    <Minus />
                  </button>
                  <button 
                    type="button" 
                    className="num-btn plus-btn" 
                    onClick={() => {
                      const numValue = parseFloat(editableAsset.limitTurnover) || 0;
                      handleChange({ target: { name: 'limitTurnover', value: numValue + 1000 } });
                    }}
                  >
                    <Plus />
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="type" className="form-label">
                  Тип
                </label>
                <CreatableSelect
                  value={editableAsset.type}
                  onChange={(val) => handleChange({ target: { name: 'type', value: val } })}
                  options={typeOptions}
                  placeholder="Выберите или введите тип..."
                  onAdd={(val) => onAddNewField && onAddNewField("assetsFields", "type", val)}
                />
              </div>

              <div className="form-row">
                <label htmlFor="paymentSystem" className="form-label">
                  Платежная система
                </label>
                <CreatableSelect
                  value={editableAsset.paymentSystem}
                  onChange={(val) => handleChange({ target: { name: 'paymentSystem', value: val } })}
                  options={paymentSystemOptions}
                  placeholder="Выберите или введите..."
                  onAdd={(val) => onAddNewField && onAddNewField("assetsFields", "paymentSystem", val)}
                />
              </div>

              <div className="form-row">
                <label htmlFor="design" className="form-label">
                  Дизайн
                </label>
                <CreatableSelect
                  value={getDesignName(editableAsset.design)}
                  onChange={(val) => {
                    const selected = (fields?.assetsFields?.cardDesigns || []).find(d => d?.name === val);
                    handleChange({ target: { name: 'design', value: selected ? selected.id : "" } });
                  }}
                  options={designOptions}
                  placeholder="Без темы"
                />
              </div>

              <div className="form-row">
                <label htmlFor="employeeId" className="form-label">
                  Сотрудник
                </label>
                <CreatableSelect
                  value={getEmployeeName(editableAsset.employeeId)}
                  onChange={(val) => {
                    const selected = employees?.find(emp => (emp.fullName || emp.full_name || emp.name || emp.id) === val);
                    handleChange({ target: { name: 'employeeId', value: selected ? selected.id : "" } });
                  }}
                  options={employeeOptions}
                  placeholder="Не выбрано"
                />
              </div>

              <div className="form-row">
                <label htmlFor="status" className="form-label">
                  Статус
                </label>
                <CreatableSelect
                  value={editableAsset.status}
                  onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                  options={["Активен", "Неактивен"]}
                  placeholder="Не выбрано"
                />
              </div>

              <div className="form-row">
                <label className="form-label">
                  Срок и CVV
                </label>
                <div style={{ display: 'flex', gap: '10px', flexBasis: '70%', width: '100%' }}>
                  <input
                    type="text"
                    name="cardDate"
                    value={editableAsset.cardDate || ""}
                    onChange={handleCardDateChange}
                    placeholder="ММ/ГГ"
                    className="form-input1"
                    style={{ minWidth: '0', flex: 1 }}
                    maxLength={5}
                  />
                  <input
                    type="text"
                    name="cardCVV"
                    value={editableAsset.cardCVV || ""}
                    onChange={handleCardCVVChange}
                    placeholder="CVV"
                    className="form-input1"
                    style={{ minWidth: '0', flex: 1 }}
                    maxLength={3}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="modal-section requisites-block">
            <div className="requisites-header">
              <h3>Доп. реквизиты</h3>
              <div className="requisite-header-controls">
                <button
                  type="button"
                  className="edit-requisite-button"
                  onClick={isEditingRequisites ? handleRequisitesSave : () => setIsEditingRequisites(true)}
                  title={isEditingRequisites ? "Сохранить" : "Редактировать"}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="add-requisite-icon-button"
                  onClick={handleAddRequisite}
                  title="Добавить реквизит"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {(editableAsset.requisites || []).length === 0 && !isEditingRequisites && (
              <div className="no-transactions-message">Нет реквизитов</div>
            )}

            {isEditingRequisites ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={editableAsset.requisites.map(r => r.internalId)} strategy={verticalListSortingStrategy}>
                  {editableAsset.requisites.map((req, index) => (
                    <SortableRequisiteItem key={req.internalId} id={req.internalId}>
                      <input
                        type="text"
                        name="label"
                        value={req.label}
                        onChange={(e) => handleRequisiteChange(index, e)}
                        className="requisite-input"
                        placeholder="Название"
                      />
                      <input
                        type="text"
                        name="value"
                        value={req.value}
                        onChange={(e) => handleRequisiteChange(index, e)}
                        className="requisite-input"
                        placeholder="Значение"
                      />
                      <button
                        type="button"
                        className="remove-requisite-icon-button"
                        onClick={() => handleRemoveRequisite(index)}
                        title="Удалить"
                      >
                        <X size={16} />
                      </button>
                    </SortableRequisiteItem>
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              (editableAsset.requisites || []).map((req, index) => (
                <div key={`${req.label}-${index}`} className="requisite-item">
                  <label>{req.label || "—"}</label>
                  <span>{req.value || "—"}</span>
                </div>
              ))
            )}
          </div>

          <div className="modal-section">
            <h3>Журнал операций</h3>
            <div className="finances-log-table">
              <div className="finances-log-row header-row">
                <div className="finances-log-content-wrapper">
                  <div className="finances-log-cell">Дата</div>
                  <div className="finances-log-cell">Статья</div>
                  <div className="finances-log-cell">Подстатья</div>
                  <div className="finances-log-cell">Контрагент</div>
                  <div className="finances-log-cell">Сумма</div>
                </div>
              </div>

              {recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <div key={trx.id} className="finances-log-row">
                    <div className="finances-log-content-wrapper">
                      <div className="finances-log-cell">
                        <span>{formatDateShort(trx.date)}</span>
                      </div>
                      <div className="finances-log-cell">
                        <span>{trx.category}</span>
                      </div>
                      <div className="finances-log-cell">
                        <span>{trx.subcategory}</span>
                      </div>
                      <div className="finances-log-cell">
                        <span>{trx.counterparty}</span>
                      </div>
                      <div className="finances-log-cell">
                        <span className={trx.operation === "Зачисление" ? "text-success" : "text-danger"}>
                          {formatNumberWithSpaces(trx.amount)} {trx.accountCurrency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-transactions-message">Нет транзакций</div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="modal-footer">
            <button
              className="cancel-order-btn"
              onClick={() => {
                setEditableAsset(initialEditableAsset);
                setIsEditingRequisites(false);
              }}
            >
              Отменить
            </button>
            <button className="save-order-btn" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetailsModal;