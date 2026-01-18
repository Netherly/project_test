import React, { useState, useRef, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Fields.css";

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
// =========================
import { fileUrl } from "../api/http";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";
import PageHeaderIcon from "../components/HeaderIcon/PageHeaderIcon.jsx"
import { Copy, Plus, Eye, EyeOff, Check, Undo2, X } from 'lucide-react'; 

/* =========================
   Константы
   ========================= */
const MAX_IMAGE_BYTES = 500 * 1024;

const safeFileUrl = (u) => {
  if (!u) return "";
  const s = tidy(u);
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  try { return fileUrl(s); } catch { return s; }
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

/* =========================
   Стартовые значения
   ========================= */
const initialValues = {
  generalFields: {
    currency: [],
  },
  orderFields: {
    intervals: [{ id: rid(), intervalValue: "", isDeleted: false }],
    categories: [{ id: rid(), categoryInterval: "", categoryValue: "", isDeleted: false }],
    tags: [],
    techTags: [],
    taskTags: [],
    discountReason: [],
  },
  executorFields: { role: [] },
  clientFields: { source: [], category: [], country: [], tags: [] },
  companyFields: { tags: [] },
  employeeFields: { country: [], tags: [] },
  assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
  financeFields: {
    articles: [{ id: rid(), articleValue: "", isDeleted: false }],
    subarticles: [{ id: rid(), subarticleInterval: "", subarticleValue: "", isDeleted: false }],
    subcategory: [],
  },
  sundryFields:{
    typeWork: [],
  },
  taskFields: {
    tags: [],
  }
};



// --- EditableList ---
const EditableList = ({
  items = [],
  onChange,       // (index, newTextValue) => void
  onToggleDelete, // (index) => void
  onAdd,          // () => void
  onCommit,       // (index) => void (для blur)
  placeholder,
  showHidden
}) => {
  const refs = useRef([]);

  const handleBlur = (i) => {
    if (typeof onCommit === "function") {
      onCommit(i);
    }
  };

  const visibleItems = useMemo(
    () => items.map((item, index) => ({ ...item, originalIndex: index }))
               .filter(item => !item.isDeleted || showHidden),
    [items, showHidden]
  );

  console.log("EditableList RENDER:", { items: items.length, visible: visibleItems.length, showHidden });

  return (
    <div className="category-fields-container">
      {visibleItems.map((item, visibleIndex) => {
        const i = item.originalIndex; 
        return (
          <div
            key={item.id}
            className={`category-field-group ${item.isDeleted ? 'is-hidden-item' : ''}`}
          >
            <div className="category-container">
              <div className="category-full">
                <input
                  ref={(el) => (refs.current[i] = el)}
                  type="text"
                  value={item.value}
                  onChange={(e) => onChange(i, e.target.value)}
                  onBlur={() => handleBlur(i)}
                  placeholder={placeholder}
                  className="text-input"
                  disabled={item.isDeleted}
                />
              </div>
              <button
                type="button"
                className={`remove-category-btn ${item.isDeleted ? 'restore' : ''}`}
                onClick={() => onToggleDelete(i)}
                title={item.isDeleted ? "Восстановить" : "Удалить"}
              >
                {item.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
              </button>
            </div>
          </div>
        );
      })}
      <button type="button" className="add-category-btn" onClick={onAdd}>
        <Plus size={20} color='white'/> Добавить
      </button>
    </div>
  );
};

// --- TagList ---
const TagList = ({ title, tags = [], onChange, showHidden }) => {
  const nameRefs = useRef([]);

  const add = () => {
    const next = [...(tags || []), { id: rid(), name: "", color: "#ffffff", isDeleted: false }];
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
    const originalIndex = tags.findIndex(t => t.id === id);
    if (originalIndex === -1) return;
    const next = [...tags];
    next[originalIndex] = { ...next[originalIndex], isDeleted: !next[originalIndex].isDeleted };
    onChange(next);
  };

  const blurName = (id) => {
    const item = tags.find(t => t.id === id);
    if (!item) return;

    if (!tidy(item.name)) {
      if (!item.isDeleted) {
        onChange(tags.filter((t) => t.id !== id));
      }
      return;
    }
    const next = [...tags];
    const k = item.name.toLowerCase();
    const duplicate = tags.find(t => t.id !== id && t.name.toLowerCase() === k && !t.isDeleted);
    if (duplicate) {
      alert("Такой тег уже существует!");
      const originalIndex = tags.findIndex(t => t.id === id);
      next[originalIndex] = { ...next[originalIndex], name: "" };
      onChange(next);
    } else {
      onChange(next); 
    }
  };

  const blurColor = (id) => {
    const originalIndex = tags.findIndex(t => t.id === id);
    if (originalIndex === -1) return;
    const val = tags[originalIndex]?.color;
    const next = [...tags];
    next[originalIndex] = { ...next[originalIndex], color: isHex(val) ? val : "#ffffff" };
    onChange(next);
  };

  const copyColor = (color) => {
    navigator.clipboard.writeText(color).catch(err => {
      console.error('Не вдалося скопіювати колір: ', err);
    });
  };

  const visibleItems = useMemo(
    () => tags.filter(t => !t.isDeleted || showHidden),
    [tags, showHidden]
  );

  return (
    <div className="field-row">
      {title && <label className="field-label">{title}</label>}
      <div className="category-fields-container">
        {visibleItems.map((t, i) => (
          <div
            key={t.id}
            className={`category-field-group ${t.isDeleted ? 'is-hidden-item' : ''}`}
          >
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
                  title="Цвет"
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
                onClick={() => toggleDelete(t.id)}
                title={t.isDeleted ? "Восстановить" : "Удалить"}
              >
                {t.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="add-category-btn" onClick={add}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

// --- IntervalFields ---
const IntervalFields = ({ intervals = [], onIntervalChange, onIntervalBlur, onAddInterval, onToggleDelete, showHidden }) => {
  const visibleItems = useMemo(
    () => intervals.map((item, index) => ({ ...item, originalIndex: index }))
                      .filter(item => !item.isDeleted || showHidden),
    [intervals, showHidden]
  );
 
  return (
    <div className="field-row">
      <label className="field-label">Интервал</label>
      <div className="category-fields-container">
        {visibleItems.map((interval) => {
          const i = interval.originalIndex;
          return (
            <div
              key={interval.id}
              className={`category-field-group ${interval.isDeleted ? 'is-hidden-item' : ''}`}
            >
              <div className="category-container">
                <div className="category-full">
                  <input
                    type="text"
                    value={interval?.intervalValue || ""}
                    onChange={(e) => onIntervalChange(i, e.target.value)}
                    onBlur={() => onIntervalBlur(i)}
                    placeholder="Введите интервал"
                    className="text-input"
                    disabled={interval.isDeleted}
                  />
                </div>
                <button
                  type="button"
                  className={`remove-category-btn ${interval.isDeleted ? 'restore' : ''}`}
                  onClick={() => onToggleDelete(i)}
                  title={interval.isDeleted ? "Восстановить" : "Удалить"}
                >
                  {interval.isDeleted ? <Undo2 size={18} /> : <X size={18} />}
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="add-category-btn" onClick={onAddInterval}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

// --- CategoryFields ---
const CategoryFields = ({
  categories = [],
  onCategoryChange,
  onCategoryBlur,
  onAddCategory,
  onToggleDelete,
  openDropdowns = {},
  onToggleDropdown,
  availableIntervals = [],
  showHidden
}) => {
  const visibleItems = useMemo(
    () => categories.map((item, index) => ({ ...item, originalIndex: index }))
                      .filter(item => !item.isDeleted || showHidden),
    [categories, showHidden]
  );

  return (
    <div className="field-row category-field">
      <label className="field-label">Категория</label>
      <div className="category-fields-container">
        {visibleItems.map((category) => {
          const i = category.originalIndex;
          return (
            <div
              key={category.id}
              className={`category-field-group ${category.isDeleted ? 'is-hidden-item' : ''}`}
            >
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
          );
        })}
        <button type="button" className="add-category-btn" onClick={onAddCategory}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

// --- ArticleFields ---
const ArticleFields = ({ articles = [], onArticleChange, onArticleBlur, onAddArticle, onToggleDelete, showHidden }) => {
  const visibleItems = useMemo(
    () => articles.map((item, index) => ({ ...item, originalIndex: index }))
                   .filter(item => !item.isDeleted || showHidden),
    [articles, showHidden]
  );
 
  return (
    <div className="field-row">
      <label className="field-label">Статья</label>
      <div className="category-fields-container">
        {visibleItems.map((article) => {
          const i = article.originalIndex;
          return (
            <div
              key={article.id}
              className={`category-field-group ${article.isDeleted ? 'is-hidden-item' : ''}`}
            >
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
          );
        })}
        <button type="button" className="add-category-btn" onClick={onAddArticle}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

// --- SubarticleFields ---
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
  showHidden
}) => {
  const visibleItems = useMemo(
    () => subarticles.map((item, index) => ({ ...item, originalIndex: index }))
                          .filter(item => !item.isDeleted || showHidden),
    [subarticles, showHidden]
  );
 
  return (
    <div className="field-row article-field">
      <label className="field-label">Подстатья</label>
      <div className="category-fields-container">
        {visibleItems.map((subarticle) => {
          const i = subarticle.originalIndex;
          return (
            <div
              key={subarticle.id}
              className={`category-field-group ${subarticle.isDeleted ? 'is-hidden-item' : ''}`}
            >
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
          );
        })}
        <button type="button" className="add-category-btn" onClick={onAddSubarticle}>
          <Plus size={20} color='white'/> Добавить
        </button>
      </div>
    </div>
  );
};

// --- CardDesignUpload ---
const CardDesignUpload = ({ cardDesigns = [], onAdd, onToggleDelete, onError, showHidden }) => {
  const fileInputRefs = useRef([]);

  const visibleItems = useMemo(
    () => cardDesigns.map((item, index) => ({ ...item, originalIndex: index }))
                           .filter(item => !item.isDeleted || showHidden),
    [cardDesigns, showHidden]
  );

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
      onError?.({ title: "Слишком большой файл", message: `Максимум ${(MAX_IMAGE_BYTES / 1024).toFixed(0)} КБ.` });
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

  const addEmpty = () => onAdd([...(cardDesigns || []), { id: rid(), name: "", url: "", size: null, isDeleted: false }]);

  return (
    <div className="category-fields-container">
      {visibleItems.map((design, visibleIndex) => {
        const i = design.originalIndex;
        return (
          <div
            key={design.id}
            className={`category-field-group ${design.isDeleted ? 'is-hidden-item' : ''}`}
          >
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
        );
      })}
      <button type="button" className="add-category-btn" onClick={addEmpty}>
        <Plus size={20} color='white'/> Добавить
      </button>
    </div>
  );
};


/* =========================
   Основной компонент
   ========================= */
function FieldsPage() {
  const [selectedValues, setSelectedValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("generalFields");
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [inactiveLoaded, setInactiveLoaded] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Отмена",
    onConfirm: null,
    onCancel: null,
  });

  const containerRef = useRef(null);

  const openErrorModal = (title, message) => {
    setModal({
      open: true,
      title,
      message,
      confirmText: "OK",
      cancelText: "Закрыть",
      onConfirm: () => setModal((m) => ({ ...m, open: false })),
      onCancel: () => setModal((m) => ({ ...m, open: false })),
    });
  };

  const openChoiceModal = ({ title, message, onSave, onDiscard }) => {
    setModal({
      open: true,
      title,
      message,
      confirmText: "Сохранить",
      cancelText: "Не сохранять",
      onConfirm: async () => {
        setModal((m) => ({ ...m, open: false }));
        await onSave?.();
      },
      onCancel: () => {
        setModal((m) => ({ ...m, open: false }));
        onDiscard?.();
      },
    });
  };

  const applyAndCheck = (next) => {
    setSelectedValues(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(savedValues));
  };

  // загрузка
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const raw = await fetchFields();
        
        const normalized = withDefaults(raw);
        
        if (!mounted) return;
        setSelectedValues(normalized);
        setSavedValues(normalized);
        setHasChanges(false);
        console.log("ЗАГРУЗКА СТРАНИЦЫ (savedValues):", normalized.generalFields.currency);
      } catch (e) {
        openErrorModal("Ошибка загрузки списков", e?.message || "Не удалось получить данные с сервера.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // клики вне контейнера — закрыть выпадашки
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpenDropdowns({});
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== Сохранение / Отмена =====
  const handleSave = async () => {
    setSaving(true);
    try {
      
      const payload = serializeForSave(selectedValues);

     
      await saveFields(payload);

      
      const nextSavedValues = clone(selectedValues); 
      
      setSelectedValues(nextSavedValues);
      setSavedValues(nextSavedValues); 
      setHasChanges(false);
      setOpenDropdowns({});

      if (pendingTab) {
        setActiveTab(pendingTab);
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
    setHasChanges(false);
    setOpenDropdowns({});
    setShowHidden(false);
    setInactiveLoaded(false);
  };

  // ===== Переключение вкладок с подтверждением =====
  const onTabClick = (tabKey) => {
    if (tabKey === activeTab) return;
    if (!hasChanges) {
      setActiveTab(tabKey);
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
        setHasChanges(false);
        setActiveTab(tabKey);
        setPendingTab(null);
        setOpenDropdowns({});
        setShowHidden(false);
        setInactiveLoaded(false);
      },
    });
  };

  // ===== Обновление полей =====
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

          for (const groupKey of Object.keys(normalizedInactive)) {
            const group = normalizedInactive[groupKey];
            if (!nextValues[groupKey] || typeof group !== 'object' || group === null || typeof nextValues[groupKey] !== 'object' || nextValues[groupKey] === null) {
              continue;
            }
            
            activeIds[groupKey] = {};

            for (const fieldKey of Object.keys(group)) {

              if (!nextValues[groupKey].hasOwnProperty(fieldKey)) {
                continue; 
              }

              const activeList = nextValues[groupKey][fieldKey] || [];

              activeIds[groupKey][fieldKey] = new Set(activeList.map(item => item.id));

              const inactiveList = (group[fieldKey] || []).map(item => ({
                ...item,
                isDeleted: true
              }));

              const currentActiveIds = activeIds[groupKey][fieldKey];

              
              const mergedList = [
                ...activeList,
                ...inactiveList.filter(item => !currentActiveIds.has(item.id))
              ];

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

 
 
  // Для простых списков (EditableList)
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
    const newItem = { id: rid(), value: "", isDeleted: false };
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

  // Order
  const updateIntervalValue = (index, value) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const copy = [...intervals];
    copy[index] = { ...copy[index], intervalValue: value };
    handleInputChange("orderFields", "intervals", copy);
  };

  const validateIntervalOnBlur = (index) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const item = intervals[index];
    const value = tidy(item.intervalValue);

    if (!value && !item.isDeleted) {
      handleInputChange("orderFields", "intervals", intervals.filter((_, i) => i !== index));
      return;
    }
    
    const isDuplicate = intervals.some(
      (it, i) => i !== index && !it.isDeleted && tidy(it.intervalValue).toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такой интервал уже существует!");
      const copy = [...intervals];
      copy[index] = { ...copy[index], intervalValue: "" };
      handleInputChange("orderFields", "intervals", copy);
    }
  };

  const toggleDeleteInterval = (index) => {
    const intervals = selectedValues.orderFields.intervals || [];
    const copy = [...intervals];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("orderFields", "intervals", copy);
  };

  const updateCategoryValue = (index, field, value) => {
    const categories = selectedValues.orderFields.categories || [];
    const copy = [...categories];
    copy[index] = { ...copy[index], [field]: value };
    handleInputChange("orderFields", "categories", copy);

    if (field === "categoryInterval") {
      setOpenDropdowns((prev) => ({
        ...prev,
        [`category-${index}-interval`]: false,
      }));
    }
  };

  const validateCategoryOnBlur = (index) => {
    const categories = selectedValues.orderFields.categories || [];
    const current = categories[index];
    const value = tidy(current?.categoryValue);
    const interval = tidy(current?.categoryInterval);

    if (!value && !interval && !current.isDeleted) {
      handleInputChange("orderFields", "categories", categories.filter((_, i) => i !== index));
      return;
    }
    
    if (!value) return; 

    const isDuplicate = categories.some(
      (item, i) =>
        i !== index && !item.isDeleted &&
        tidy(item.categoryInterval).toLowerCase() === interval.toLowerCase() &&
        tidy(item.categoryValue).toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая категория уже существует в этом интервале!");
      const copy = [...categories];
      copy[index] = { ...copy[index], categoryValue: "" };
      handleInputChange("orderFields", "categories", copy);
    }
  };
 
  const toggleDeleteCategory = (index) => {
    const categories = selectedValues.orderFields.categories || [];
    const copy = [...categories];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("orderFields", "categories", copy);
  };

  const addInterval = () => handleInputChange("orderFields", "intervals", [...(selectedValues.orderFields.intervals || []), { id: rid(), intervalValue: "", isDeleted: false }]);
  const addCategory = () => handleInputChange("orderFields", "categories", [...(selectedValues.orderFields.categories || []), { id: rid(), categoryInterval: "", categoryValue: "", isDeleted: false }]);

  // Finance
 const updateArticleValue = (index, value) => {
    const articles = selectedValues.financeFields.articles || [];
    const copy = [...articles];
    copy[index] = { ...copy[index], articleValue: value };
    handleInputChange("financeFields", "articles", copy);
  };

  const validateArticleOnBlur = (index) => {
    const articles = selectedValues.financeFields.articles || [];
    const item = articles[index];
    const value = tidy(item.articleValue);

    if (!value && !item.isDeleted) {
      handleInputChange("financeFields", "articles", articles.filter((_, i) => i !== index));
      return;
    }

    const isDuplicate = articles.some(
      (it, i) => i !== index && !it.isDeleted && tidy(it.articleValue).toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая статья уже существует!");
      const copy = [...articles];
      copy[index] = { ...copy[index], articleValue: "" };
      handleInputChange("financeFields", "articles", copy);
    }
  };
 
  const toggleDeleteArticle = (index) => {
    const articles = selectedValues.financeFields.articles || [];
    const copy = [...articles];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("financeFields", "articles", copy);
  };

  const updateSubarticleValue = (index, field, value) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const copy = [...subs];
    copy[index] = { ...copy[index], [field]: value };
    handleInputChange("financeFields", "subarticles", copy);

    if (field === "subarticleInterval") {
      setOpenDropdowns((prev) => ({
        ...prev,
        [`subarticle-${index}-interval`]: false,
      }));
    }
  };

  const validateSubarticleOnBlur = (index) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const current = subs[index];
    const value = tidy(current?.subarticleValue);
    const interval = tidy(current?.subarticleInterval);

    if (!value && !interval && !current.isDeleted) {
      handleInputChange("financeFields", "subarticles", subs.filter((_, i) => i !== index));
      return;
    }
    
    if (!value) return;

    const isDuplicate = subs.some(
      (item, i) =>
        i !== index && !item.isDeleted &&
        tidy(item.subarticleInterval).toLowerCase() === interval.toLowerCase() &&
        tidy(item.subarticleValue).toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая подстатья уже существует!");
      const copy = [...subs];
      copy[index] = { ...copy[index], subarticleValue: "" };
      handleInputChange("financeFields", "subarticles", copy);
    }
  };
 
  const toggleDeleteSubarticle = (index) => {
    const subs = selectedValues.financeFields.subarticles || [];
    const copy = [...subs];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("financeFields", "subarticles", copy);
  };
 
  const addArticle = () => handleInputChange("financeFields", "articles", [...(selectedValues.financeFields.articles || []), { id: rid(), articleValue: "", isDeleted: false }]);
  const addSubarticle = () => handleInputChange("financeFields", "subarticles", [...(selectedValues.financeFields.subarticles || []), { id: rid(), subarticleInterval: "", subarticleValue: "", isDeleted: false }]);

  // Card designs
  const updateCardDesigns = (newItems) => handleInputChange("assetsFields", "cardDesigns", newItems);
 
  const toggleDeleteCardDesign = (index) => {
    const designs = selectedValues.assetsFields.cardDesigns || [];
    const copy = [...designs];
    copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
    handleInputChange("assetsFields", "cardDesigns", copy);
  };

  // dropdown toggles
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

  // опции
  const intervalsOptions = useMemo(
    () => (selectedValues.orderFields.intervals || [])
          .filter(i => !i.isDeleted)
          .map((i) => tidy(i.intervalValue))
          .filter(Boolean),
    [selectedValues.orderFields.intervals]
  );
  const articleOptions = useMemo(
    () => (selectedValues.financeFields.articles || [])
          .filter(a => !a.isDeleted)
          .map((a) => tidy(a.articleValue))
          .filter(Boolean),
    [selectedValues.financeFields.articles]
  );
 
  // Опции для подкатегорий (SubarticleFields)
  const subcategoryOptions = useMemo(
    () => (selectedValues.financeFields.subcategory || [])
          .filter(sc => !sc.isDeleted)
          .map(sc => sc.value)
          .filter(Boolean),
    [selectedValues.financeFields.subcategory]
  );


  // ===== Рендер активной вкладки =====
  const renderActiveTabFields = () => {
    switch (activeTab) {
      case "generalFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Валюта</label>
              <EditableList
                items={selectedValues.generalFields?.currency || []}
                onChange={(index, val) => handleStringItemChange("generalFields", "currency", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("generalFields", "currency", index)}
                onAdd={() => handleStringItemAdd("generalFields", "currency")}
                onCommit={(index) => handleStringItemBlur("generalFields", "currency", index)}
                placeholder="Введите валюту"
                showHidden={showHidden}
              />
            </div>
          </div>
        );

      case "orderFields":
        return (
          <div className="fields-vertical-grid">
            <IntervalFields
              intervals={selectedValues.orderFields.intervals || []}
              onIntervalChange={updateIntervalValue} 
              onIntervalBlur={validateIntervalOnBlur}
              onAddInterval={addInterval}
              onToggleDelete={toggleDeleteInterval}
              showHidden={showHidden}
            />
            <CategoryFields
              categories={selectedValues.orderFields.categories || []}
              onCategoryChange={updateCategoryValue}
              onCategoryBlur={validateCategoryOnBlur}
              onAddCategory={addCategory}
              onToggleDelete={toggleDeleteCategory}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleCategoryDropdown}
              availableIntervals={intervalsOptions}
              showHidden={showHidden}
            />
            <div className="field-row">
              <label className="field-label">Причина скидки</label>
              <EditableList
                items={selectedValues.orderFields.discountReason || []}
                onChange={(index, val) => handleStringItemChange("orderFields", "discountReason", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("orderFields", "discountReason", index)}
                onAdd={() => handleStringItemAdd("orderFields", "discountReason")}
                onCommit={(index) => handleStringItemBlur("orderFields", "discountReason", index)}
                placeholder="Введите причину скидки"
                showHidden={showHidden}
              />
            </div>
            <TagList
              title="Теги заказа"
              tags={selectedValues.orderFields.tags || []}
              onChange={(v) => handleInputChange("orderFields", "tags", v)}
              showHidden={showHidden}
            />
            <TagList
              title="Теги технологий"
              tags={selectedValues.orderFields.techTags || []}
              onChange={(v) => handleInputChange("orderFields", "techTags", v)}
              showHidden={showHidden}
            />
            <TagList
              title="Теги задач"
              tags={selectedValues.orderFields.taskTags || []}
              onChange={(v) => handleInputChange("orderFields", "taskTags", v)}
              showHidden={showHidden}
            />
          </div>
        );

      case "executorFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Роль</label>
              <EditableList
                items={selectedValues.executorFields.role || []}
                onChange={(index, val) => handleStringItemChange("executorFields", "role", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("executorFields", "role", index)}
                onAdd={() => handleStringItemAdd("executorFields", "role")}
                onCommit={(index) => handleStringItemBlur("executorFields", "role", index)}
                placeholder="Введите роль"
                showHidden={showHidden}
              />
            </div>
          </div>
        );

      case "clientFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Категория</label>
              <EditableList
                items={selectedValues.clientFields.category || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "category", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("clientFields", "category", index)}
                onAdd={() => handleStringItemAdd("clientFields", "category")}
                onCommit={(index) => handleStringItemBlur("clientFields", "category", index)}
                placeholder="Введите категорию"
                showHidden={showHidden}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Источник</label>
              <EditableList
                items={selectedValues.clientFields.source || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "source", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("clientFields", "source", index)}
                onAdd={() => handleStringItemAdd("clientFields", "source")}
                onCommit={(index) => handleStringItemBlur("clientFields", "source", index)}
                placeholder="Введите источник"
                showHidden={showHidden}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Страна</label>
              <EditableList
                items={selectedValues.clientFields.country || []}
                onChange={(index, val) => handleStringItemChange("clientFields", "country", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("clientFields", "country", index)}
                onAdd={() => handleStringItemAdd("clientFields", "country")}
                onCommit={(index) => handleStringItemBlur("clientFields", "country", index)}
                placeholder="Введите страну"
                showHidden={showHidden}
              />
            </div>
            <TagList
              title="Теги клиента"
              tags={selectedValues.clientFields.tags || []}
              onChange={(v) => handleInputChange("clientFields", "tags", v)}
              showHidden={showHidden}
            />
          </div>
        );

      case "companyFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <TagList
                title="Теги компании"
                tags={selectedValues.companyFields?.tags || []}
                onChange={(v) => handleInputChange("companyFields", "tags", v)}
                showHidden={showHidden}
              />
            </div>
          </div>
        );

      case "employeeFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Страна</label>
              <EditableList
                items={selectedValues.employeeFields.country || []}
                onChange={(index, val) => handleStringItemChange("employeeFields", "country", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("employeeFields", "country", index)}
                onAdd={() => handleStringItemAdd("employeeFields", "country")}
                onCommit={(index) => handleStringItemBlur("employeeFields", "country", index)}
                placeholder="Введите страну"
                showHidden={showHidden}
              />
            </div>
            <TagList
              title="Теги сотрудника"
              tags={selectedValues.employeeFields.tags || []}
              onChange={(v) => handleInputChange("employeeFields", "tags", v)}
              showHidden={showHidden}
            />
          </div>
        );

      case "assetsFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Тип</label>
              <EditableList
                items={selectedValues.assetsFields.type || []}
                onChange={(index, val) => handleStringItemChange("assetsFields", "type", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("assetsFields", "type", index)}
                onAdd={() => handleStringItemAdd("assetsFields", "type")}
                onCommit={(index) => handleStringItemBlur("assetsFields", "type", index)}
                placeholder="Введите тип"
                showHidden={showHidden}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Платежная система</label>
              <EditableList
                items={selectedValues.assetsFields.paymentSystem || []}
                onChange={(index, val) => handleStringItemChange("assetsFields", "paymentSystem", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("assetsFields", "paymentSystem", index)}
                onAdd={() => handleStringItemAdd("assetsFields", "paymentSystem")}
                onCommit={(index) => handleStringItemBlur("assetsFields", "paymentSystem", index)}
                placeholder="Введите платежную систему"
                showHidden={showHidden}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Дизайн карты</label>
              <CardDesignUpload
                cardDesigns={selectedValues.assetsFields.cardDesigns || []}
                onAdd={(newItems) => updateCardDesigns(newItems)}
                onToggleDelete={toggleDeleteCardDesign}
                onError={({ title, message }) => openErrorModal(title, message)}
                showHidden={showHidden}
              />
            </div>
          </div>
        );

      case "financeFields":
        return (
          <div className="fields-vertical-grid">
            <ArticleFields
              articles={selectedValues.financeFields?.articles || []}
              onArticleChange={updateArticleValue}
              onArticleBlur={validateArticleOnBlur}
              onAddArticle={addArticle}
              onToggleDelete={toggleDeleteArticle}
              showHidden={showHidden}
            />
            <div className="field-row">
              <label className="field-label">Подкатегория</label>
              <EditableList
                items={selectedValues.financeFields?.subcategory || []}
                onChange={(index, val) => handleStringItemChange("financeFields", "subcategory", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("financeFields", "subcategory", index)}
                onAdd={() => handleStringItemAdd("financeFields", "subcategory")}
                onCommit={(index) => handleStringItemBlur("financeFields", "subcategory", index)}
                placeholder="Введите подкатегорию"
                showHidden={showHidden}
              />
            </div>
            <SubarticleFields
              subarticles={selectedValues.financeFields?.subarticles || []}
              onSubarticleChange={updateSubarticleValue}
              onSubarticleBlur={validateSubarticleOnBlur}
              onAddSubarticle={addSubarticle}
              onToggleDelete={toggleDeleteSubarticle}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleSubarticleDropdown}
              availableArticles={articleOptions}
              availableSubcategories={subcategoryOptions} 
              showHidden={showHidden}
            />
          </div>
        );

      case "sundryFields":
        return(
          <div className="field-row">
              <label className="field-label">Тип работы</label>
              <EditableList
                items={selectedValues.sundryFields?.typeWork || []} 
                onChange={(index, val) => handleStringItemChange("sundryFields", "typeWork", index, val)}
                onToggleDelete={(index) => handleStringItemToggleDelete("sundryFields", "typeWork", index)}
                onAdd={() => handleStringItemAdd("sundryFields", "typeWork")}
                onCommit={(index) => handleStringItemBlur("sundryFields", "typeWork", index)}
                placeholder="Введите тип работы"
                showHidden={showHidden}
              />
            </div>
        );
        
      case "taskFields": 
        return(
          <div className="field-row">
            <TagList
              title="Теги задач"
              tags={selectedValues.taskFields?.tags || []}
              onChange={(v) => handleInputChange("taskFields", "tags", v)}
              showHidden={showHidden}
            />
          </div>
        );

      default:
        return null;
    }
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
           
              <button
                type="button"
                className={`header-action-btn ${showHidden ? 'active' : ''}`}
                title={showHidden ? "Скрыть удаленные" : "Показать удаленные"}
                onClick={() => setShowHidden(!showHidden)}
                disabled={saving || loading}
              >
                {showHidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
          <div className="main-content-wrapper">
            <div className="tabs-content-wrapper">
              <div className="tabs-container">
                {tabsConfig.map((tab) => (
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