import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import './CreatableSelect.css';

export default function CreatableSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Выберите или введите...", 
  disabled = false, 
  error = false, 
  onAdd 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) {
          if (search.trim() === "") {
            onChange("");
          } else {
            const exactMatch = options.find(o => o.toLowerCase() === search.trim().toLowerCase());
            if (exactMatch) {
              onChange(exactMatch);
            }
          }
          setIsOpen(false);
          setSearch("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, search, options, onChange]);

 
  const showAll = search === (value || "");
  const filteredOptions = showAll 
    ? options 
    : options.filter(o => o && o.toLowerCase().includes(search.toLowerCase()));
  
  const isExactMatch = options.some(o => o && o.toLowerCase() === search.trim().toLowerCase());
  const showAdd = search.trim() && !isExactMatch;

  return (
    <div className="creatable-select-container" ref={containerRef}>
      <div className="creatable-input-wrapper" onClick={() => !disabled && setIsOpen(true)}>
        <input
          type="text"
          className={`creatable-input ${error ? "input-error" : ""}`}
          placeholder={placeholder}
          value={isOpen ? search : (value || "")}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(value || "");
          }}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {isOpen && (
        <div className="creatable-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div 
                key={opt} 
                className={`creatable-option ${value === opt ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {opt}
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
                setSearch("");
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