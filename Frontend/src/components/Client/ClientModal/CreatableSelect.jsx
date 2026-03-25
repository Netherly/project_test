import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import './CreatableSelect.css';

export default function CreatableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Выберите или введите...',
  disabled = false,
  error = false,
  onAdd,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value || '');
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) {
          const safeSearchText = search.trim();
          if (safeSearchText === '') {
            onChange('');
          } else if (safeSearchText !== String(value || '').trim()) {
            const exactMatch = options.find(
              (opt) => String(opt).trim().toLowerCase() === safeSearchText.toLowerCase()
            );
            if (exactMatch) {
              onChange(exactMatch);
            }
          }
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, search, options, onChange, value]);

  const handleOpen = () => {
    if (!disabled && !isOpen) {
      setIsOpen(true);
      setSearch(value || '');
    }
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const safeSearch = String(search || '').toLowerCase().trim();
  const safeValue = String(value || '').toLowerCase().trim();

  const showAll = !safeSearch || safeSearch === safeValue;

  const filteredOptions = showAll
    ? options
    : options.filter((opt) => String(opt).toLowerCase().includes(safeSearch));

  const isExactMatch = options.some(
    (opt) => String(opt).toLowerCase().trim() === safeSearch
  );

  const showAdd = Boolean(onAdd) && safeSearch !== '' && !isExactMatch;

  return (
    <div className="creatable-select-container" ref={containerRef}>
      <div className="creatable-input-wrapper" onClick={handleOpen}>
        <input
          type="text"
          className={`creatable-input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={isOpen ? search : (value || '')}
          onChange={handleInputChange}
          onFocus={handleOpen}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="creatable-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={`${option}-${idx}`}
                className={`creatable-option ${value === option ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </div>
            ))
          ) : !showAdd ? (
            <div className="creatable-option-empty">Нет вариантов</div>
          ) : null}

          {showAdd && (
            <div
              className="creatable-add-option"
              onClick={() => {
                const newVal = search.trim();
                if (onAdd) onAdd(newVal);
                onChange(newVal);
                setIsOpen(false);
              }}
            >
              <Plus size={14} style={{ marginRight: '6px' }} /> Добавить '{search.trim()}'
            </div>
          )}
        </div>
      )}
    </div>
  );
}