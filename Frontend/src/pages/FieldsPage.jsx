import React, { useState, useRef, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { useFields } from "../context/FieldsContext";
import "../styles/Fields.css";

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

import { 
  fetchFields, 
  saveFields, 
  fetchInactiveFields,
  withDefaults,        
  serializeForSave,    
  rid,                  
  tidy,
  isHex,
  clone                
} from "../api/fields.js"; 
import { fileUrl } from "../api/http";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";
import PageHeaderIcon from "../components/HeaderIcon/PageHeaderIcon.jsx"
import NoAccessState from "../components/ui/NoAccessState";
import { isForbiddenError } from "../utils/isForbiddenError";
import { getCardDesignFallback } from "../utils/cardDesigns";
import { Copy, Plus, Eye, EyeOff, Check, Undo2, X, GripVertical, Move } from 'lucide-react'; 

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ORDER_STORAGE_KEY = "crm_field_orders_v2";
const ACTIVE_TAB_STORAGE_KEY = "crm_active_field_tab";

const safeFileUrl = (u) => {
  if (!u) return "";
  const s = tidy(u);
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  try { return fileUrl(s); } catch { return s; }
};

const joinFieldLabel = (...parts) => {
  const values = parts.map((part) => tidy(part)).filter(Boolean);
  return values.join(" / ");
};

const CardDesignPreviewMedia = ({ design, onClick, disabled }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const previewUrl = safeFileUrl(design?.url);
  const fallback = getCardDesignFallback(design?.name);

  useEffect(() => {
    setHasImageError(false);
  }, [design?.url, design?.name]);

  const showImage = Boolean(previewUrl) && !hasImageError;
  const previewClass = [
    "card-design-preview",
    !showImage ? "card-design-preview--fallback" : "",
    fallback ? `card-design-preview--${fallback.key}` : "card-design-preview--generic",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={previewClass}
      title={disabled ? design?.name : "Кликните, чтобы заменить"}
      onClick={() => !disabled && onClick?.()}
      style={{ position: "relative" }}
    >
      {showImage ? (
        <img
          src={previewUrl}
          alt={design?.name || "design"}
          className="card-design-image"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="card-design-fallback-label">
          {design?.name || fallback?.label || "Дизайн"}
        </div>
      )}
    </div>
  );
};

const tabsConfig = [
  { key: "generalFields", label: "Общие"},
  { key: "orderFields", label: "Заказы" },
  { key: "executorFields", label: "Исполнители" },
  { key: "sundryFields", label: "Журнал"},
  { key: "taskFields", label: "Задачи"},
  { key: "clientFields", label: "Клиенты" },
  { key: "companyFields", label: "Компании"},
  { key: "employeeFields", label: "Сотрудники" },
  { key: "assetsFields", label: "Активы" },
  { key: "financeFields", label: "Транзакции" },
];

const initialValues = {
  generalFields: { currency: [], country: [], businessLine: [] },
  orderFields: {
    intervals: [{ id: rid(), intervalValue: "", isDeleted: false, order: 0 }],
    categories: [{ id: rid(), categoryInterval: "", categoryValue: "", isDeleted: false, order: 0 }],
    statuses: [], closeReasons: [], projects: [], tags: [], techTags: [], taskTags: [], discountReason: [], minOrderAmount: [], readySolution: [],
  },
  executorFields: { role: [] },
  clientFields: { source: [], category: [], country: [], tags: [], business: [] },
  companyFields: { tags: [] },
  employeeFields: { country: [], tags: [] },
  assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
  financeFields: {
    articles: [{ id: rid(), articleValue: "", isDeleted: false, order: 0 }],
    subarticles: [{ id: rid(), subarticleInterval: "", subarticleValue: "", isDeleted: false, order: 0 }],
    subcategory: [],
  },
  sundryFields:{ typeWork: [] },
  taskFields: { tags: [] },
  miscFields: { businessLine: [] }
};

const initialFieldOrders = {
  generalFields: ["currency", "country", "businessLine"],
  orderFields: ["intervals", "categories", "statuses", "closeReasons", "projects", "discountReason", "minOrderAmount", "readySolution", "tags", "techTags", "taskTags"],
  executorFields: ["role"],
  clientFields: ["category", "source", "business", "tags"],
  companyFields: ["tags"],
  employeeFields: ["tags"],
  assetsFields: ["type", "paymentSystem", "cardDesigns"],
  financeFields: ["articles", "subcategory", "subarticles"],
  sundryFields: ["typeWork"],
  taskFields: ["tags"],
};

const mergeFieldOrders = (saved = {}) =>
  Object.fromEntries(
    Object.entries(initialFieldOrders).map(([groupKey, defaults]) => {
      const current = Array.isArray(saved?.[groupKey]) ? saved[groupKey] : [];
      const merged = [
        ...current.filter((key) => defaults.includes(key)),
        ...defaults.filter((key) => !current.includes(key)),
      ];
      return [groupKey, merged];
    })
  );

const buildFixedCurrencyList = (source = [], includeSystem = false) => {
  const allowedCodes = new Set(
    (includeSystem
      ? [...VISIBLE_FIELD_CURRENCIES, ...SYSTEM_FIELD_CURRENCIES]
      : VISIBLE_FIELD_CURRENCIES
    ).map((item) => item.code)
  );
  const orderByCode = new Map(
    [...VISIBLE_FIELD_CURRENCIES, ...SYSTEM_FIELD_CURRENCIES].map((item, index) => [item.code, index])
  );
  const existingByCode = new Map(
    (Array.isArray(source) ? source : [])
      .map((item) => {
        const code = tidy(item?.code ?? item?.value).toUpperCase();
        return code && allowedCodes.has(code) ? [code, item] : null;
      })
      .filter(Boolean)
  );
  const items = Array.from(existingByCode.values())
    .map((existing) => {
      const code = tidy(existing?.code ?? existing?.value).toUpperCase();
      const fallback =
        [...VISIBLE_FIELD_CURRENCIES, ...SYSTEM_FIELD_CURRENCIES].find((item) => item.code === code) || null;
      return {
        ...existing,
        id: existing?.id || `field-currency-${code.toLowerCase()}`,
        value: code,
        code,
        name: tidy(existing?.name) || fallback?.name || code,
        label: tidy(existing?.label) || tidy(existing?.name) || fallback?.name || code,
        order: Number.isFinite(Number(existing?.order))
          ? Number(existing.order)
          : (orderByCode.get(code) ?? Number.MAX_SAFE_INTEGER),
        isDeleted: code === "UAH" ? false : Boolean(existing?.isDeleted),
      };
    })
    .sort((a, b) => {
      const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
      const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.code || "").localeCompare(String(b?.code || ""));
    });

  if (includeSystem && !existingByCode.has("UAH")) {
    items.push({
      id: "field-currency-uah",
      value: "UAH",
      code: "UAH",
      name: "Ukrainian Hryvnia",
      label: "Ukrainian Hryvnia",
      order: orderByCode.get("UAH") ?? Number.MAX_SAFE_INTEGER,
      isDeleted: false,
    });
  }

  return items;
};

const buildSharedCountryList = (source = []) =>
  (Array.isArray(source) ? source : []).map((item, index) => ({
    ...item,
    id: item?.id || `field-country-${index}`,
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index,
    isDeleted: Boolean(item?.isDeleted),
  }));

const applyFieldsPagePreset = (values) => {
  const next = clone(values);
  const currencySource =
    next?.generalFields?.currency ??
    next?.orderFields?.currency ??
    next?.executorFields?.currency ??
    next?.clientFields?.currency ??
    next?.assetsFields?.currency ??
    [];
  const fixedCurrencies = buildFixedCurrencyList(currencySource, false);
  const countrySource =
    next?.generalFields?.country ??
    next?.clientFields?.country ??
    next?.employeeFields?.country ??
    [];
  const sharedCountries = buildSharedCountryList(countrySource);

  for (const groupKey of CURRENCY_FIELD_GROUPS) {
    if (!next[groupKey]) continue;
    next[groupKey] = {
      ...next[groupKey],
      currency: clone(fixedCurrencies),
    };
  }

  for (const groupKey of COUNTRY_FIELD_GROUPS) {
    if (!next[groupKey]) continue;
    next[groupKey] = {
      ...next[groupKey],
      country: clone(sharedCountries),
    };
  }

  return next;
};

const prepareFieldsPageSaveValues = (values) => {
  const next = clone(values);
  const currencySource =
    next?.generalFields?.currency ??
    next?.orderFields?.currency ??
    next?.executorFields?.currency ??
    next?.clientFields?.currency ??
    next?.assetsFields?.currency ??
    [];
  const saveCurrencies = buildFixedCurrencyList(currencySource, true);
  const countrySource =
    next?.generalFields?.country ??
    next?.clientFields?.country ??
    next?.employeeFields?.country ??
    [];
  const saveCountries = buildSharedCountryList(countrySource);

  for (const groupKey of CURRENCY_FIELD_GROUPS) {
    if (!next[groupKey]) continue;
    next[groupKey] = {
      ...next[groupKey],
      currency: clone(saveCurrencies),
    };
  }

  for (const groupKey of COUNTRY_FIELD_GROUPS) {
    if (!next[groupKey]) continue;
    next[groupKey] = {
      ...next[groupKey],
      country: clone(saveCountries),
    };
  }

  return next;
};

const SortableFieldRow = ({ id, children, isDragEnabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`sortable-field-row ${isDragging ? 'dragging' : ''}`}
    >
      {isDragEnabled && (
        <div className="row-drag-handle-container">
          <div 
            {...attributes} 
            {...listeners} 
            className="row-drag-handle"
            title="Перетащить категорию"
          >
            <GripVertical size={20} />
          </div>
        </div>
      )}
      <div className="row-content-wrapper">
        {children}
      </div>
    </div>
  );
};

const SortableItem = ({ id, children, disabled, showHandle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBottom: '8px'
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-row">
      {!disabled && showHandle && (
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={20} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
};

const EditableList = ({
  items = [],
  onChange,        
  onToggleDelete,
  onAdd,
  onCommit,
  onReorder,       
  placeholder,
  showHidden,
  isDragEnabled,
  readOnly = false,
}) => {
  const refs = useRef([]);
  const dndId = useMemo(() => rid(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBlur = (i) => {
    if (typeof onCommit === "function") onCommit(i);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  return (
    <div className="category-fields-container">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => {
            if (item.isDeleted && !showHidden) return null;

            return (
              <SortableItem key={item.id} id={item.id} disabled={item.isDeleted} showHandle={isDragEnabled}>
                <div className={`category-field-group ${item.isDeleted ? 'is-hidden-item' : ''}`}>
                  <div className="category-container">
                    <div className="category-full">
                      <input
                        ref={(el) => (refs.current[index] = el)}
                        type="text"
                        value={item.value}
                        onChange={(e) => onChange(index, e.target.value)}
                        onBlur={() => handleBlur(index)}
                        placeholder={placeholder}
                        className="text-input"
                        disabled={item.isDeleted}
                        readOnly={readOnly}
                      />
                    </div>
                    <button
                      type="button"
                      className={`remove-category-btn ${item.isDeleted ? 'restore' : ''}`}
                      onClick={() => onToggleDelete(index, item)}
                      title={item.isDeleted ? "Восстановить" : "Удалить"}
                    >
                      {item.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                    </button>
                  </div>
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
      {typeof onAdd === "function" && (
        <button type="button" className="add-category-btn" onClick={onAdd}>
          <Plus size={20} color='white'/> Добавить
        </button>
      )}
    </div>
  );
};

const TagList = ({ title, tags = [], onChange, onToggleDelete, showHidden, isDragEnabled }) => {
  const nameRefs = useRef([]);
  const dndId = useMemo(() => rid(), []);
   
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id);
      const newIndex = tags.findIndex((t) => t.id === over.id);
      const newItems = arrayMove(tags, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onChange(newItems);
    }
  };

  const add = () => {
    const next = [...(tags || []), { id: rid(), name: "", color: "#ffffff", isDeleted: false, order: (tags || []).length }];
    onChange(next);
    setTimeout(() => nameRefs.current[next.length - 1]?.focus(), 0);
  };

  const upd = (i, patch) => {
    const next = [...(tags || [])];
    const originalIndex = tags.findIndex(t => t.id === i);
    if (originalIndex === -1) return;
    next[originalIndex] = { ...next[originalIndex], ...patch };
    onChange(next);
  };

  const toggleDelete = (id) => {
    const idx = tags.findIndex(t => t.id === id);
    if (idx === -1) return;
    const next = [...tags];
    next[idx] = { ...next[idx], isDeleted: !next[idx].isDeleted };
    onChange(next);
  };

  const blurName = (id) => {
    const item = tags.find(t => t.id === id);
    if (!item) return;
    if (!tidy(item.name)) {
      if (!item.isDeleted) onChange(tags.filter((t) => t.id !== id));
      return;
    }
    const k = item.name.toLowerCase();
    const duplicate = tags.find(t => t.id !== id && t.name.toLowerCase() === k && !t.isDeleted);
    if (duplicate) {
      alert("Такой тег уже существует!");
      upd(id, { name: "" });
    }
  };

  const blurColor = (id) => {
    const idx = tags.findIndex(t => t.id === id);
    if (idx === -1) return;
    const val = tags[idx]?.color;
    upd(id, { color: isHex(val) ? val : "#ffffff" });
  };
   
  const copyColor = (color) => {
    navigator.clipboard.writeText(color).catch(console.error);
  };

  return (
    <div className="field-row">
      {title && <label className="field-label">{title}</label>}
      <div className="category-fields-container">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tags.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tags.map((t, i) => {
              if (t.isDeleted && !showHidden) return null;
              return (
                <SortableItem key={t.id} id={t.id} disabled={t.isDeleted} showHandle={isDragEnabled}>
                   <div className={`category-field-group ${t.isDeleted ? 'is-hidden-item' : ''}`}>
                    <div className="category-container">
                      <div className="category-left">
                        <input
                          ref={(el) => (nameRefs.current[i] = el)}
                          className="text-input"
                          type="text"
                          placeholder="Название тега"
                          value={t.name}
                          onChange={(e) => upd(t.id, { name: e.target.value })}
                          onBlur={() => blurName(t.id)}
                          disabled={t.isDeleted}
                        />
                      </div>
                      <div className="category-right" style={{ flex: "0 0 170px", display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="color"
                          value={isHex(t.color) ? t.color : "#ffffff"}
                          onChange={(e) => upd(t.id, { color: e.target.value })}
                          onBlur={() => blurColor(t.id)}
                          style={{ width: 40, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
                          disabled={t.isDeleted}
                        />
                         <button
                          type="button"
                          title="Копировать цвет"
                          onClick={() => copyColor(t.color)}
                          style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
                        >
                          <Copy size={14} />
                        </button>
                        <input
                          className="text-input"
                          type="text"
                          value={t.color || "#ffffff"}
                          onChange={(e) => upd(t.id, { color: e.target.value })}
                          onBlur={() => blurColor(t.id)}
                          placeholder="#ffffff"
                          disabled={t.isDeleted}
                        />
                      </div>
                      <button
                        type="button"
                        className={`remove-category-btn ${t.isDeleted ? 'restore' : ''}`}
                        onClick={() => (onToggleDelete ? onToggleDelete(t.id, t) : toggleDelete(t.id))}
                        title={t.isDeleted ? "Восстановить" : "Удалить"}
                      >
                        {t.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
        <button type="button" className="add-category-btn" onClick={add}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

const IntervalFields = ({ intervals = [], onIntervalChange, onIntervalBlur, onAddInterval, onToggleDelete, onReorder, showHidden, isDragEnabled }) => {
  const dndId = useMemo(() => rid(), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = intervals.findIndex((item) => item.id === active.id);
      const newIndex = intervals.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(intervals, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  const visibleItems = useMemo(
    () => intervals.map((item, index) => ({ ...item, originalIndex: index }))
                   .filter(item => !item.isDeleted || showHidden),
    [intervals, showHidden]
  );

  return (
    <div className="field-row">
      <label className="field-label">Интервал</label>
      <div className="category-fields-container">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={intervals.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((interval) => {
              const originalIndex = interval.originalIndex;
              return (
                <SortableItem key={interval.id} id={interval.id} disabled={interval.isDeleted} showHandle={isDragEnabled}>
                   <div className={`category-field-group ${interval.isDeleted ? 'is-hidden-item' : ''}`}>
                    <div className="category-container">
                      <div className="category-full">
                        <input
                          type="text"
                          value={interval?.intervalValue || ""}
                          onChange={(e) => onIntervalChange(originalIndex, e.target.value)}
                          onBlur={() => onIntervalBlur(originalIndex)}
                          placeholder="Введите интервал"
                          className="text-input"
                          disabled={interval.isDeleted}
                        />
                      </div>
                      <button
                        type="button"
                        className={`remove-category-btn ${interval.isDeleted ? 'restore' : ''}`}
                        onClick={() => onToggleDelete(originalIndex)}
                        title={interval.isDeleted ? "Восстановить" : "Удалить"}
                      >
                        {interval.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
        <button type="button" className="add-category-btn" onClick={onAddInterval}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

const CategoryFields = ({
  categories = [],
  onCategoryChange,
  onCategoryBlur,
  onAddCategory,
  onToggleDelete,
  openDropdowns = {},
  onToggleDropdown,
  availableIntervals = [],
  showHidden,
  isDragEnabled,
  onReorder
}) => {
  const dndId = useMemo(() => rid(), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(categories, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  const visibleItems = useMemo(
    () => categories.map((item, index) => ({ ...item, originalIndex: index }))
                .filter(item => !item.isDeleted || showHidden),
    [categories, showHidden]
  );

  return (
    <div className="field-row category-field">
      <label className="field-label">Категория</label>
      <div className="category-fields-container">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((category) => {
              const i = category.originalIndex;
              return (
                <SortableItem key={category.id} id={category.id} disabled={category.isDeleted} showHandle={isDragEnabled}>
                  <div className={`category-field-group ${category.isDeleted ? 'is-hidden-item' : ''}`}>
                    <div className="category-container">
                      <div className="category-left">
                        <div className="dropdown-container">
                          <div
                            className={`dropdown-trigger-category ${category.categoryInterval ? "has-value" : ""} ${category.isDeleted ? 'disabled' : ''}`}
                            onClick={(e) => !category.isDeleted && onToggleDropdown(i, e)}
                          >
                            <span className="dropdown-value">{category.categoryInterval || "Выберите интервал"}</span>
                            <span className={`dropdown-arrow ${openDropdowns[`category-${i}-interval`] ? "open" : ""}`}>▼</span>
                          </div>
                          <div className={`dropdown-menu ${openDropdowns[`category-${i}-interval`] ? "open" : ""}`}>
                            {(availableIntervals || []).length > 0 ? (
                              availableIntervals.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={`dropdown-option ${category.categoryInterval === option ? "selected" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCategoryChange(i, "categoryInterval", option);
                                  }}
                                >
                                  {option}
                                </div>
                              ))
                            ) : (
                              <div className="dropdown-option disabled-option">Сначала добавьте интервалы</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="category-right">
                        <input
                          type="text"
                          value={category.categoryValue || ""}
                          onChange={(e) => onCategoryChange(i, "categoryValue", e.target.value)}
                          onBlur={() => onCategoryBlur(i)}
                          placeholder="Введите значение"
                          className="text-input"
                          disabled={category.isDeleted}
                        />
                      </div>
                      <button
                        type="button"
                        className={`remove-category-btn ${category.isDeleted ? 'restore' : ''}`}
                        onClick={() => onToggleDelete(i)}
                        title={category.isDeleted ? "Восстановить" : "Удалить"}
                      >
                        {category.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
        <button type="button" className="add-category-btn" onClick={onAddCategory}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

const ArticleFields = ({ articles = [], onArticleChange, onArticleBlur, onAddArticle, onToggleDelete, showHidden, isDragEnabled, onReorder }) => {
  const dndId = useMemo(() => rid(), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = articles.findIndex((item) => item.id === active.id);
      const newIndex = articles.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(articles, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  const visibleItems = useMemo(
    () => articles.map((item, index) => ({ ...item, originalIndex: index }))
                .filter(item => !item.isDeleted || showHidden),
    [articles, showHidden]
  );
   
  return (
    <div className="field-row">
      <label className="field-label">Статья</label>
      <div className="category-fields-container">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={articles.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((article) => {
              const i = article.originalIndex;
              return (
                <SortableItem key={article.id} id={article.id} disabled={article.isDeleted} showHandle={isDragEnabled}>
                  <div className={`category-field-group ${article.isDeleted ? 'is-hidden-item' : ''}`}>
                    <div className="category-container">
                      <div className="category-full">
                        <input
                          type="text"
                          value={article.articleValue || ""}
                          onChange={(e) => onArticleChange(i, e.target.value)}
                          onBlur={() => onArticleBlur(i)}
                          placeholder="Введите статью"
                          className="text-input"
                          disabled={article.isDeleted}
                        />
                      </div>
                      <button
                        type="button"
                        className={`remove-category-btn ${article.isDeleted ? 'restore' : ''}`}
                        onClick={() => onToggleDelete(i)}
                        title={article.isDeleted ? "Восстановить" : "Удалить"}
                      >
                        {article.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
        <button type="button" className="add-category-btn" onClick={onAddArticle}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

const SubarticleFields = ({
  subarticles = [],
  onSubarticleChange,
  onSubarticleBlur,
  onAddSubarticle,
  onToggleDelete,
  openDropdowns = {},
  onToggleDropdown,
  availableArticles = [],
  availableSubcategories = [],
  showHidden,
  isDragEnabled,
  onReorder
}) => {
  const dndId = useMemo(() => rid(), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = subarticles.findIndex((item) => item.id === active.id);
      const newIndex = subarticles.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(subarticles, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  const visibleItems = useMemo(
    () => subarticles.map((item, index) => ({ ...item, originalIndex: index }))
                       .filter(item => !item.isDeleted || showHidden),
    [subarticles, showHidden]
  );
   
  return (
    <div className="field-row article-field">
      <label className="field-label">Подстатья</label>
      <div className="category-fields-container">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subarticles.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((subarticle) => {
              const i = subarticle.originalIndex;
              return (
                <SortableItem key={subarticle.id} id={subarticle.id} disabled={subarticle.isDeleted} showHandle={isDragEnabled}>
                  <div className={`category-field-group ${subarticle.isDeleted ? 'is-hidden-item' : ''}`}>
                    <div className="category-container">
                      <div className="category-left">
                        <div className="dropdown-container">
                          <div
                            className={`dropdown-trigger-article ${subarticle.subarticleInterval ? "has-value" : ""} ${subarticle.isDeleted ? 'disabled' : ''}`}
                            onClick={(e) => !subarticle.isDeleted && onToggleDropdown(i, e)}
                          >
                            <span className="dropdown-value">{subarticle.subarticleInterval || "Выберите статью/подкатегорию"}</span>
                            <span className={`dropdown-arrow ${openDropdowns[`subarticle-${i}-interval`] ? "open" : ""}`}>▼</span>
                          </div>
                          <div className={`dropdown-menu ${openDropdowns[`subarticle-${i}-interval`] ? "open" : ""}`}>
                            {(availableArticles || []).map((option, optionIndex) => (
                              <div
                                key={`art-${optionIndex}`}
                                className={`dropdown-option ${subarticle.subarticleInterval === option ? "selected" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSubarticleChange(i, "subarticleInterval", option);
                                }}
                              >
                                {option}
                              </div>
                            ))}
                            {(availableSubcategories || []).map((option, optionIndex) => (
                              <div
                                key={`subcat-${optionIndex}`}
                                className={`dropdown-option ${subarticle.subarticleInterval === option ? "selected" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSubarticleChange(i, "subarticleInterval", option);
                                }}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="category-right">
                        <input
                          type="text"
                          value={subarticle.subarticleValue || ""}
                          onChange={(e) => onSubarticleChange(i, "subarticleValue", e.target.value)}
                          onBlur={() => onSubarticleBlur(i)}
                          placeholder="Введите значение"
                          className="text-input"
                          disabled={subarticle.isDeleted}
                        />
                      </div>
                      <button
                        type="button"
                        className={`remove-category-btn ${subarticle.isDeleted ? 'restore' : ''}`}
                        onClick={() => onToggleDelete(i)}
                        title={subarticle.isDeleted ? "Восстановить" : "Удалить"}
                      >
                        {subarticle.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                      </button>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
        <button type="button" className="add-category-btn" onClick={onAddSubarticle}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

const CardDesignUpload = ({ cardDesigns = [], onAdd, onToggleDelete, onError, showHidden, isDragEnabled, onReorder }) => {
  const fileInputRefs = useRef([]);
  const dndId = useMemo(() => rid(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = cardDesigns.findIndex((item) => item.id === active.id);
      const newIndex = cardDesigns.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(cardDesigns, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }));
      onReorder?.(newItems);
    }
  };

  const ensureDesign = (arr, index) => {
    const copy = [...arr];
    copy[index] = {
      id: copy[index]?.id || rid(),
      name: copy[index]?.name || "",
      url: copy[index]?.url || "",
      size: copy[index]?.size ?? null,
      isDeleted: copy[index]?.isDeleted || false,
    };
    return copy;
  };

  const triggerFile = (i) => fileInputRefs.current[i]?.click();

  const handleFileUpload = (event, index) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      onError?.({ title: "Неверный формат файла", message: "Выберите изображение." });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError?.({ title: "Слишком большой файл", message: "Максимум 5 МБ." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const next = ensureDesign(cardDesigns, index);
      next[index] = { ...next[index], url: e.target.result, size: file.size };
      onAdd(next);
    };
    reader.onerror = () => onError?.({ title: "Ошибка чтения", message: "Не удалось прочитать файл." });
    reader.readAsDataURL(file);
    event.target.value = "";
  };
   
  const handleRemoveImage = (e, index) => {
    e.stopPropagation();
    const next = ensureDesign(cardDesigns, index);
    next[index] = { ...next[index], url: "", size: null };
    onAdd(next);
  };

  const handleNameChange = (index, newName) => {
    const next = ensureDesign(cardDesigns, index);
    next[index] = { ...next[index], name: newName };
    onAdd(next);
  };

  const addEmpty = () => onAdd([...(cardDesigns || []), { id: rid(), name: "", url: "", size: null, isDeleted: false, order: (cardDesigns || []).length }]);

  const visibleItems = useMemo(
    () => cardDesigns.map((item, index) => ({ ...item, originalIndex: index }))
                     .filter(item => !item.isDeleted || showHidden),
    [cardDesigns, showHidden]
  );

  return (
    <div className="category-fields-container">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardDesigns.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {visibleItems.map((design) => {
            const i = design.originalIndex;
            return (
              <SortableItem key={design.id} id={design.id} disabled={design.isDeleted} showHandle={isDragEnabled}>
                <div className={`category-field-group ${design.isDeleted ? 'is-hidden-item' : ''}`}>
                  <div className="card-design-row">
                    <div className="card-design-input">
                      <input
                        type="text"
                        value={design.name || ""}
                        onChange={(e) => handleNameChange(i, e.target.value)}
                        placeholder="Введите название дизайна"
                        className="text-input"
                        disabled={design.isDeleted}
                      />
                    </div>
                    <div className="card-design-upload">
                      <input
                        ref={(el) => (fileInputRefs.current[i] = el)}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, i)}
                        style={{ display: "none" }}
                        disabled={design.isDeleted}
                      />
                      {design.url ? (
                        <div className="card-design-item">
                          <div
                            className="card-design-preview"
                            title={design.isDeleted ? design.name : "Кликните, чтобы заменить"}
                            onClick={() => !design.isDeleted && triggerFile(i)}
                            style={{ position: 'relative' }} 
                          >
                            <img src={safeFileUrl(design.url)} alt={design.name || "design"} className="card-design-image" />
                             
                            {!design.isDeleted && (
                              <button 
                                type="button"
                                className="remove-image-overlay-btn"
                                onClick={(e) => handleRemoveImage(e, i)}
                                title="Удалить изображение"
                              >
                                 <X size={14} color="white" />
                              </button>
                            )}
                          </div>

                          <div className="card-design-actions">
                            <button
                              type="button"
                              className="upload-design-btn"
                              onClick={() => triggerFile(i)}
                              disabled={design.isDeleted}
                            >
                              Заменить
                            </button>
                            <button
                              type="button"
                              className={`remove-category-btn ${design.isDeleted ? 'restore' : ''}`}
                              onClick={() => onToggleDelete(i)}
                              title={design.isDeleted ? "Восстановить" : "Удалить"}
                            >
                              {design.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="upload-design-btn"
                          onClick={() => triggerFile(i)}
                          disabled={design.isDeleted}
                        >
                          + Загрузить изображение
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
      <button type="button" className="add-category-btn" onClick={addEmpty}>
        <Plus size={20} color='white'/> Добавить
      </button>
    </div>
  );
};


function FieldsPage() {
  const { refreshFields } = useFields(); 
  
  const [selectedValues, setSelectedValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return saved || "generalFields";
  });

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const [openDropdowns, setOpenDropdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [inactiveLoaded, setInactiveLoaded] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  const loadSavedOrders = () => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return mergeFieldOrders(parsed);
      }
    } catch (e) {
      console.error("Failed to load field orders", e);
    }
    return mergeFieldOrders();
  };

  const [fieldOrders, setFieldOrders] = useState(loadSavedOrders);
  const [savedFieldOrders, setSavedFieldOrders] = useState(loadSavedOrders);

  const [modal, setModal] = useState({
    open: false, title: "", message: "", confirmText: "OK", cancelText: "Отмена", onConfirm: null, onCancel: null,
  });

  const containerRef = useRef(null);
  const pageDndId = useMemo(() => rid(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const openErrorModal = (title, message) => {
    setModal({
      open: true, title, message, confirmText: "OK", cancelText: "Закрыть",
      onConfirm: closeModal,
      onCancel: closeModal,
    });
  };

  const openChoiceModal = ({ title, message, onSave, onDiscard }) => {
    setModal({
      open: true, title, message, confirmText: "Сохранить", cancelText: "Не сохранять",
      onConfirm: async () => { closeModal(); await onSave?.(); },
      onCancel: () => { closeModal(); onDiscard?.(); },
    });
  };

  const openDeleteFieldModal = ({ fieldLabel, onConfirm }) => {
    const safeFieldLabel = tidy(fieldLabel) || "Без названия";
    setModal({
      open: true,
      title: "Удалить поле?",
      message: `Удалить поле "${safeFieldLabel}"?\n\nПосле сохранения восстановить его будет нельзя.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      onConfirm: async () => {
        closeModal();
        await onConfirm?.();
      },
      onCancel: closeModal,
    });
  };

  const requestDeleteToggle = ({ item, fieldLabel, onToggle }) => {
    if (!item) return;
    if (item.isDeleted || item.isLinked === true) {
      onToggle?.();
      return;
    }
    openDeleteFieldModal({ fieldLabel, onConfirm: onToggle });
  };

  const checkChanges = (newValues, newOrders) => {
    const isValuesChanged = JSON.stringify(newValues) !== JSON.stringify(savedValues);
    const isOrdersChanged = JSON.stringify(newOrders) !== JSON.stringify(savedFieldOrders);
    setHasChanges(isValuesChanged || isOrdersChanged);
  };

  const applyAndCheck = (next) => {
    setSelectedValues(next);
    checkChanges(next, fieldOrders);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setForbidden(false);
      try {
        const raw = await fetchFields();
        const normalized = applyFieldsPagePreset(withDefaults(raw));
        if (!mounted) return;
        setSelectedValues(normalized);
        setSavedValues(normalized);
        setHasChanges(false);
      } catch (e) {
        if (isForbiddenError(e)) {
          if (!mounted) return;
          setForbidden(true);
        } else {
          openErrorModal("Ошибка загрузки списков", e?.message || "Не удалось получить данные с сервера.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpenDropdowns({});
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = serializeForSave(prepareFieldsPageSaveValues(selectedValues));
      await saveFields(payload);
      
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fieldOrders));
      setSavedFieldOrders(fieldOrders);

      const nextSavedValues = clone(selectedValues); 
      setSelectedValues(nextSavedValues);
      setSavedValues(nextSavedValues); 
      setHasChanges(false);
      setOpenDropdowns({});

      await refreshFields();

      if (pendingTab) {
        setActiveTab(pendingTab);
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, pendingTab);
        setPendingTab(null);
      }
    } catch (e) {
      openErrorModal("Ошибка сохранения", e?.message || "Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAll = () => {
    setSelectedValues(savedValues);
    setFieldOrders(savedFieldOrders);
    setHasChanges(false);
    setOpenDropdowns({});
    setShowHidden(false);
    setInactiveLoaded(false);
  };

  const onTabClick = (tabKey) => {
    if (tabKey === activeTab) return;
    if (!hasChanges) {
      setActiveTab(tabKey);
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabKey);
      setOpenDropdowns({});
      return;
    }
    setPendingTab(tabKey);
    openChoiceModal({
      title: "Сохранить изменения?",
      message: "Вы изменили данные. Сохранить перед переключением вкладки?",
      onSave: handleSave,
      onDiscard: () => {
        setSelectedValues(savedValues);
        setFieldOrders(savedFieldOrders);
        setHasChanges(false);
        setActiveTab(tabKey);
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabKey);
        setPendingTab(null);
        setOpenDropdowns({});
        setShowHidden(false);
        setInactiveLoaded(false);
      },
    });
  };

  const handleInputChange = (fieldGroup, fieldName, value) => {
    const next = { ...selectedValues, 
      [fieldGroup]: { 
        ...(selectedValues[fieldGroup] || {}),
        [fieldName]: value 
      } 
    };
    applyAndCheck(next);
  };

  useEffect(() => {
  if (showHidden && !inactiveLoaded && !loadingInactive) {
    let mounted = true;
    (async () => {
      setLoadingInactive(true);
      try {
        const rawInactive = await fetchInactiveFields();
        const normalizedInactive = withDefaults(rawInactive);

        if (!mounted) return;

        const mergeInactive = (currentSelectedValues) => {
          const nextValues = clone(currentSelectedValues);
          const activeIds = {}; 
          const sortByConfiguredOrder = (list) =>
            [...list].sort((a, b) => {
              const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
              const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return 0;
            });

          for (const groupKey of Object.keys(normalizedInactive)) {
            const group = normalizedInactive[groupKey];
            if (!nextValues[groupKey] || typeof group !== 'object' || group === null) continue;
            
            activeIds[groupKey] = {};

            for (const fieldKey of Object.keys(group)) {
              if (!nextValues[groupKey].hasOwnProperty(fieldKey)) continue;

              const activeList = nextValues[groupKey][fieldKey] || [];
              activeIds[groupKey][fieldKey] = new Set(activeList.map(item => item.id));

              const inactiveList = (group[fieldKey] || []).map(item => ({
                ...item,
                isDeleted: true
              }));

              const currentActiveIds = activeIds[groupKey][fieldKey];
              const mergedList = sortByConfiguredOrder([
                ...activeList,
                ...inactiveList.filter(item => !currentActiveIds.has(item.id))
              ]);

              nextValues[groupKey][fieldKey] = mergedList;
            }
          }
          return nextValues; 
        };

        setSelectedValues(mergeInactive);
        setInactiveLoaded(true); 

      } catch (e) {
        openErrorModal("Ошибка загрузки скрытых полей", e?.message || "Не удалось получить данные.");
      } finally {
        if (mounted) setLoadingInactive(false);
      }
    })();

    return () => { mounted = false; };
  }
}, [showHidden, inactiveLoaded, loadingInactive]);

  const handleStringItemChange = (group, field, index, newValue) => {
    const list = selectedValues[group]?.[field] || [];
    const copy = [...list];
    copy[index] = { ...copy[index], value: newValue };
    handleInputChange(group, field, copy);
  };
  
  const handleStringItemToggleDelete = (group, field, index) => {
    const list = selectedValues[group]?.[field] || [];
    const copy = [...list];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange(group, field, copy);
  };
  
  const handleStringItemAdd = (group, field) => {
    const list = selectedValues[group]?.[field] || [];
    const newItem = { id: rid(), value: "", isDeleted: false, order: list.length };
    handleInputChange(group, field, [...list, newItem]);
  };

  const handleStringItemBlur = (group, field, index) => {
    const list = selectedValues[group]?.[field] || [];
    const item = list[index];
    
    if (!tidy(item.value) && !item.isDeleted) {
      handleInputChange(group, field, list.filter((_, i) => i !== index));
      return;
    }

    const k = tidy(item.value).toLowerCase();
    const duplicate = list.find((it, i) => i !== index && tidy(it.value).toLowerCase() === k && !it.isDeleted);
    
    if (duplicate) {
      alert("Такое значение уже существует!");
      const copy = [...list];
      copy[index] = { ...copy[index], value: "" }; 
      handleInputChange(group, field, copy);
    }
  };

  const updateIntervalValue = (originalIndex, value) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const copy = [...intervals];
    copy[originalIndex] = { ...copy[originalIndex], intervalValue: value };
    handleInputChange("orderFields", "intervals", copy);
  };

  const validateIntervalOnBlur = (originalIndex) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const item = intervals[originalIndex];
    const value = tidy(item.intervalValue);
    if (!value && !item.isDeleted) {
      handleInputChange("orderFields", "intervals", intervals.filter((_, i) => i !== originalIndex));
      return;
    }
    const isDuplicate = intervals.some((it, i) => i !== originalIndex && !it.isDeleted && tidy(it.intervalValue).toLowerCase() === value.toLowerCase());
    if (isDuplicate) {
      alert("Такой интервал уже существует!");
      const copy = [...intervals];
      copy[originalIndex] = { ...copy[originalIndex], intervalValue: "" };
      handleInputChange("orderFields", "intervals", copy);
    }
  };

  const toggleDeleteInterval = (originalIndex) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const copy = [...intervals];
    copy[originalIndex] = { ...copy[originalIndex], isDeleted: !copy[originalIndex].isDeleted };
    handleInputChange("orderFields", "intervals", copy);
  };

  const updateCategoryValue = (originalIndex, field, value) => {
    const categories = selectedValues.orderFields.categories || [];
    const copy = [...categories];
    copy[originalIndex] = { ...copy[originalIndex], [field]: value };
    handleInputChange("orderFields", "categories", copy);
    if (field === "categoryInterval") {
      setOpenDropdowns((prev) => ({ ...prev, [`category-${originalIndex}-interval`]: false }));
    }
  };

  const validateCategoryOnBlur = (originalIndex) => {
    const categories = selectedValues.orderFields.categories || [];
    const current = categories[originalIndex];
    const value = tidy(current?.categoryValue);
    const interval = tidy(current?.categoryInterval);

    if (!value && !interval && !current.isDeleted) {
      handleInputChange("orderFields", "categories", categories.filter((_, i) => i !== originalIndex));
      return;
    }
    if (!value) return; 

    const isDuplicate = categories.some((item, i) => i !== originalIndex && !item.isDeleted && tidy(item.categoryInterval).toLowerCase() === interval.toLowerCase() && tidy(item.categoryValue).toLowerCase() === value.toLowerCase());

    if (isDuplicate) {
      alert("Такая категория уже существует в этом интервале!");
      const copy = [...categories];
      copy[originalIndex] = { ...copy[originalIndex], categoryValue: "" };
      handleInputChange("orderFields", "categories", copy);
    }
  };
  
  const toggleDeleteCategory = (originalIndex) => {
    const categories = selectedValues.orderFields.categories || [];
    const copy = [...categories];
    copy[originalIndex] = { ...copy[originalIndex], isDeleted: !copy[originalIndex].isDeleted };
    handleInputChange("orderFields", "categories", copy);
  };

  const addInterval = () => handleInputChange("orderFields", "intervals", [...(selectedValues.orderFields.intervals || []), { id: rid(), intervalValue: "", isDeleted: false, order: (selectedValues.orderFields.intervals || []).length }]);
  const addCategory = () => handleInputChange("orderFields", "categories", [...(selectedValues.orderFields.categories || []), { id: rid(), categoryInterval: "", categoryValue: "", isDeleted: false, order: (selectedValues.orderFields.categories || []).length }]);

  const updateArticleValue = (originalIndex, value) => {
    const articles = selectedValues.financeFields.articles || [];
    const copy = [...articles];
    copy[originalIndex] = { ...copy[originalIndex], articleValue: value };
    handleInputChange("financeFields", "articles", copy);
  };

  const validateArticleOnBlur = (originalIndex) => {
    const articles = selectedValues.financeFields.articles || [];
    const item = articles[originalIndex];
    const value = tidy(item.articleValue);

    if (!value && !item.isDeleted) {
      handleInputChange("financeFields", "articles", articles.filter((_, i) => i !== originalIndex));
      return;
    }
    const isDuplicate = articles.some((it, i) => i !== originalIndex && !it.isDeleted && tidy(it.articleValue).toLowerCase() === value.toLowerCase());
    if (isDuplicate) {
      alert("Такая статья уже существует!");
      const copy = [...articles];
      copy[originalIndex] = { ...copy[originalIndex], articleValue: "" };
      handleInputChange("financeFields", "articles", copy);
    }
  };
  
  const toggleDeleteArticle = (originalIndex) => {
    const articles = selectedValues.financeFields.articles || [];
    const copy = [...articles];
    copy[originalIndex] = { ...copy[originalIndex], isDeleted: !copy[originalIndex].isDeleted };
    handleInputChange("financeFields", "articles", copy);
  };

  const updateSubarticleValue = (originalIndex, field, value) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const copy = [...subs];
    copy[originalIndex] = { ...copy[originalIndex], [field]: value };
    handleInputChange("financeFields", "subarticles", copy);
    if (field === "subarticleInterval") {
      setOpenDropdowns((prev) => ({ ...prev, [`subarticle-${originalIndex}-interval`]: false }));
    }
  };

  const validateSubarticleOnBlur = (originalIndex) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const current = subs[originalIndex];
    const value = tidy(current?.subarticleValue);
    const interval = tidy(current?.subarticleInterval);
    if (!value && !interval && !current.isDeleted) {
      handleInputChange("financeFields", "subarticles", subs.filter((_, i) => i !== originalIndex));
      return;
    }
    if (!value) return;
    const isDuplicate = subs.some((item, i) => i !== originalIndex && !item.isDeleted && tidy(item.subarticleInterval).toLowerCase() === interval.toLowerCase() && tidy(item.subarticleValue).toLowerCase() === value.toLowerCase());
    if (isDuplicate) {
      alert("Такая подстатья уже существует!");
      const copy = [...subs];
      copy[originalIndex] = { ...copy[originalIndex], subarticleValue: "" };
      handleInputChange("financeFields", "subarticles", copy);
    }
  };
  
  const toggleDeleteSubarticle = (originalIndex) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const copy = [...subs];
    copy[originalIndex] = { ...copy[originalIndex], isDeleted: !copy[originalIndex].isDeleted };
    handleInputChange("financeFields", "subarticles", copy);
  };
  
  const addArticle = () => handleInputChange("financeFields", "articles", [...(selectedValues.financeFields.articles || []), { id: rid(), articleValue: "", isDeleted: false, order: (selectedValues.financeFields.articles || []).length }]);
  const addSubarticle = () => handleInputChange("financeFields", "subarticles", [...(selectedValues.financeFields.subarticles || []), { id: rid(), subarticleInterval: "", subarticleValue: "", isDeleted: false, order: (selectedValues.financeFields.subarticles || []).length }]);

  const updateCardDesigns = (newItems) => handleInputChange("assetsFields", "cardDesigns", newItems);
  const toggleDeleteCardDesign = (index) => {
    const designs = selectedValues.assetsFields.cardDesigns || [];
    const copy = [...designs];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("assetsFields", "cardDesigns", copy);
  };

  const requestDeleteCardDesign = (index, item) => {
    requestDeleteToggle({
      item,
      fieldLabel: item?.name,
      onToggle: () => toggleDeleteCardDesign(index),
    });
  };

  const toggleTagDelete = (group, field, id) => {
    const list = selectedValues[group]?.[field] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return;
    const copy = [...list];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange(group, field, copy);
  };

  const requestTagDelete = (group, field, id, item) => {
    requestDeleteToggle({
      item,
      fieldLabel: item?.name,
      onToggle: () => toggleTagDelete(group, field, id),
    });
  };

  const toggleCategoryDropdown = (index, e) => {
    e.stopPropagation();
    const key = `category-${index}-interval`;
    setOpenDropdowns((prev) => ({ [key]: !prev[key] }));
  };
  const toggleSubarticleDropdown = (index, e) => {
    e.stopPropagation();
    const key = `subarticle-${index}-interval`;
    setOpenDropdowns((prev) => ({ [key]: !prev[key] }));
  };

  const handleSectionDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setFieldOrders((prevOrders) => {
        const currentOrder = prevOrders[activeTab] || [];
        const oldIndex = currentOrder.indexOf(active.id);
        const newIndex = currentOrder.indexOf(over.id);
        
        const newOrderList = arrayMove(currentOrder, oldIndex, newIndex);
        const newOrders = {
          ...prevOrders,
          [activeTab]: newOrderList,
        };
        
        checkChanges(selectedValues, newOrders);
        return newOrders;
      });
    }
  };

  const intervalsOptions = useMemo(() => (selectedValues.orderFields.intervals || []).filter(i => !i.isDeleted).map((i) => tidy(i.intervalValue)).filter(Boolean), [selectedValues.orderFields.intervals]);
  const articleOptions = useMemo(() => (selectedValues.financeFields.articles || []).filter(a => !a.isDeleted).map((a) => tidy(a.articleValue)).filter(Boolean), [selectedValues.financeFields.articles]);
  const subcategoryOptions = useMemo(() => (selectedValues.financeFields.subcategory || []).filter(sc => !sc.isDeleted).map(sc => sc.value).filter(Boolean), [selectedValues.financeFields.subcategory]);

  const renderActiveTabFields = () => {
    const currentOrder = fieldOrders[activeTab] || [];
    let componentsMap = {};

    switch (activeTab) {
      case "generalFields":
        componentsMap = {
          currency: (
            <div className="field-row">
              <label className="field-label">Валюта</label>
              <EditableList
                items={buildFixedCurrencyList(selectedValues.generalFields?.currency || [], false)}
                onChange={() => {}}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("generalFields", "currency", index, item)}
                onCommit={() => {}}
                onReorder={(newItems) => handleInputChange("generalFields", "currency", newItems)}
                placeholder="Код валюты"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
                readOnly
              />
            </div>
          ),
          country: (
            <div className="field-row">
              <label className="field-label">Страна</label>
              <EditableList
                items={selectedValues.generalFields?.country || []}
                onChange={(index, val) => handleStringItemChange("generalFields", "country", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("generalFields", "country", index, item)}
                onAdd={() => handleStringItemAdd("generalFields", "country")}
                onCommit={(index) => handleStringItemBlur("generalFields", "country", index)}
                onReorder={(newItems) => handleInputChange("generalFields", "country", newItems)}
                placeholder="Название страны"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          businessLine: (
            <div className="field-row">
              <label className="field-label">Направление бизнеса</label>
              <EditableList
                items={selectedValues.generalFields?.businessLine || []}
                onChange={(index, val) => handleStringItemChange("generalFields", "businessLine", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("generalFields", "businessLine", index, item)}
                onAdd={() => handleStringItemAdd("generalFields", "businessLine")}
                onCommit={(index) => handleStringItemBlur("generalFields", "businessLine", index)}
                onReorder={(newItems) => handleInputChange("generalFields", "businessLine", newItems)}
                placeholder="Введите направление"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          )
        };
        break;

      case "orderFields":
        componentsMap = {
          intervals: (
            <IntervalFields
              intervals={selectedValues.orderFields.intervals || []}
              onIntervalChange={updateIntervalValue} 
              onIntervalBlur={validateIntervalOnBlur}
              onAddInterval={addInterval}
              onToggleDelete={requestDeleteInterval}
              onReorder={(newItems) => handleInputChange("orderFields", "intervals", newItems)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          ),
          categories: (
            <CategoryFields
              categories={selectedValues.orderFields.categories || []}
              onCategoryChange={updateCategoryValue}
              onCategoryBlur={validateCategoryOnBlur}
              onAddCategory={addCategory}
              onToggleDelete={requestDeleteCategory}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleCategoryDropdown}
              availableIntervals={intervalsOptions}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
              onReorder={(newItems) => handleInputChange("orderFields", "categories", newItems)}
            />
          ),
          statuses: (
            <div className="field-row">
              <label className="field-label">Статусы заказа</label>
              <EditableList
                items={selectedValues.orderFields.statuses || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "statuses", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "statuses", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "statuses")}
                onCommit={(index) => handleStringItemBlur("orderFields", "statuses", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "statuses", newItems)}
                placeholder="Введите статус заказа"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          closeReasons: (
            <div className="field-row">
              <label className="field-label">Причины закрытия</label>
              <EditableList
                items={selectedValues.orderFields.closeReasons || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "closeReasons", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "closeReasons", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "closeReasons")}
                onCommit={(index) => handleStringItemBlur("orderFields", "closeReasons", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "closeReasons", newItems)}
                placeholder="Введите причину закрытия"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          projects: (
            <div className="field-row">
              <label className="field-label">Проекты</label>
              <EditableList
                items={selectedValues.orderFields.projects || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "projects", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "projects", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "projects")}
                onCommit={(index) => handleStringItemBlur("orderFields", "projects", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "projects", newItems)}
                placeholder="Введите проект"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          discountReason: (
            <div className="field-row">
              <label className="field-label">Причина скидки</label>
              <EditableList
                items={selectedValues.orderFields.discountReason || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "discountReason", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "discountReason", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "discountReason")}
                onCommit={(index) => handleStringItemBlur("orderFields", "discountReason", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "discountReason", newItems)}
                placeholder="Введите причину скидки"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          minOrderAmount: (
            <div className="field-row">
              <label className="field-label">Минимальная сумма</label>
              <EditableList
                items={selectedValues.orderFields.minOrderAmount || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "minOrderAmount", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "minOrderAmount", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "minOrderAmount")}
                onCommit={(index) => handleStringItemBlur("orderFields", "minOrderAmount", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "minOrderAmount", newItems)}
                placeholder="Введите сумму"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          readySolution: (
            <div className="field-row">
              <label className="field-label">Готовое решение</label>
              <EditableList
                items={selectedValues.orderFields.readySolution || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "readySolution", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("orderFields", "readySolution", index, item)}
                onAdd={() => handleStringItemAdd("orderFields", "readySolution")}
                onCommit={(index) => handleStringItemBlur("orderFields", "readySolution", index)}
                onReorder={(newItems) => handleInputChange("orderFields", "readySolution", newItems)}
                placeholder="Введите готовое решение"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          tags: (
            <TagList
              title="Теги заказа"
              tags={selectedValues.orderFields.tags || []}
              onChange={(v) => handleInputChange("orderFields", "tags", v)}
              onToggleDelete={(id, item) => requestTagDelete("orderFields", "tags", id, item)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          ),
          techTags: (
            <TagList
              title="Теги технологий"
              tags={selectedValues.orderFields.techTags || []}
              onChange={(v) => handleInputChange("orderFields", "techTags", v)}
              onToggleDelete={(id, item) => requestTagDelete("orderFields", "techTags", id, item)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          ),
          taskTags: (
            <TagList
              title="Теги задач"
              tags={selectedValues.orderFields.taskTags || []}
              onChange={(v) => handleInputChange("orderFields", "taskTags", v)}
              onToggleDelete={(id, item) => requestTagDelete("orderFields", "taskTags", id, item)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          )
        };
        break;

      case "executorFields":
        componentsMap = {
          role: (
            <div className="field-row">
              <label className="field-label">Роль</label>
              <EditableList
                items={selectedValues.executorFields.role || []}
                onChange={(index, val) => handleStringItemChange("executorFields", "role", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("executorFields", "role", index, item)}
                onAdd={() => handleStringItemAdd("executorFields", "role")}
                onCommit={(index) => handleStringItemBlur("executorFields", "role", index)}
                onReorder={(newItems) => handleInputChange("executorFields", "role", newItems)}
                placeholder="Введите роль"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          )
        };
        break;

      case "clientFields":
        componentsMap = {
          category: (
            <div className="field-row">
              <label className="field-label">Категория</label>
              <EditableList
                items={selectedValues.clientFields.category || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "category", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("clientFields", "category", index, item)}
                onAdd={() => handleStringItemAdd("clientFields", "category")}
                onCommit={(index) => handleStringItemBlur("clientFields", "category", index)}
                onReorder={(newItems) => handleInputChange("clientFields", "category", newItems)}
                placeholder="Введите категорию"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          source: (
            <div className="field-row">
              <label className="field-label">Источник</label>
              <EditableList
                items={selectedValues.clientFields.source || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "source", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("clientFields", "source", index, item)}
                onAdd={() => handleStringItemAdd("clientFields", "source")}
                onCommit={(index) => handleStringItemBlur("clientFields", "source", index)}
                onReorder={(newItems) => handleInputChange("clientFields", "source", newItems)}
                placeholder="Введите источник"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          business: (
            <div className="field-row">
              <label className="field-label">Вид деятельности</label>
              <EditableList
                items={selectedValues.clientFields.business || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "business", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("clientFields", "business", index, item)}
                onAdd={() => handleStringItemAdd("clientFields", "business")}
                onCommit={(index) => handleStringItemBlur("clientFields", "business", index)}
                onReorder={(newItems) => handleInputChange("clientFields", "business", newItems)}
                placeholder="Введите вид бизнеса"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          tags: (
            <TagList
              title="Теги клиента"
              tags={selectedValues.clientFields.tags || []}
              onChange={(v) => handleInputChange("clientFields", "tags", v)}
              onToggleDelete={(id, item) => requestTagDelete("clientFields", "tags", id, item)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          )
        };
        break;

      case "companyFields":
        componentsMap = {
          tags: (
            <div className="field-row">
              <TagList
                title="Теги компании"
                tags={selectedValues.companyFields?.tags || []}
                onChange={(v) => handleInputChange("companyFields", "tags", v)}
                onToggleDelete={(id, item) => requestTagDelete("companyFields", "tags", id, item)}
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          )
        };
        break;

      case "employeeFields":
        componentsMap = {
          tags: (
            <TagList
              title="Теги сотрудника"
              tags={selectedValues.employeeFields.tags || []}
              onChange={(v) => handleInputChange("employeeFields", "tags", v)}
              onToggleDelete={(id, item) => requestTagDelete("employeeFields", "tags", id, item)}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
            />
          )
        };
        break;

      case "assetsFields":
        componentsMap = {
          type: (
            <div className="field-row">
              <label className="field-label">Тип</label>
              <EditableList
                items={selectedValues.assetsFields.type || []}
                onChange={(index, val) => handleStringItemChange("assetsFields", "type", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("assetsFields", "type", index, item)}
                onAdd={() => handleStringItemAdd("assetsFields", "type")}
                onCommit={(index) => handleStringItemBlur("assetsFields", "type", index)}
                onReorder={(newItems) => handleInputChange("assetsFields", "type", newItems)}
                placeholder="Введите тип"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          paymentSystem: (
            <div className="field-row">
              <label className="field-label">Платежная система</label>
              <EditableList
                items={selectedValues.assetsFields.paymentSystem || []}
                onChange={(index, val) => handleStringItemChange("assetsFields", "paymentSystem", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("assetsFields", "paymentSystem", index, item)}
                onAdd={() => handleStringItemAdd("assetsFields", "paymentSystem")}
                onCommit={(index) => handleStringItemBlur("assetsFields", "paymentSystem", index)}
                onReorder={(newItems) => handleInputChange("assetsFields", "paymentSystem", newItems)}
                placeholder="Введите платежную систему"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          cardDesigns: (
            <div className="field-row">
              <label className="field-label">Дизайн карты</label>
              <CardDesignUpload
                cardDesigns={selectedValues.assetsFields.cardDesigns || []}
                onAdd={(newItems) => updateCardDesigns(newItems)}
                onToggleDelete={requestDeleteCardDesign}
                onError={({ title, message }) => openErrorModal(title, message)}
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
                onReorder={(newItems) => handleInputChange("assetsFields", "cardDesigns", newItems)}
              />
            </div>
          )
        };
        break;

      case "financeFields":
        componentsMap = {
          articles: (
            <ArticleFields
              articles={selectedValues.financeFields?.articles || []}
              onArticleChange={updateArticleValue}
              onArticleBlur={validateArticleOnBlur}
              onAddArticle={addArticle}
              onToggleDelete={requestDeleteArticle}
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
              onReorder={(newItems) => handleInputChange("financeFields", "articles", newItems)}
            />
          ),
          subcategory: (
            <div className="field-row">
              <label className="field-label">Подкатегория</label>
              <EditableList
                items={selectedValues.financeFields?.subcategory || []}
                onChange={(index, val) => handleStringItemChange("financeFields", "subcategory", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("financeFields", "subcategory", index, item)}
                onAdd={() => handleStringItemAdd("financeFields", "subcategory")}
                onCommit={(index) => handleStringItemBlur("financeFields", "subcategory", index)}
                onReorder={(newItems) => handleInputChange("financeFields", "subcategory", newItems)}
                placeholder="Введите подкатегорию"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          ),
          subarticles: (
            <SubarticleFields
              subarticles={selectedValues.financeFields?.subarticles || []}
              onSubarticleChange={updateSubarticleValue}
              onSubarticleBlur={validateSubarticleOnBlur}
              onAddSubarticle={addSubarticle}
              onToggleDelete={requestDeleteSubarticle}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleSubarticleDropdown}
              availableArticles={articleOptions}
              availableSubcategories={subcategoryOptions} 
              showHidden={showHidden}
              isDragEnabled={isDragEnabled}
              onReorder={(newItems) => handleInputChange("financeFields", "subarticles", newItems)}
            />
          )
        };
        break;

      case "sundryFields":
        componentsMap = {
          typeWork: (
            <div className="field-row">
              <label className="field-label">Тип работы</label>
              <EditableList
                items={selectedValues.sundryFields?.typeWork || []} 
                onChange={(index, val) => handleStringItemChange("sundryFields", "typeWork", index, val)}
                onToggleDelete={(index, item) => requestStringItemToggleDelete("sundryFields", "typeWork", index, item)}
                onAdd={() => handleStringItemAdd("sundryFields", "typeWork")}
                onCommit={(index) => handleStringItemBlur("sundryFields", "typeWork", index)}
                onReorder={(newItems) => handleInputChange("sundryFields", "typeWork", newItems)}
                placeholder="Введите тип работы"
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          )
        };
        break;
        
      case "taskFields": 
        componentsMap = {
          tags: (
            <div className="field-row">
              <TagList
                title="Теги задач"
                tags={selectedValues.taskFields?.tags || []}
                onChange={(v) => handleInputChange("taskFields", "tags", v)}
                onToggleDelete={(id, item) => requestTagDelete("taskFields", "tags", id, item)}
                showHidden={showHidden}
                isDragEnabled={isDragEnabled}
              />
            </div>
          )
        };
        break;

      default:
        return null;
    }

    return (
      <div className="fields-vertical-grid" style={{ transition: 'padding 0.2s' }}>
         <DndContext id={pageDndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={currentOrder} strategy={verticalListSortingStrategy}>
            {currentOrder.map((key) => {
              if (!componentsMap[key]) return null;
              return (
                <SortableFieldRow key={key} id={key} isDragEnabled={isDragEnabled}>
                  {componentsMap[key]}
                </SortableFieldRow>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="fields-main-container">
      <Sidebar />
      <div className="fields-main-container-wrapper">
        <div className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                <PageHeaderIcon pageName="Настройки полей" />
                ПОЛЯ
              </h1>
            </div>
            
            <div className="fields-view-toggle-buttons">
              <button
                type="button"
                className={`fields-view-mode-button ${isDragEnabled ? 'active' : ''}`}
                title={isDragEnabled ? "Выключить сортировку" : "Включить сортировку"}
                onClick={() => setIsDragEnabled(!isDragEnabled)}
                disabled={saving || loading || forbidden}
              >
                <Move size={20} />
              </button>

              <button
                type="button"
                className={`fields-view-mode-button ${showHidden ? 'active' : ''}`}
                title={showHidden ? "Скрыть удаленные" : "Показать удаленные"}
                onClick={() => setShowHidden(!showHidden)}
                disabled={saving || loading || forbidden}
              >
                {showHidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="header-actions">
              {loading && <span className="loading-label">Загрузка…</span>}
              {saving && <span className="loading-label">Сохранение…</span>}
              
              {hasChanges && !saving && !loading && (
                <>
                  <button type="button" className="cancel-order-btn" onClick={handleCancelAll}>Отменить</button>
                  <button type="button" className="save-order-btn" onClick={handleSave}>Сохранить</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="fields-container">
          {forbidden ? (
            <NoAccessState
              title='Нет доступа к разделу "Поля"'
              description="У вашей учетной записи недостаточно прав для просмотра и редактирования настроек полей."
              note="Если доступ нужен, обратитесь к администратору."
            />
          ) : (
            <div className="main-content-wrapper">
              <div className="tabs-content-wrapper">
                <div className="tabs-container">
                  {tabsConfig
                    .filter(tab => tab.key !== "miscFields")
                    .map((tab) => (
                      <button
                        key={tab.key}
                        className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => onTabClick(tab.key)}
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                </div>

                <div className="fields-content">
                  <div className="fields-box">{renderActiveTabFields()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <ConfirmationModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </div>
  );
}

export default FieldsPage;
