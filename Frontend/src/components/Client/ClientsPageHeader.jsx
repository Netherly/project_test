import React, { useState, useEffect, useRef } from 'react';
import { FaThLarge, FaSearch, FaFilter, FaEllipsisH } from 'react-icons/fa';
import './ClientsPageHeader.css';

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
  const [showSearch,  setShowSearch]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query,       setQuery]       = useState('');
  const [filters, setFilters] = useState({
    currency: '', status: '', tags: [], source: '', country: '',
    share: '', dateFrom: '', dateTo: ''
  });

  const inputRef = useRef(null);

  // фокус при открытии поиска
  useEffect(() => {
    if (showSearch) inputRef.current?.focus();
  }, [showSearch]);

  // поднимаем введённый запрос вверх
  useEffect(() => {
    onSearch?.(query);
  }, [query, onSearch]);

  const handleChange = field => e => {
    const value = field === 'tags'
      ? Array.from(e.target.selectedOptions).map(o => o.value)
      : e.target.value;
    setFilters(f => ({ ...f, [field]: value }));
  };

  const handleApply = () => onFilterChange?.(filters);
  const handleReset = () => {
    const empty = {
      currency:'', status:'', tags:[], source:'', country:'',
      share:'', dateFrom:'', dateTo:''
    };
    setFilters(empty);
    onFilterChange?.(empty);
  };

  const hasActive = Boolean(
    filters.currency || filters.status || filters.tags.length ||
    filters.source   || filters.country || filters.share   ||
    filters.dateFrom || filters.dateTo
  );

  return (
    <header className="clients-toolbar">
      {/* Левая группа */}
      <div className="clients-toolbar-left">
        <div className="toolbar-title">КЛИЕНТЫ</div>
        <div className="view-toggle-icons">
          {/* <FaThLarge className="icon view-icon" title="Вид плитки" /> */}
          <FaSearch
            className="icon view-icon"
            title="Поиск"
            onClick={() => setShowSearch(v => !v)}
          />
          <div className="filter-icon-wrapper">
            <FaFilter
              className="icon view-icon"
              title="Фильтры"
              onClick={() => setShowFilters(v => !v)}
            />
            {hasActive && <span className="filter-indicator" />}
          </div>
        </div>
      </div>

      {/* Центр: встроенный поиск */}
      {showSearch && (
        <div className="toolbar-search-inline">
          <FaSearch className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Поиск по всем полям…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* Правая группа */}
      <div className="clients-toolbar-right">
        <span className="total-text">
          Итого клиентов: <b>{total}</b>
        </span>
        {/* <FaEllipsisH className="more-btn" title="Дополнительно" />
        <button className="configure-btn" onClick={() => {}}>
          Настроить
        </button> */}
        <button className="add-client-btn" onClick={onAdd}>
          + Добавить клиента
        </button>
      </div>

      {/* Плавающая панель фильтров */}
      {showFilters && (
        <div className="toolbar-filters">
          <div className="filters-title">Фильтры</div>

          <select value={filters.currency} onChange={handleChange('currency')}>
            <option value="">Все валюты</option>
            {currencyOptions.map(cur => <option key={cur} value={cur}>{cur}</option>)}
          </select>

          <select value={filters.status} onChange={handleChange('status')}>
            <option value="">Все статусы</option>
            {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
          </select>

          <select multiple value={filters.tags} onChange={handleChange('tags')}>
            {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={filters.source} onChange={handleChange('source')}>
            <option value="">Все источники</option>
            {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filters.country} onChange={handleChange('country')}>
            <option value="">Все страны</option>
            {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="switch-row">
            <label>Есть доля?</label>
            <select value={filters.share} onChange={handleChange('share')}>
              <option value="">Любое</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>

          <div className="date-filter-inline">
            <label>Дата последнего заказа:</label>
            <span>с</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={handleChange('dateFrom')}
            />
            <span>по</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={handleChange('dateTo')}
            />
          </div>

          <div className="filter-buttons">
            <button onClick={handleReset}>Сбросить</button>
            <button onClick={handleApply}>Применить</button>
          </div>
        </div>
      )}
    </header>
  );
}
