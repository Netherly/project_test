import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSearch, FaFilter } from "react-icons/fa";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import styles from "./ClientsPageHeader.module.css";

/* ===========================
   MultiTagSelect (portal + позиционирование)
   =========================== */
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
    return qq ? options.filter(o => o.toLowerCase().includes(qq)) : options;
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

  const toggle = (tag) =>
    value.includes(tag)
      ? onChange(value.filter(v => v !== tag))
      : onChange([...value, tag]);

  const selectAll = () => onChange(Array.from(new Set([...value, ...filtered])));
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
        {filtered.map(tag => {
          const checked = value.includes(tag);
          return (
            <label key={tag} className={`${styles.tagsOption} ${checked ? styles.isChecked : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(tag)} />
              <span className={styles.tagsOptionText}>{tag}</span>
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
  countryOptions  = [],
  onFilterChange,
}) {
  // query оставляем для совместимости, но ввод через главный инпут отключаем
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    currency: "", status: "", tags: [], source: "", country: "",
    share: "", dateFrom: "", dateTo: ""
  });

  const inputRef = useRef(null);

  // Фокус при открытии панели (как в журнале)
  useEffect(() => { if (showAdvanced) inputRef.current?.focus(); }, [showAdvanced]);

  // Сборка превью для главной строки (как «Введите номер заказа, дату или слово» в журнале)
  const preview = useMemo(() => {
    const parts = [];
    if (query) parts.push(query);
    if (filters.currency) parts.push(`валюта:${filters.currency}`);
    if (filters.status) parts.push(`статус:${filters.status}`);
    if (filters.tags?.length) parts.push(`теги:${filters.tags.join(", ")}`);
    if (filters.source) parts.push(`источник:${filters.source}`);
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
    const empty = { currency:"", status:"", tags:[], source:"", country:"", share:"", dateFrom:"", dateTo:"" };
    setFilters(empty);
    setQuery("");
    onFilterChange?.(empty);
    onSearch?.("");
  };

  const hasActive =
    !!(query || filters.currency || filters.status || filters.tags.length ||
       filters.source || filters.country || filters.share ||
       filters.dateFrom || filters.dateTo);

  return (
    <header className={styles.clientsHeaderContainer}>
      <h1 className={styles.journalTitle}>
        <PageHeaderIcon pageName="Клиенты" />
        КЛИЕНТЫ
      </h1>
      <span className={styles.headerDivider} aria-hidden="true" />

      {/* Поиск — как в журнале: инпут показывает превью и открывает фильтры */}
      <div className={styles.searchContainer} role="search">
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
                <option value="">Все валюты</option>
                {currencyOptions.map(cur => <option key={cur} value={cur}>{cur}</option>)}
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
                <option value="">Все статусы</option>
                {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
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
                <option value="">Все источники</option>
                {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
              <label>Страна</label>
              <select value={filters.country} onChange={handleChange("country")}>
                <option value="">Все страны</option>
                {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
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
                <option value="">Любое</option>
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

      <span className={styles.headerDivider} aria-hidden="true" />
      <button type="button" className={styles.addEntryButton} onClick={onAdd}>
        ➕ Добавить клиента
      </button>
    </header>
  );
}
