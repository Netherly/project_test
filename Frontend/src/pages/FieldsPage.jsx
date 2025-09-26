// src/pages/FieldsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Fields.css";
import { fetchFields, saveFields } from "../api/fields";
import { fileUrl } from "../api/http";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";

/* =========================
   Константы и утилиты
   ========================= */
const MAX_IMAGE_BYTES = 500 * 1024;
const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const tidy = (v) => String(v ?? "").trim();
const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

const tabs = [
  { key: "order", label: "Поля заказа" },
  { key: "executor", label: "Поля исполнителя" },
  { key: "client", label: "Поля клиента" },
  { key: "employee", label: "Поля сотрудника" },
  { key: "assets", label: "Поля активов" },
  { key: "finance", label: "Поля финансов" },
];

/* =========================
   Нормализация (бэк → фронт)
   ========================= */

const normStrs = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((v) => (typeof v === "string" ? tidy(v) : tidy(v?.name ?? v?.value)))
    .filter(Boolean);

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

// независимые теги {id,name,color}
const normTags = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((t) => {
      if (typeof t === "string") return { id: rid(), name: tidy(t), color: "#ffffff" };
      return {
        id: t?.id || rid(),
        name: tidy(t?.name ?? t?.value),
        color: isHex(t?.color) ? t.color : "#ffffff",
      };
    })
    .filter((t) => t.name !== "");

function normalizeFromBackend(payload) {
  const data = payload?.ok && payload?.data ? payload.data : payload || {};
  return {
    orderFields: {
      intervals: normIntervals(data?.orderFields?.intervals),
      categories: normCategories(data?.orderFields?.categories),
      currency: normStrs(data?.orderFields?.currency),
      // независимые наборы тегов в заказах
      tags: normTags(data?.orderFields?.tags),           // «общие теги заказа»
      techTags: normTags(data?.orderFields?.techTags),   // теги технологий
      taskTags: normTags(data?.orderFields?.taskTags),   // теги задач
    },
    executorFields: {
      currency: normStrs(data?.executorFields?.currency),
      role: normStrs(data?.executorFields?.role),
    },
    clientFields: {
      source: normStrs(data?.clientFields?.source),
      category: normStrs(data?.clientFields?.category),
      country: normStrs(data?.clientFields?.country),
      currency: normStrs(data?.clientFields?.currency),
      // теги клиента (независимые)
      tags: normTags(data?.clientFields?.tags ?? data?.clientFields?.tag),
    },
    employeeFields: {
      country: normStrs(data?.employeeFields?.country),
      // теги сотрудника (независимые)
      tags: normTags(data?.employeeFields?.tags),
    },
    assetsFields: {
      currency: normStrs(data?.assetsFields?.currency),
      type: normStrs(data?.assetsFields?.type),
      paymentSystem: normStrs(data?.assetsFields?.paymentSystem),
      cardDesigns: normDesigns(data?.assetsFields?.cardDesigns),
    },
    financeFields: {
      articles: normArticles(data?.financeFields?.articles),
      subarticles: normSubarticles(data?.financeFields?.subarticles),
      subcategory: normStrs(data?.financeFields?.subcategory),
    },
  };
}

/* =========================
   Сериализация (фронт → бэк)
   ========================= */

const serStrs = (arr) => (Array.isArray(arr) ? arr : []).map((v) => tidy(v)).filter(Boolean);
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
const serTags = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((t) => ({ id: t?.id || rid(), name: tidy(t?.name), color: isHex(t?.color) ? t.color : "#ffffff" }))
    .filter((t) => t.name);

function serializeForSave(v) {
  return {
    orderFields: {
      intervals: serIntervals(v?.orderFields?.intervals),
      categories: serCategories(v?.orderFields?.categories),
      currency: serStrs(v?.orderFields?.currency),
      tags: serTags(v?.orderFields?.tags),
      techTags: serTags(v?.orderFields?.techTags),
      taskTags: serTags(v?.orderFields?.taskTags),
    },
    executorFields: {
      currency: serStrs(v?.executorFields?.currency),
      role: serStrs(v?.executorFields?.role),
    },
    clientFields: {
      source: serStrs(v?.clientFields?.source),
      category: serStrs(v?.clientFields?.category),
      country: serStrs(v?.clientFields?.country),
      currency: serStrs(v?.clientFields?.currency),
      tags: serTags(v?.clientFields?.tags),
    },
    employeeFields: {
      country: serStrs(v?.employeeFields?.country),
      tags: serTags(v?.employeeFields?.tags),
    },
    assetsFields: {
      currency: serStrs(v?.assetsFields?.currency),
      type: serStrs(v?.assetsFields?.type),
      paymentSystem: serStrs(v?.assetsFields?.paymentSystem),
      cardDesigns: serDesigns(v?.assetsFields?.cardDesigns),
    },
    financeFields: {
      articles: serArticles(v?.financeFields?.articles),
      subarticles: serSubarticles(v?.financeFields?.subarticles),
      subcategory: serStrs(v?.financeFields?.subcategory),
    },
  };
}

/* =========================
   Подкомпоненты UI
   ========================= */

// base text input list (строки)
const EditableList = ({ items = [], placeholder, onChange, onRemove }) => (
  <div className="category-fields-container">
    {(items || []).map((val, i) => (
      <div key={i} className="category-field-group">
        <div className="category-container">
          <div className="category-full">
            <input
              className="text-input"
              type="text"
              value={val}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          </div>
          <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
        </div>
      </div>
    ))}
    <button className="add-category-btn" onClick={() => onChange([...(items || []), ""])}>+ Добавить</button>
  </div>
);

// интервалы
const IntervalFields = ({ intervals, onChange, onAdd, onRemove }) => (
  <div className="field-row">
    <label className="field-label">Интервал</label>
    <div className="category-fields-container">
      {(intervals || []).map((it, i) => (
        <div key={it.id || i} className="category-field-group">
          <div className="category-container">
            <div className="category-full">
              <input
                className="text-input"
                type="text"
                value={it.intervalValue ?? ""}
                placeholder="Введите интервал"
                onChange={(e) => {
                  const next = [...intervals];
                  next[i] = { ...next[i], intervalValue: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
          </div>
        </div>
      ))}
      <button className="add-category-btn" onClick={onAdd}>+ Добавить интервал</button>
    </div>
  </div>
);

// категории (интервал + значение)
const CategoryFields = ({ categories, intervalsOptions, onChange, onAdd, onRemove }) => (
  <div className="field-row category-field">
    <label className="field-label">Категория</label>
    <div className="category-fields-container">
      {(categories || []).map((c, i) => (
        <div key={i} className="category-field-group">
          <div className="category-container">
            <div className="category-left">
              <div className="dropdown-container">
                <select
                  className="text-input"
                  value={c.categoryInterval || ""}
                  onChange={(e) => {
                    const next = [...categories];
                    next[i] = { ...next[i], categoryInterval: e.target.value };
                    onChange(next);
                  }}
                >
                  <option value="">Выберите интервал…</option>
                  {intervalsOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="category-right">
              <input
                className="text-input"
                type="text"
                value={c.categoryValue || ""}
                placeholder="Введите значение"
                onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...next[i], categoryValue: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
          </div>
        </div>
      ))}
      <button className="add-category-btn" onClick={onAdd}>+ Добавить категорию</button>
    </div>
  </div>
);

// статьи
const ArticleFields = ({ articles, onChange, onAdd, onRemove }) => (
  <div className="field-row">
    <label className="field-label">Статья</label>
    <div className="category-fields-container">
      {(articles || []).map((a, i) => (
        <div key={i} className="category-field-group">
          <div className="category-container">
            <div className="category-full">
              <input
                className="text-input"
                type="text"
                value={a.articleValue || ""}
                placeholder="Введите статью"
                onChange={(e) => {
                  const next = [...articles];
                  next[i] = { ...next[i], articleValue: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
          </div>
        </div>
      ))}
      <button className="add-category-btn" onClick={onAdd}>+ Добавить статью</button>
    </div>
  </div>
);

// подстатьи: выбор интервала = статья или подкатегория
const SubarticleFields = ({ subarticles, articleOptions, subcategoryOptions, onChange, onAdd, onRemove }) => (
  <div className="field-row article-field">
    <label className="field-label">Подстатья</label>
    <div className="category-fields-container">
      {(subarticles || []).map((s, i) => (
        <div key={i} className="category-field-group">
          <div className="category-container">
            <div className="category-left">
              <select
                className="text-input"
                value={s.subarticleInterval || ""}
                onChange={(e) => {
                  const next = [...subarticles];
                  next[i] = { ...next[i], subarticleInterval: e.target.value };
                  onChange(next);
                }}
              >
                <option value="">Выберите статью/подкатегорию…</option>
                {articleOptions.map((name) => (
                  <option key={`art-${name}`} value={name}>{name}</option>
                ))}
                {subcategoryOptions.map((name) => (
                  <option key={`sub-${name}`} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="category-right">
              <input
                className="text-input"
                type="text"
                value={s.subarticleValue || ""}
                placeholder="Введите значение"
                onChange={(e) => {
                  const next = [...subarticles];
                  next[i] = { ...next[i], subarticleValue: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
          </div>
        </div>
      ))}
      <button className="add-category-btn" onClick={onAdd}>+ Добавить подстатью</button>
    </div>
  </div>
);

// независимые теги {id,name,color}
const TagList = ({ title, tags = [], onChange }) => {
  const add = () => onChange([...(tags || []), { id: rid(), name: "", color: "#ffffff" }]);
  const upd = (i, patch) => {
    const next = [...(tags || [])];
    next[i] = { ...next[i], ...patch };
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
                  className="text-input"
                  type="text"
                  placeholder="Название тега"
                  value={t.name}
                  onChange={(e) => upd(i, { name: e.target.value })}
                />
              </div>
              <div className="category-right" style={{ flex: "0 0 120px", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={t.color || "#ffffff"}
                  onChange={(e) => upd(i, { color: e.target.value })}
                  title="Цвет"
                  style={{ width: 40, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
                />
                <input
                  className="text-input"
                  type="text"
                  value={t.color || "#ffffff"}
                  onChange={(e) => upd(i, { color: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
              <button className="remove-category-btn" onClick={() => del(i)} title="Удалить">×</button>
            </div>
          </div>
        ))}
        <button className="add-category-btn" onClick={add}>+ Добавить тег</button>
      </div>
    </div>
  );
};

// Загрузка дизайнов карт
const CardDesignUpload = ({ items = [], onChange, onRemove, onError }) => {
  const inputRefs = useRef([]);

  const safeUrl = (u) => {
    const s = tidy(u);
    if (!s) return "";
    if (s.startsWith("data:") || /^https?:\/\//i.test(s)) return s;
    try { return fileUrl(s); } catch { return s; }
  };

  const ensure = (arr, i) => {
    const next = [...arr];
    next[i] = { id: next[i]?.id || rid(), name: next[i]?.name || "", url: next[i]?.url || "", size: next[i]?.size ?? null };
    return next;
    };

  const trigger = (i) => inputRefs.current[i]?.click();

  const onFile = (e, i) => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      onError?.("Неверный формат", "Выберите изображение.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      onError?.("Файл слишком большой", `Максимум ${(MAX_IMAGE_BYTES / 1024).toFixed(0)} KB`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const next = ensure(items, i);
      next[i] = { ...next[i], url: ev.target.result, size: f.size };
      onChange(next);
    };
    reader.onerror = () => onError?.("Ошибка чтения", "Не удалось прочитать файл.");
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const add = () => onChange([...(items || []), { id: rid(), name: "", url: "", size: null }]);

  return (
    <div className="category-fields-container">
      {(items || []).map((d, i) => (
        <div key={d.id || i} className="category-field-group">
          <div className="card-design-row">
            <div className="card-design-input">
              <input
                className="text-input"
                type="text"
                value={d.name || ""}
                placeholder="Название дизайна"
                onChange={(e) => {
                  const next = ensure(items, i);
                  next[i] = { ...next[i], name: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <div className="card-design-upload">
              <input
                ref={(el) => (inputRefs.current[i] = el)}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onFile(e, i)}
              />
              <div className="card-design-preview" title="Кликните, чтобы заменить" onClick={() => trigger(i)}>
                {d.url ? (
                  <img className="card-design-image" src={safeUrl(d.url)} alt={d.name || "design"} />
                ) : (
                  <div className="card-design-placeholder upload-design-btn">+ Загрузить изображение</div>
                )}
              </div>
              <div className="card-design-actions" style={{ marginLeft: 8 }}>
                <button className="upload-design-btn" onClick={() => trigger(i)}>Заменить</button>
                <button className="remove-category-btn" onClick={() => onRemove(i)} title="Удалить">×</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="add-category-btn" onClick={add}>+ Добавить дизайн карты</button>
    </div>
  );
};

/* =========================
   Основной компонент
   ========================= */
function FieldsPage() {
  const [data, setData] = useState(null);
  const [saved, setSaved] = useState(null);
  const [active, setActive] = useState("order");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ open: false });

  const hasChanges = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = await fetchFields();
        const norm = normalizeFromBackend(raw);
        setData(norm);
        setSaved(norm);
      } catch (e) {
        setModal({
          open: true,
          title: "Ошибка загрузки",
          message: e?.message || "Не удалось получить данные.",
          confirmText: "OK",
          onConfirm: () => setModal({ open: false }),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const patch = (path, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts.at(-1)] = value;
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = serializeForSave(data);
      await saveFields(payload);
      const raw = await fetchFields();
      const norm = normalizeFromBackend(raw);
      setData(norm);
      setSaved(norm);
    } catch (e) {
      setModal({
        open: true,
        title: "Ошибка сохранения",
        message: e?.message || "Не удалось сохранить изменения.",
        confirmText: "OK",
        onConfirm: () => setModal({ open: false }),
      });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => setData(saved);

  /* ======== Рендер ======== */
  if (loading || !data) {
    return (
      <div className="fields-main-container">
        <Sidebar />
        <div className="fields-main-container-wrapper">
          <div className="header">
            <div className="header-content">
              <div className="header-left"><h1 className="lists-title">СПИСКИ</h1></div>
              <div className="header-actions"><span className="loading-label">Загрузка…</span></div>
            </div>
          </div>
          <div className="fields-container" />
        </div>
      </div>
    );
  }

  const intervalsOptions = (data.orderFields.intervals || [])
    .map((i) => tidy(i.intervalValue))
    .filter(Boolean);

  const articleOptions = (data.financeFields.articles || [])
    .map((a) => tidy(a.articleValue))
    .filter(Boolean);

  return (
    <div className="fields-main-container">
      <Sidebar />
      <div className="fields-main-container-wrapper">
        <div className="header">
          <div className="header-content">
            <div className="header-left"><h1 className="lists-title">СПИСКИ</h1></div>
            <div className="header-actions">
              {saving && <span className="loading-label">Сохранение…</span>}
              {hasChanges && !saving && (
                <>
                  <button className="save-btn" onClick={save}>Сохранить</button>
                  <button className="cancel-btn" onClick={cancel}>Отменить</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="fields-container">
          <div className="main-content-wrapper">
            <div className="tabs-content-wrapper">
              <div className="tabs-container">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    className={`tab-button ${active === t.key ? "active" : ""}`}
                    onClick={() => setActive(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="fields-content">
                <div className="fields-box">
                  {/* Заказ */}
                  {active === "order" && (
                    <div className="fields-vertical-grid">
                      <IntervalFields
                        intervals={data.orderFields.intervals}
                        onChange={(v) => patch("orderFields.intervals", v)}
                        onAdd={() => patch("orderFields.intervals", [...data.orderFields.intervals, { id: rid(), intervalValue: "" }])}
                        onRemove={(i) => patch("orderFields.intervals", data.orderFields.intervals.filter((_, idx) => idx !== i))}
                      />

                      <CategoryFields
                        categories={data.orderFields.categories}
                        intervalsOptions={intervalsOptions}
                        onChange={(v) => patch("orderFields.categories", v)}
                        onAdd={() => patch("orderFields.categories", [...data.orderFields.categories, { categoryInterval: "", categoryValue: "" }])}
                        onRemove={(i) => patch("orderFields.categories", data.orderFields.categories.filter((_, idx) => idx !== i))}
                      />

                      <div className="field-row">
                        <label className="field-label">Валюта</label>
                        <EditableList
                          items={data.orderFields.currency}
                          placeholder="Введите валюту"
                          onChange={(v) => patch("orderFields.currency", v)}
                          onRemove={(i) => patch("orderFields.currency", data.orderFields.currency.filter((_, idx) => idx !== i))}
                        />
                      </div>

                      <TagList title="Теги заказа" tags={data.orderFields.tags} onChange={(v) => patch("orderFields.tags", v)} />
                      <TagList title="Теги технологий (заказ)" tags={data.orderFields.techTags} onChange={(v) => patch("orderFields.techTags", v)} />
                      <TagList title="Теги задач (заказ)" tags={data.orderFields.taskTags} onChange={(v) => patch("orderFields.taskTags", v)} />
                    </div>
                  )}

                  {/* Исполнитель */}
                  {active === "executor" && (
                    <div className="fields-vertical-grid">
                      <div className="field-row">
                        <label className="field-label">Валюта</label>
                        <EditableList
                          items={data.executorFields.currency}
                          placeholder="Введите валюту"
                          onChange={(v) => patch("executorFields.currency", v)}
                          onRemove={(i) => patch("executorFields.currency", data.executorFields.currency.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Роль</label>
                        <EditableList
                          items={data.executorFields.role}
                          placeholder="Введите роль"
                          onChange={(v) => patch("executorFields.role", v)}
                          onRemove={(i) => patch("executorFields.role", data.executorFields.role.filter((_, idx) => idx !== i))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Клиент */}
                  {active === "client" && (
                    <div className="fields-vertical-grid">
                      <div className="field-row">
                        <label className="field-label">Источник</label>
                        <EditableList
                          items={data.clientFields.source}
                          placeholder="Введите источник"
                          onChange={(v) => patch("clientFields.source", v)}
                          onRemove={(i) => patch("clientFields.source", data.clientFields.source.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Категория</label>
                        <EditableList
                          items={data.clientFields.category}
                          placeholder="Введите категорию"
                          onChange={(v) => patch("clientFields.category", v)}
                          onRemove={(i) => patch("clientFields.category", data.clientFields.category.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Страна</label>
                        <EditableList
                          items={data.clientFields.country}
                          placeholder="Введите страну"
                          onChange={(v) => patch("clientFields.country", v)}
                          onRemove={(i) => patch("clientFields.country", data.clientFields.country.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Валюта</label>
                        <EditableList
                          items={data.clientFields.currency}
                          placeholder="Введите валюту"
                          onChange={(v) => patch("clientFields.currency", v)}
                          onRemove={(i) => patch("clientFields.currency", data.clientFields.currency.filter((_, idx) => idx !== i))}
                        />
                      </div>

                      <TagList title="Теги клиента" tags={data.clientFields.tags} onChange={(v) => patch("clientFields.tags", v)} />
                    </div>
                  )}

                  {/* Сотрудник */}
                  {active === "employee" && (
                    <div className="fields-vertical-grid">
                      <div className="field-row">
                        <label className="field-label">Страна</label>
                        <EditableList
                          items={data.employeeFields.country}
                          placeholder="Введите страну"
                          onChange={(v) => patch("employeeFields.country", v)}
                          onRemove={(i) => patch("employeeFields.country", data.employeeFields.country.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <TagList title="Теги сотрудника" tags={data.employeeFields.tags} onChange={(v) => patch("employeeFields.tags", v)} />
                    </div>
                  )}

                  {/* Активы */}
                  {active === "assets" && (
                    <div className="fields-vertical-grid">
                      <div className="field-row">
                        <label className="field-label">Валюта счёта</label>
                        <EditableList
                          items={data.assetsFields.currency}
                          placeholder="Введите валюту"
                          onChange={(v) => patch("assetsFields.currency", v)}
                          onRemove={(i) => patch("assetsFields.currency", data.assetsFields.currency.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Тип</label>
                        <EditableList
                          items={data.assetsFields.type}
                          placeholder="Введите тип"
                          onChange={(v) => patch("assetsFields.type", v)}
                          onRemove={(i) => patch("assetsFields.type", data.assetsFields.type.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Платёжная система</label>
                        <EditableList
                          items={data.assetsFields.paymentSystem}
                          placeholder="Введите платежную систему"
                          onChange={(v) => patch("assetsFields.paymentSystem", v)}
                          onRemove={(i) => patch("assetsFields.paymentSystem", data.assetsFields.paymentSystem.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Дизайн карты</label>
                        <CardDesignUpload
                          items={data.assetsFields.cardDesigns}
                          onChange={(v) => patch("assetsFields.cardDesigns", v)}
                          onRemove={(i) => patch("assetsFields.cardDesigns", data.assetsFields.cardDesigns.filter((_, idx) => idx !== i))}
                          onError={(title, message) =>
                            setModal({ open: true, title, message, confirmText: "OK", onConfirm: () => setModal({ open: false }) })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Финансы */}
                  {active === "finance" && (
                    <div className="fields-vertical-grid">
                      <ArticleFields
                        articles={data.financeFields.articles}
                        onChange={(v) => patch("financeFields.articles", v)}
                        onAdd={() => patch("financeFields.articles", [...data.financeFields.articles, { articleValue: "" }])}
                        onRemove={(i) => patch("financeFields.articles", data.financeFields.articles.filter((_, idx) => idx !== i))}
                      />

                      <div className="field-row">
                        <label className="field-label">Подкатегория</label>
                        <EditableList
                          items={data.financeFields.subcategory}
                          placeholder="Введите подкатегорию"
                          onChange={(v) => patch("financeFields.subcategory", v)}
                          onRemove={(i) => patch("financeFields.subcategory", data.financeFields.subcategory.filter((_, idx) => idx !== i))}
                        />
                      </div>

                      <SubarticleFields
                        subarticles={data.financeFields.subarticles}
                        articleOptions={articleOptions}
                        subcategoryOptions={data.financeFields.subcategory}
                        onChange={(v) => patch("financeFields.subarticles", v)}
                        onAdd={() => patch("financeFields.subarticles", [...data.financeFields.subarticles, { subarticleInterval: "", subarticleValue: "" }])}
                        onRemove={(i) => patch("financeFields.subarticles", data.financeFields.subarticles.filter((_, idx) => idx !== i))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal.open && (
        <ConfirmationModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText || "OK"}
          cancelText={modal.cancelText || "Закрыть"}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel || (() => setModal({ open: false }))}
        />
      )}
    </div>
  );
}

export default FieldsPage;
