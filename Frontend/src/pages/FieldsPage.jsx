// src/pages/FieldsPage.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Fields.css";
import { fetchFields, saveFields } from "../api/fields";
import { fileUrl } from "../api/http";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";
import PageHeaderIcon from "../components/HeaderIcon/PageHeaderIcon.jsx"

/* =========================
   Константы и утилиты
   ========================= */
const MAX_IMAGE_BYTES = 500 * 1024;
const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const tidy = (v) => String(v ?? "").trim();
const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

const uniqStrs = (arr) => {
  const seen = new Set();
  const out = [];
  for (const raw of arr || []) {
    const v = tidy(raw);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
};

const uniqTags = (arr) => {
  const seen = new Set();
  const out = [];
  for (const t of arr || []) {
    const name = tidy(t?.name);
    if (!name) continue;
    const color = isHex(t?.color) ? t.color : "#ffffff";
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: t?.id || rid(), name, color });
    }
  }
  return out;
};

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
  { key: "clientFields", label: "Клиенты" },
  { key: "employeeFields", label: "Сотрудники" },
  { key: "assetsFields", label: "Активы" },
  { key: "financeFields", label: "Финансы" },
  { key: "sundryFields", label: "Разное"},
];

/* =========================
   Стартовые значения
   ========================= */
const initialValues = {
  orderFields: {
    intervals: [{ intervalValue: "" }],
    categories: [{ categoryInterval: "", categoryValue: "" }],
    currency: [],
    tags: [],
    techTags: [],
    taskTags: [],
    discountReason: [],
  },
  executorFields: { currency: [], role: [] },
  clientFields: { source: [], category: [], country: [], currency: [], tags: [] },
  employeeFields: { country: [], tags: [] },
  assetsFields: { currency: [], type: [], paymentSystem: [], cardDesigns: [] },
  financeFields: {
    articles: [{ articleValue: "" }],
    subarticles: [{ subarticleInterval: "", subarticleValue: "" }],
    subcategory: [],
  },
  sundryFields:{
    typeWork: [],
  }
};

/* =========================
   Нормализация (бэк → фронт)
   ========================= */
const normStrs = (arr) =>
  uniqStrs((Array.isArray(arr) ? arr : []).map((v) =>
    typeof v === "string" ? tidy(v) : tidy(v?.name ?? v?.value)
  ));

const normIntervals = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    intervalValue: tidy(it?.intervalValue ?? it?.value ?? it),
  }));

const normCategories = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    categoryInterval: tidy(it?.categoryInterval ?? it?.interval ?? it?.group),
    categoryValue: tidy(it?.categoryValue ?? it?.value ?? it?.name),
  }));

const normArticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    articleValue: tidy(it?.articleValue ?? it?.value ?? it?.name ?? it),
  }));

const normSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    subarticleInterval: tidy(it?.subarticleInterval ?? it?.interval ?? it?.group),
    subarticleValue: tidy(it?.subarticleValue ?? it?.value ?? it?.name),
  }));

const normDesigns = (arr) =>
  (Array.isArray(arr) ? arr : []).map((d) => ({
    id: d?.id || rid(),
    name: tidy(d?.name),
    url: tidy(d?.url ?? d?.imageUrl ?? d?.src),
    size: d?.size ?? null,
  }));

const normTags = (arr) =>
  uniqTags((Array.isArray(arr) ? arr : []).map((t) => {
    if (typeof t === "string") return { id: rid(), name: tidy(t), color: "#ffffff" };
    return { id: t?.id || rid(), name: tidy(t?.name ?? t?.value), color: isHex(t?.color) ? t.color : "#ffffff" };
  }));

function normalizeFromBackend(input) {
  const data = input?.ok && input?.data ? input.data : input || {};
  return {
    orderFields: {
      ...initialValues.orderFields,
      intervals: normIntervals(data?.orderFields?.intervals),
      categories: normCategories(data?.orderFields?.categories),
      currency: normStrs(data?.orderFields?.currency),
      tags: normTags(data?.orderFields?.tags),
      techTags: normTags(data?.orderFields?.techTags),
      taskTags: normTags(data?.orderFields?.taskTags),
    },
    executorFields: {
      ...initialValues.executorFields,
      currency: normStrs(data?.executorFields?.currency),
      role: normStrs(data?.executorFields?.role),
    },
    clientFields: {
      ...initialValues.clientFields,
      source: normStrs(data?.clientFields?.source),
      category: normStrs(data?.clientFields?.category),
      country: normStrs(data?.clientFields?.country),
      currency: normStrs(data?.clientFields?.currency),
      tags: normTags(data?.clientFields?.tags ?? data?.clientFields?.tag),
    },
    employeeFields: {
      ...initialValues.employeeFields,
      country: normStrs(data?.employeeFields?.country),
      tags: normTags(data?.employeeFields?.tags),
    },
    assetsFields: {
      ...initialValues.assetsFields,
      currency: normStrs(data?.assetsFields?.currency),
      type: normStrs(data?.assetsFields?.type),
      paymentSystem: normStrs(data?.assetsFields?.paymentSystem),
      cardDesigns: normDesigns(data?.assetsFields?.cardDesigns),
    },
    financeFields: {
      ...initialValues.financeFields,
      articles: normArticles(data?.financeFields?.articles),
      subarticles: normSubarticles(data?.financeFields?.subarticles),
      subcategory: normStrs(data?.financeFields?.subcategory),
    },
  };
}

/* =========================
   Сериализация (фронт → бэк)
   ========================= */
const serStrs = (arr) => uniqStrs((Array.isArray(arr) ? arr : []).map((v) => tidy(v)));
const serIntervals = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => ({ id: it?.id || rid(), value: tidy(it?.intervalValue ?? it?.value) }))
    .filter((x) => x.value !== "");
const serCategories = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => ({ categoryInterval: tidy(it?.categoryInterval), categoryValue: tidy(it?.categoryValue) }))
    .filter((x) => x.categoryInterval && x.categoryValue);
const serArticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => ({ articleValue: tidy(it?.articleValue) }))
    .filter((x) => x.articleValue !== "");
const serSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => ({ subarticleInterval: tidy(it?.subarticleInterval), subarticleValue: tidy(it?.subarticleValue) }))
    .filter((x) => x.subarticleInterval && x.subarticleValue);
const serDesigns = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((d) => ({ id: d?.id || rid(), name: tidy(d?.name), url: tidy(d?.url), size: d?.size ?? null }))
    .filter((d) => d.name && d.url);
const serTags = (arr) => uniqTags(arr);

function serializeForSave(values) {
  return {
    orderFields: {
      intervals: serIntervals(values?.orderFields?.intervals),
      categories: serCategories(values?.orderFields?.categories),
      currency: serStrs(values?.orderFields?.currency),
      tags: serTags(values?.orderFields?.tags),
      techTags: serTags(values?.orderFields?.techTags),
      taskTags: serTags(values?.orderFields?.taskTags),
    },
    executorFields: {
      currency: serStrs(values?.executorFields?.currency),
      role: serStrs(values?.executorFields?.role),
    },
    clientFields: {
      source: serStrs(values?.clientFields?.source),
      category: serStrs(values?.clientFields?.category),
      country: serStrs(values?.clientFields?.country),
      currency: serStrs(values?.clientFields?.currency),
      tags: serTags(values?.clientFields?.tags),
    },
    employeeFields: {
      country: serStrs(values?.employeeFields?.country),
      tags: serTags(values?.employeeFields?.tags),
    },
    assetsFields: {
      currency: serStrs(values?.assetsFields?.currency),
      type: serStrs(values?.assetsFields?.type),
      paymentSystem: serStrs(values?.assetsFields?.paymentSystem),
      cardDesigns: serDesigns(values?.assetsFields?.cardDesigns),
    },
    financeFields: {
      articles: serArticles(values?.financeFields?.articles),
      subarticles: serSubarticles(values?.financeFields?.subarticles),
      subcategory: serStrs(values?.financeFields?.subcategory),
    },
  };
}

/* =========================
   Общие справочники и операции
   ========================= */
const SHARED_STRING_MAP = {
  currency: [
    ["orderFields", "currency"],
    ["executorFields", "currency"],
    ["clientFields", "currency"],
    ["assetsFields", "currency"],
  ],
  country: [
    ["clientFields", "country"],
    ["employeeFields", "country"],
  ],
};

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function removeValueEverywhere(values, key, valueToRemove) {
  const next = clone(values);
  const targets = SHARED_STRING_MAP[key] || [];
  for (const [group, field] of targets) {
    const arr = Array.isArray(next?.[group]?.[field]) ? next[group][field] : [];
    next[group][field] = arr.filter((v) => v !== valueToRemove);
  }
  return next;
}

function renameValueEverywhere(values, key, oldVal, newVal) {
  const next = clone(values);
  const targets = SHARED_STRING_MAP[key] || [];
  for (const [group, field] of targets) {
    let arr = Array.isArray(next?.[group]?.[field]) ? next[group][field] : [];
    arr = arr.map((v) => (v === oldVal ? newVal : v));
    arr = uniqStrs(arr);
    next[group][field] = arr;
  }
  return next;
}

/* =========================
   Подкомпоненты
   ========================= */

// Универсальный список строк с onCommit (blur)
const EditableList = ({ items = [], onChange, onRemove, placeholder, onCommit }) => {
  const refs = useRef([]);
  const originalsRef = useRef({}); // index -> original value on focus

  const add = () => {
    const next = [...(items || []), ""];
    onChange(next);
    setTimeout(() => refs.current[next.length - 1]?.focus(), 0);
  };

  const handleFocus = (i, val) => {
    originalsRef.current[i] = val;
  };

  const handleBlur = (i, val) => {
    const oldVal = originalsRef.current[i];
    delete originalsRef.current[i];
    if (typeof onCommit === "function") {
      onCommit(i, oldVal, val);
    } else {
      onChange(uniqStrs(items));
    }
  };

  return (
    <div className="category-fields-container">
      {(items || []).map((item, index) => (
        <div key={`${index}`} className="category-field-group">
          <div className="category-container">
            <div className="category-full">
              <input
                ref={(el) => (refs.current[index] = el)}
                type="text"
                value={item}
                onFocus={() => handleFocus(index, item)}
                onChange={(e) => {
                  const newItems = [...(items || [])];
                  newItems[index] = e.target.value;
                  onChange(newItems);
                }}
                onBlur={(e) => handleBlur(index, e.target.value)}
                placeholder={placeholder}
                className="text-input"
              />
            </div>
            <button type="button" className="remove-category-btn" onClick={() => onRemove(index, item)} title="Удалить">
              ×
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={add}>
        + Добавить
      </button>
    </div>
  );
};

// Теги {id,name,color}
const TagList = ({ title, tags = [], onChange }) => {
  const nameRefs = useRef([]);

  const add = () => {
    const next = [...(tags || []), { id: rid(), name: "", color: "#ffffff" }];
    onChange(next);
    setTimeout(() => nameRefs.current[next.length - 1]?.focus(), 0);
  };

  const upd = (i, patch) => {
    const next = [...(tags || [])];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const blurName = (i) => {
    const val = tidy(tags[i]?.name);
    if (!val) {
      onChange(tags.filter((_, idx) => idx !== i));
      return;
    }
    const next = [...tags];
    next[i] = { ...next[i], name: val };
    onChange(uniqTags(next));
  };

  const blurColor = (i) => {
    const val = tags[i]?.color;
    const next = [...tags];
    next[i] = { ...next[i], color: isHex(val) ? val : "#ffffff" };
    onChange(next);
  };

  const del = (i) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className="field-row">
      {title && <label className="field-label">{title}</label>}
      <div className="category-fields-container">
        {(tags || []).map((t, i) => (
          <div key={t.id || i} className="category-field-group">
            <div className="category-container">
              <div className="category-left">
                <input
                  ref={(el) => (nameRefs.current[i] = el)}
                  className="text-input"
                  type="text"
                  placeholder="Название тега"
                  value={t.name}
                  onChange={(e) => upd(i, { name: e.target.value })}
                  onBlur={() => blurName(i)}
                />
              </div>
              <div className="category-right" style={{ flex: "0 0 120px", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={isHex(t.color) ? t.color : "#ffffff"}
                  onChange={(e) => upd(i, { color: e.target.value })}
                  onBlur={() => blurColor(i)}
                  title="Цвет"
                  style={{ width: 40, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
                />
                <input
                  className="text-input"
                  type="text"
                  value={t.color || "#ffffff"}
                  onChange={(e) => upd(i, { color: e.target.value })}
                  onBlur={() => blurColor(i)}
                  placeholder="#ffffff"
                />
              </div>
              <button type="button" className="remove-category-btn" onClick={() => del(i)} title="Удалить">
                ×
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="add-category-btn" onClick={add}>
          + Добавить тег
        </button>
      </div>
    </div>
  );
};

// Интервалы
const IntervalFields = ({ intervals = [], onIntervalChange, onIntervalBlur, onAddInterval, onRemoveInterval }) => (
  <div className="field-row">
    <label className="field-label">Интервал</label>
    <div className="category-fields-container">
      {(intervals || []).map((interval, index) => (
        <div key={interval?.id || index} className="category-field-group">
          <div className="category-container">
            <div className="category-full">
              <input
                type="text"
                value={interval?.intervalValue || ""}
                onChange={(e) => onIntervalChange(index, e.target.value)}
                onBlur={() => onIntervalBlur(index)}
                placeholder="Введите интервал"
                className="text-input"
              />
            </div>
            <button type="button" className="remove-category-btn" onClick={() => onRemoveInterval(index)} title="Удалить интервал">
              ×
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={onAddInterval}>
        + Добавить интервал
      </button>
    </div>
  </div>
);

// Категории
const CategoryFields = ({
  categories = [],
  onCategoryChange,
  onCategoryBlur,
  onAddCategory,
  onRemoveCategory,
  openDropdowns = {},
  onToggleDropdown,
  availableIntervals = [],
}) => (
  <div className="field-row category-field">
    <label className="field-label">Категория</label>
    <div className="category-fields-container">
      {(categories || []).map((category, index) => (
        <div key={index} className="category-field-group">
          <div className="category-container">
            <div className="category-left">
              <div className="dropdown-container">
                <div
                  className={`dropdown-trigger-category ${category.categoryInterval ? "has-value" : ""}`}
                  onClick={(e) => onToggleDropdown(index, e)}
                >
                  <span className="dropdown-value">{category.categoryInterval || "Выберите интервал"}</span>
                  <span className={`dropdown-arrow ${openDropdowns[`category-${index}-interval`] ? "open" : ""}`}>▼</span>
                </div>
                <div className={`dropdown-menu ${openDropdowns[`category-${index}-interval`] ? "open" : ""}`}>
                  {(availableIntervals || []).length > 0 ? (
                    availableIntervals.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`dropdown-option ${category.categoryInterval === option ? "selected" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategoryChange(index, "categoryInterval", option);
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
                onChange={(e) => onCategoryChange(index, "categoryValue", e.target.value)}
                onBlur={() => onCategoryBlur(index)}
                placeholder="Введите значение"
                className="text-input"
              />
            </div>
            <button type="button" className="remove-category-btn" onClick={() => onRemoveCategory(index)} title="Удалить категорию">
              ×
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={onAddCategory}>
        + Добавить категорию
      </button>
    </div>
  </div>
);

// Статьи
const ArticleFields = ({ articles = [], onArticleChange, onArticleBlur, onAddArticle, onRemoveArticle }) => (
  <div className="field-row">
    <label className="field-label">Статья</label>
    <div className="category-fields-container">
      {(articles || []).map((article, index) => (
        <div key={index} className="category-field-group">
          <div className="category-container">
            <div className="category-full">
              <input
                type="text"
                value={article.articleValue || ""}
                onChange={(e) => onArticleChange(index, e.target.value)}
                onBlur={() => onArticleBlur(index)}
                placeholder="Введите статью"
                className="text-input"
              />
            </div>
            <button type="button" className="remove-category-btn" onClick={() => onRemoveArticle(index)} title="Удалить статью">
              ×
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={onAddArticle}>
        + Добавить статью
      </button>
    </div>
  </div>
);

// Подстатьи
const SubarticleFields = ({
  subarticles = [],
  onSubarticleChange,
  onSubarticleBlur,
  onAddSubarticle,
  onRemoveSubarticle,
  openDropdowns = {},
  onToggleDropdown,
  availableArticles = [],
  availableSubcategories = [],
}) => (
  <div className="field-row article-field">
    <label className="field-label">Подстатья</label>
    <div className="category-fields-container">
      {(subarticles || []).map((subarticle, index) => (
        <div key={index} className="category-field-group">
          <div className="category-container">
            <div className="category-left">
              <div className="dropdown-container">
                <div
                  className={`dropdown-trigger-article ${subarticle.subarticleInterval ? "has-value" : ""}`}
                  onClick={(e) => onToggleDropdown(index, e)}
                >
                  <span className="dropdown-value">{subarticle.subarticleInterval || "Выберите статью/подкатегорию"}</span>
                  <span className={`dropdown-arrow ${openDropdowns[`subarticle-${index}-interval`] ? "open" : ""}`}>▼</span>
                </div>
                <div className={`dropdown-menu ${openDropdowns[`subarticle-${index}-interval`] ? "open" : ""}`}>
                  {(availableArticles || []).map((option, optionIndex) => (
                    <div
                      key={`art-${optionIndex}`}
                      className={`dropdown-option ${subarticle.subarticleInterval === option ? "selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubarticleChange(index, "subarticleInterval", option);
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
                        onSubarticleChange(index, "subarticleInterval", option);
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
                onChange={(e) => onSubarticleChange(index, "subarticleValue", e.target.value)}
                onBlur={() => onSubarticleBlur(index)}
                placeholder="Введите значение"
                className="text-input"
              />
            </div>
            <button type="button" className="remove-category-btn" onClick={() => onRemoveSubarticle(index)} title="Удалить подстатью">
              ×
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={onAddSubarticle}>
        + Добавить подстатью
      </button>
    </div>
  </div>
);

// Дизайны карт
const CardDesignUpload = ({ cardDesigns = [], onAdd, onRemove, onError }) => {
  const fileInputRefs = useRef([]);

  const ensureDesign = (arr, index) => {
    const copy = [...arr];
    copy[index] = {
      id: copy[index]?.id || rid(),
      name: copy[index]?.name || "",
      url: copy[index]?.url || "",
      size: copy[index]?.size ?? null,
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

  const handleNameChange = (index, newName) => {
    const next = ensureDesign(cardDesigns, index);
    next[index] = { ...next[index], name: newName };
    onAdd(next);
  };

  const addEmpty = () => onAdd([...(cardDesigns || []), { id: rid(), name: "", url: "", size: null }]);

  return (
    <div className="category-fields-container">
      {(cardDesigns || []).map((design, index) => (
        <div key={design.id || index} className="category-field-group">
          <div className="card-design-row">
            <div className="card-design-input">
              <input
                type="text"
                value={design.name || ""}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder="Введите название дизайна"
                className="text-input"
              />
            </div>
            <div className="card-design-upload">
              <input
                ref={(el) => (fileInputRefs.current[index] = el)}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, index)}
                style={{ display: "none" }}
              />
              {design.url ? (
                <div className="card-design-item">
                  <div className="card-design-preview" title="Кликните, чтобы заменить" onClick={() => triggerFile(index)}>
                    <img src={safeFileUrl(design.url)} alt={design.name || "design"} className="card-design-image" />
                  </div>
                  <div className="card-design-actions">
                    <button type="button" className="upload-design-btn" onClick={() => triggerFile(index)}>Заменить</button>
                    <button type="button" className="remove-category-btn" onClick={() => onRemove(index)} title="Удалить">×</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="upload-design-btn" onClick={() => triggerFile(index)}>
                  + Загрузить изображение
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="add-category-btn" onClick={addEmpty}>
        + Добавить дизайн карты
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
  const [activeTab, setActiveTab] = useState("orderFields");
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

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
        const normalized = normalizeFromBackend(raw);
        if (!mounted) return;
        setSelectedValues(normalized);
        setSavedValues(normalized);
        setHasChanges(false);
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
      const raw = await fetchFields();
      const normalized = normalizeFromBackend(raw);
      setSelectedValues(normalized);
      setSavedValues(normalized);
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
      },
    });
  };

  // ===== Обновление полей =====
  const handleInputChange = (fieldGroup, fieldName, value) => {
    const next = { ...selectedValues, [fieldGroup]: { ...selectedValues[fieldGroup], [fieldName]: value } };
    applyAndCheck(next);
  };

  // фабрика коммита для общих справочников (валюта/страна)
  const commitShared = (path, sharedKey) => (index, oldVal, newVal) => {
    const oldT = tidy(oldVal);
    const newT = tidy(newVal);
    // если редактируем новую строку (старое пустое) — это ЛОКАЛЬНОЕ добавление
    if (!oldT) {
      const [group, field] = path;
      const curr = Array.isArray(selectedValues?.[group]?.[field]) ? selectedValues[group][field] : [];
      const nextArr = uniqStrs(curr);
      const next = { ...selectedValues, [group]: { ...selectedValues[group], [field]: nextArr } };
      applyAndCheck(next);
      return;
    }
    // если новое пустое — удалить значение везде
    if (!newT) {
      const next = removeValueEverywhere(selectedValues, sharedKey, oldT);
      applyAndCheck(next);
      return;
    }
    // обычное переименование во всех списках этого справочника
    const next = renameValueEverywhere(selectedValues, sharedKey, oldT, newT);
    applyAndCheck(next);
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
    const value = intervals[index]?.intervalValue || "";

    
    if (!value.trim()) {
      return;
    }

    const isDuplicate = intervals.some(
      (item, i) => i !== index && item.intervalValue.trim().toLowerCase() === value.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert("Такой интервал уже существует!");
      
      
      const copy = [...intervals];
      copy[index] = { ...copy[index], intervalValue: "" };
      handleInputChange("orderFields", "intervals", copy);
    }
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
    const value = current?.categoryValue?.trim() || "";
    const interval = current?.categoryInterval?.trim() || "";

    if (!value) return;

    const isDuplicate = categories.some(
      (item, i) =>
        i !== index &&
        item.categoryInterval?.trim().toLowerCase() === interval.toLowerCase() &&
        item.categoryValue?.trim().toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая категория уже существует в этом интервале!");
      const copy = [...categories];
      copy[index] = { ...copy[index], categoryValue: "" };
      handleInputChange("orderFields", "categories", copy);
    }
  };
  const addInterval = () => handleInputChange("orderFields", "intervals", [...(selectedValues.orderFields.intervals || []), { intervalValue: "" }]);
  const addCategory = () => handleInputChange("orderFields", "categories", [...(selectedValues.orderFields.categories || []), { categoryInterval: "", categoryValue: "" }]);
  const removeInterval = (idx) => handleInputChange("orderFields", "intervals", (selectedValues.orderFields.intervals || []).filter((_, i) => i !== idx));
  const removeCategory = (idx) => handleInputChange("orderFields", "categories", (selectedValues.orderFields.categories || []).filter((_, i) => i !== idx));

  // Finance
 const updateArticleValue = (index, value) => {
    const articles = selectedValues.financeFields.articles || [];
    const copy = [...articles];
    copy[index] = { ...copy[index], articleValue: value };
    handleInputChange("financeFields", "articles", copy);
  };

  const validateArticleOnBlur = (index) => {
    const articles = selectedValues.financeFields.articles || [];
    const value = articles[index]?.articleValue || "";

    if (!value.trim()) return;

    const isDuplicate = articles.some(
      (item, i) =>
        i !== index &&
        item.articleValue.trim().toLowerCase() === value.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая статья уже существует!");
      const copy = [...articles];
      copy[index] = { ...copy[index], articleValue: "" };
      handleInputChange("financeFields", "articles", copy);
    }
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
    const value = current?.subarticleValue?.trim() || "";
    const interval = current?.subarticleInterval?.trim() || "";

    if (!value) return;

    const isDuplicate = subs.some(
      (item, i) =>
        i !== index &&
        item.subarticleInterval?.trim().toLowerCase() === interval.toLowerCase() &&
        item.subarticleValue?.trim().toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
      alert("Такая подстатья уже существует для выбранной статьи или подкатегории!");
      const copy = [...subs];
      copy[index] = { ...copy[index], subarticleValue: "" };
      handleInputChange("financeFields", "subarticles", copy);
    }
  };
  const addArticle = () => handleInputChange("financeFields", "articles", [...(selectedValues.financeFields.articles || []), { articleValue: "" }]);
  const addSubarticle = () => handleInputChange("financeFields", "subarticles", [...(selectedValues.financeFields.subarticles || []), { subarticleInterval: "", subarticleValue: "" }]);
  const removeArticle = (idx) => handleInputChange("financeFields", "articles", (selectedValues.financeFields.articles || []).filter((_, i) => i !== idx));
  const removeSubarticle = (idx) => handleInputChange("financeFields", "subarticles", (selectedValues.financeFields.subarticles || []).filter((_, i) => i !== idx));

  // Card designs
  const updateCardDesigns = (newItems) => handleInputChange("assetsFields", "cardDesigns", newItems);
  const removeCardDesign = (idx) => updateCardDesigns((selectedValues.assetsFields.cardDesigns || []).filter((_, i) => i !== idx));

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
    () => (selectedValues.orderFields.intervals || []).map((i) => tidy(i.intervalValue)).filter(Boolean),
    [selectedValues.orderFields.intervals]
  );
  const articleOptions = useMemo(
    () => (selectedValues.financeFields.articles || []).map((a) => tidy(a.articleValue)).filter(Boolean),
    [selectedValues.financeFields.articles]
  );

  // удаление общих значений одновременно во всех местах
  const removeStringItemEverywhere = (key, value) => applyAndCheck(removeValueEverywhere(selectedValues, key, value));

  // ===== Рендер активной вкладки =====
  const renderActiveTabFields = () => {
    switch (activeTab) {
      case "orderFields":
        return (
          <div className="fields-vertical-grid">
            <IntervalFields
              intervals={selectedValues.orderFields.intervals || []}
              onIntervalChange={updateIntervalValue}   
              onIntervalBlur={validateIntervalOnBlur}
              onAddInterval={addInterval}
              onRemoveInterval={removeInterval}
            />
            <CategoryFields
              categories={selectedValues.orderFields.categories || []}
              onCategoryChange={updateCategoryValue}
              onCategoryBlur={validateCategoryOnBlur}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleCategoryDropdown}
              availableIntervals={intervalsOptions}
            />
            <div className="field-row">
              <label className="field-label">Валюта</label>
              <EditableList
                items={selectedValues.orderFields.currency || []}
                onChange={(newItems) => handleInputChange("orderFields", "currency", newItems)}
                onCommit={commitShared(["orderFields", "currency"], "currency")}
                onRemove={(_, value) => removeStringItemEverywhere("currency", value)}
                placeholder="Введите валюту"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Причина скидки</label>
              <EditableList
                items={selectedValues.orderFields.discountReason || []}
                onChange={(newItems) => handleInputChange("orderFields", "discountReason", newItems)}
                onCommit={commitShared(["orderFields", "discountReason"], "discountReason")}
                onRemove={(index) => {
                  const list = selectedValues.orderFields.discountReason || [];
                  handleInputChange("orderFields", "discountReason", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите причину скидки"
              />
            </div>
            <TagList
              title="Теги заказа"
              tags={selectedValues.orderFields.tags || []}
              onChange={(v) => handleInputChange("orderFields", "tags", v)}
            />
            <TagList
              title="Теги технологий"
              tags={selectedValues.orderFields.techTags || []}
              onChange={(v) => handleInputChange("orderFields", "techTags", v)}
            />
            <TagList
              title="Теги задач"
              tags={selectedValues.orderFields.taskTags || []}
              onChange={(v) => handleInputChange("orderFields", "taskTags", v)}
            />
          </div>
        );

      case "executorFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Валюта</label>
              <EditableList
                items={selectedValues.executorFields.currency || []}
                onChange={(newItems) => handleInputChange("executorFields", "currency", newItems)}
                onCommit={commitShared(["executorFields", "currency"], "currency")}
                onRemove={(_, value) => removeStringItemEverywhere("currency", value)}
                placeholder="Введите валюту"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Роль</label>
              <EditableList
                items={selectedValues.executorFields.role || []}
                onChange={(newItems) => handleInputChange("executorFields", "role", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.executorFields.role || [];
                  handleInputChange("executorFields", "role", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите роль"
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
                onChange={(newItems) => handleInputChange("clientFields", "category", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.clientFields.category || [];
                  handleInputChange("clientFields", "category", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите категорию"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Источник</label>
              <EditableList
                items={selectedValues.clientFields.source || []}
                onChange={(newItems) => handleInputChange("clientFields", "source", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.clientFields.source || [];
                  handleInputChange("clientFields", "source", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите источник"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Страна</label>
              <EditableList
                items={selectedValues.clientFields.country || []}
                onChange={(newItems) => handleInputChange("clientFields", "country", newItems)}
                onCommit={commitShared(["clientFields", "country"], "country")}
                onRemove={(_, value) => removeStringItemEverywhere("country", value)}
                placeholder="Введите страну"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Валюта</label>
              <EditableList
                items={selectedValues.clientFields.currency || []}
                onChange={(newItems) => handleInputChange("clientFields", "currency", newItems)}
                onCommit={commitShared(["clientFields", "currency"], "currency")}
                onRemove={(_, value) => removeStringItemEverywhere("currency", value)}
                placeholder="Введите валюту"
              />
            </div>
            <TagList
              title="Теги клиента"
              tags={selectedValues.clientFields.tags || []}
              onChange={(v) => handleInputChange("clientFields", "tags", v)}
            />
          </div>
        );

      case "employeeFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Страна</label>
              <EditableList
                items={selectedValues.employeeFields.country || []}
                onChange={(newItems) => handleInputChange("employeeFields", "country", newItems)}
                onCommit={commitShared(["employeeFields", "country"], "country")}
                onRemove={(_, value) => removeStringItemEverywhere("country", value)}
                placeholder="Введите страну"
              />
            </div>
            <TagList
              title="Теги сотрудника"
              tags={selectedValues.employeeFields.tags || []}
              onChange={(v) => handleInputChange("employeeFields", "tags", v)}
            />
          </div>
        );

      case "assetsFields":
        return (
          <div className="fields-vertical-grid">
            <div className="field-row">
              <label className="field-label">Валюта счета</label>
              <EditableList
                items={selectedValues.assetsFields.currency || []}
                onChange={(newItems) => handleInputChange("assetsFields", "currency", newItems)}
                onCommit={commitShared(["assetsFields", "currency"], "currency")}
                onRemove={(_, value) => removeStringItemEverywhere("currency", value)}
                placeholder="Введите валюту счета"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Тип</label>
              <EditableList
                items={selectedValues.assetsFields.type || []}
                onChange={(newItems) => handleInputChange("assetsFields", "type", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.assetsFields.type || [];
                  handleInputChange("assetsFields", "type", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите тип"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Платежная система</label>
              <EditableList
                items={selectedValues.assetsFields.paymentSystem || []}
                onChange={(newItems) => handleInputChange("assetsFields", "paymentSystem", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.assetsFields.paymentSystem || [];
                  handleInputChange("assetsFields", "paymentSystem", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите платежную систему"
              />
            </div>
            <div className="field-row">
              <label className="field-label">Дизайн карты</label>
              <CardDesignUpload
                cardDesigns={selectedValues.assetsFields.cardDesigns || []}
                onAdd={(newItems) => updateCardDesigns(newItems)}
                onRemove={removeCardDesign}
                onError={({ title, message }) => openErrorModal(title, message)}
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
              onRemoveArticle={removeArticle}
            />
            <div className="field-row">
              <label className="field-label">Подкатегория</label>
              <EditableList
                items={selectedValues.financeFields.subcategory || []}
                onChange={(newItems) => handleInputChange("financeFields", "subcategory", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.financeFields.subcategory || [];
                  handleInputChange("financeFields", "subcategory", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите подкатегорию"
              />
            </div>
            <SubarticleFields
              subarticles={selectedValues.financeFields?.subarticles || []}
              onSubarticleChange={updateSubarticleValue}
              onSubarticleBlur={validateSubarticleOnBlur}
              onAddSubarticle={addSubarticle}
              onRemoveSubarticle={removeSubarticle}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleSubarticleDropdown}
              availableArticles={articleOptions}
              availableSubcategories={selectedValues.financeFields?.subcategory || []}
            />
          </div>
        );

      case "sundryFields":
        return(
          <div className="field-row">
              <label className="field-label">Тип работы</label>
              <EditableList
                items={selectedValues.sundryFields.typeWork || []}
                onChange={(newItems) => handleInputChange("sundryFields", "typeWork", newItems)}
                onRemove={(index) => {
                  const list = selectedValues.sundryFields.typeWork || [];
                  handleInputChange("sundryFields", "typeWork", list.filter((_, i) => i !== index));
                }}
                placeholder="Введите тип работы"
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
                СПИСКИ
                </h1>
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
