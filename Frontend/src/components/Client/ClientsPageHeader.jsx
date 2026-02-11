import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSearch } from "react-icons/fa";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import styles from "./ClientsPageHeader.module.css";

// Вспомогательная функция, чтобы безопасно достать имя из строки или объекта
const getName = (item) => {
  if (!item) return "";
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return item.name || item.code || item.value || "";
  return String(item);
};

function MultiTagSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Теги...",
  maxVisibleChips = 4,
  usePortal = true,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const hostRef = useRef(null);
  const dropdownRef = useRef(null);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    // ИСПРАВЛЕНО: поддержка объектов в тегах
    return qq 
      ? options.filter(o => getName(o).toLowerCase().includes(qq)) 
      : options;
  }, [options, q]);

  useEffect(() => {
    if (!usePortal) return;
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.zIndex = "2147483000";
    host.style.left = "0px";
    host.style.top = "0px";
    document.body.appendChild(host);
    hostRef.current = host;
    return () => {
      document.body.removeChild(host);
      hostRef.current = null;
    };
  }, [usePortal]);

  const placeDropdown = () => {
    if (!usePortal || !open || !triggerRef.current || !hostRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const width = r.width;
    let left = r.left;
    let top = r.bottom + 6;

    const ddh = dropdownRef.current?.offsetHeight ?? 300;
    if (top + ddh > window.innerHeight - 8) {
      top = Math.max(8, r.top - ddh - 6);
    }
    if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
    left = Math.max(8, left);

    const host = hostRef.current;
    host.style.width = `${width}px`;
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  };

  useEffect(() => {
    if (!open) return;
    placeDropdown();
    const onScroll = () => placeDropdown();
    const onResize = () => placeDropdown();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    const onDocClick = (e) => {
      const inTrigger = wrapRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = (tagItem) => {
    // Сохраняем только имя тега в массив значений
    const tagName = getName(tagItem);
    value.includes(tagName)
      ? onChange(value.filter(v => v !== tagName))
      : onChange([...value, tagName]);
  };

  const selectAll = () => {
      const allNames = filtered.map(getName);
      onChange(Array.from(new Set([...value, ...allNames])));
  };
  const clearAll  = () => onChange([]);

  const displayed = value.slice(0, maxVisibleChips);
  const overflow  = Math.max(0, value.length - displayed.length);

  const Dropdown = (
    <div
      ref={dropdownRef}
      className={`${styles.tagsDropdown} ${usePortal ? styles.tagsDropdownPortal : ""}`}
      role="listbox"
    >
      <div className={styles.tagsSticky}>
        <input
          className={styles.tagsSearch}
          type="text"
          placeholder="Найти тег…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className={styles.tagsActions}>
          <button type="button" onClick={selectAll}>Выбрать всё</button>
          <button type="button" onClick={clearAll}>Очистить</button>
        </div>
      </div>

      <div className={styles.tagsOptions}>
        {filtered.length === 0 && <div className={styles.tagsEmpty}>Ничего не найдено</div>}
        {filtered.map((tagItem, idx) => {
          const tagName = getName(tagItem);
          const checked = value.includes(tagName);
          // Используем tagName как ключ, либо idx если вдруг имя пустое
          const key = tagName || idx; 
          return (
            <label key={key} className={`${styles.tagsOption} ${checked ? styles.isChecked : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(tagItem)} />
              <span className={styles.tagsOptionText}>{tagName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.tagsSelect} ref={wrapRef}>
      <div
        ref={triggerRef}
        className={`${styles.tagsInput} ${open ? styles.isOpen : ""}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className={styles.tagsChips}>
          {value.length === 0 ? (
            <span className={styles.tagsPlaceholder}>{placeholder}</span>
          ) : (
            <>
              {displayed.map(tag => (
                <span className={styles.tagChip} key={tag}>
                  <span className={styles.tagChipText}>{tag}</span>
                  <button
                    type="button"
                    className={styles.tagChipRemove}
                    onClick={(e) => { e.stopPropagation(); onChange(value.filter(v => v !== tag)); }}
                    aria-label={`Удалить тег ${tag}`}
                    title="Удалить"
                  >
                    ×
                  </button>
                </span>
              ))}
              {overflow > 0 && (
                <span className={`${styles.tagChip} ${styles.tagChipCount}`} title={value.join(", ")}>
                  +{overflow}
                </span>
              )}
            </>
          )}
        </div>

        {value.length > 0 && (
          <button
            type="button"
            className={`${styles.tagsClear} ${styles.clearBeforeCaret}`}
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
            aria-label="Очистить теги"
            title="Очистить теги"
          >
            ×
          </button>
        )}
        <span className={styles.tagsCaret} aria-hidden="true">▾</span>
      </div>

      {open && (!usePortal ? Dropdown : (hostRef.current && createPortal(Dropdown, hostRef.current)))}
    </div>
  );
}

/* ===========================
   Хедер и фильтры
   =========================== */
export default function ClientsPageHeader({
  onAdd,
  onSearch,
  total,
  currencyOptions = [],
  statusOptions   = [],
  tagOptions      = [],
  sourceOptions   = [],
  categoryOptions = [],
  countryOptions  = [],
  onFilterChange,
}) {
  
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    currency: "", status: "", tags: [], source: "", category: "", country: "",
    share: "", dateFrom: "", dateTo: ""
  });

  const inputRef = useRef(null);

  // Фокус при открытии панели (как в журнале)
  useEffect(() => { if (showAdvanced) inputRef.current?.focus(); }, [showAdvanced]);

  
  const preview = useMemo(() => {
    const parts = [];
    if (query) parts.push(query);
    if (filters.currency) parts.push(`валюта:${filters.currency}`);
    if (filters.status) parts.push(`статус:${filters.status}`);
    if (filters.tags?.length) parts.push(`теги:${filters.tags.join(", ")}`);
    if (filters.source) parts.push(`источник:${filters.source}`);
    if (filters.category) parts.push(`категория:${filters.category}`);
    if (filters.country) parts.push(`страна:${filters.country}`);
    if (filters.share) parts.push(`доля:${filters.share === "yes" ? "есть" : "нет"}`);
    if (filters.dateFrom || filters.dateTo) {
      parts.push(`дата:${filters.dateFrom || "…"}–${filters.dateTo || "…"}`);
    }
    return parts.join("  •  ");
  }, [query, filters]);

  const handleChange = (field) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue;
    setFilters(f => ({ ...f, [field]: value }));
  };

  const handleApply = () => {
    onFilterChange?.(filters);
    onSearch?.(query.trim());
    setShowAdvanced(false);
  };

  const handleReset = () => {
    const empty = { currency:"", status:"", tags:[], source:"", category:"", country:"", share:"", dateFrom:"", dateTo:"" };
    setFilters(empty);
    setQuery("");
    onFilterChange?.(empty);
    onSearch?.("");
  };

  const hasActive =
    !!(query || filters.currency || filters.status || filters.tags.length ||
       filters.source || filters.category || filters.country || filters.share ||
       filters.dateFrom || filters.dateTo);

  return (
    <header className={styles.clientsHeaderContainer}>
      <h1 className={styles.journalTitle}>
        <PageHeaderIcon pageName="Клиенты" />
        КЛИЕНТЫ
      </h1>
      <span className={styles.headerDivider} aria-hidden="true" />

      
      <div className={`${styles.searchContainer} ${showAdvanced ? styles.active : ""}`} role="search">
        <div className={styles.mainSearchBar}>
          <span className={styles.searchIcon} aria-hidden="true"><FaSearch /></span>

          <input
            ref={inputRef}
            type="text"
            className={styles.mainSearchInput}
            placeholder="Введите параметры поиска (откроются фильтры)"
            value={preview}
            onChange={() => {}}
            onFocus={() => setShowAdvanced(true)}
            readOnly
            aria-label="Поиск по всем полям (настройки в фильтрах)"
          />

          <div className={styles.statPill} title={`Итого клиентов: ${total ?? 0}`}>
            <span className={styles.statPillLabel}>Итого клиентов </span>
            <span className={styles.statPillValue}>{total ?? 0}</span>
          </div>

          <span
            className={styles.toggleAdvancedSearch}
            onClick={() => setShowAdvanced(v => !v)}
            role="button"
            aria-label={showAdvanced ? "Скрыть фильтры" : "Показать фильтры"}
            aria-expanded={showAdvanced}
            title="Фильтры"
          >
            {showAdvanced ? "▲" : "▼"}
          </span>
        </div>

        {/* Панель фильтров — снизу, поверх таблицы (как в журнале) */}
        <div className={`${styles.filtersPanel} ${!showAdvanced ? styles.hidden : ""}`}>
          <div className={styles.advancedSearchFields}>
            <div className={styles.searchFieldGroup}>
              <label>Валюта</label>
              <select value={filters.currency} onChange={handleChange("currency")}>
                <option value="" disabled hidden>Не выбрано</option>
                {/* ИСПРАВЛЕНО: Безопасный рендеринг объектов */}
                {currencyOptions.map((cur, idx) => {
                    const name = getName(cur);
                    return <option key={name || idx} value={name}>{name}</option>
                })}
              </select>
              {filters.currency && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, currency: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Статус</label>
              <select value={filters.status} onChange={handleChange("status")}>
                <option value="" disabled hidden>Не выбрано</option>
                {/* ИСПРАВЛЕНО */}
                {statusOptions.map((st, idx) => {
                    const name = getName(st);
                    return <option key={name || idx} value={name}>{name}</option>
                })}
              </select>
              {filters.status && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, status: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Теги</label>
              <MultiTagSelect
                options={tagOptions}
                value={filters.tags}
                onChange={handleChange("tags")}
                placeholder="Выберите теги"
              />
              {!!filters.tags.length && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, tags: [] }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Источник</label>
              <select value={filters.source} onChange={handleChange("source")}>
                <option value="" disabled hidden>Не выбрано</option>
                {/* ИСПРАВЛЕНО */}
                {sourceOptions.map((s, idx) => {
                    const name = getName(s);
                    return <option key={name || idx} value={name}>{name}</option>
                })}
              </select>
              {filters.source && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, source: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Категория</label>
              <select value={filters.category} onChange={handleChange("category")}>
                <option value="" disabled hidden>Не выбрано</option>
                {categoryOptions.map((c, idx) => {
                    const name = getName(c);
                    return <option key={name || idx} value={name}>{name}</option>
                })}
              </select>
              {filters.category && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, category: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Страна</label>
              <select value={filters.country} onChange={handleChange("country")}>
                <option value="" disabled hidden>Не выбрано</option>
                {/* ИСПРАВЛЕНО */}
                {countryOptions.map((c, idx) => {
                    const name = getName(c);
                    return <option key={name || idx} value={name}>{name}</option>
                })}
              </select>
              {filters.country && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, country: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={styles.searchFieldGroup}>
              <label>Есть доля?</label>
              <select value={filters.share} onChange={handleChange("share")}>
                <option value="" disabled hidden>Не выбрано</option>
                <option value="yes">Да</option>
                <option value="no">Нет</option>
              </select>
              {filters.share && (
                <span
                  className={`${styles.fieldClear} ${styles.clearBeforeCaret}`}
                  onClick={() => setFilters(f => ({ ...f, share: "" }))}
                  title="Очистить"
                >×</span>
              )}
            </div>

            <div className={`${styles.searchFieldGroup} ${styles.dateRangeGroup}`}>
              <label>Дата последнего заказа</label>
              <div className={styles.dateFilterInline}>
                <span>с</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                />
                <span>по</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                />
                {(filters.dateFrom || filters.dateTo) && (
                  <span
                    className={styles.fieldClear}
                    onClick={() => setFilters(f => ({ ...f, dateFrom: "", dateTo: "" }))}
                    title="Очистить"
                  >×</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.searchButtons}>
            <button className={styles.resetButton} type="button" onClick={handleReset}>Сбросить</button>
            <button className={styles.searchButton} type="button" onClick={handleApply}>Поиск</button>
          </div>
        </div>
      </div>

      <button type="button" className={styles.addEntryButton} onClick={onAdd}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
      </button>
    </header>
  );
}