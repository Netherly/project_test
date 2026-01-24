import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import './TagSelector.css';

const DEFAULT_COLOR = '#cccccc';

export default function TagSelector({ options = [], tags = [], onChange }) {
  const [available, setAvailable] = useState(options);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = available
    .filter(tag => !tags.some(t => t.name === tag.name))
    .filter(tag => tag.name.toLowerCase().includes(inputValue.toLowerCase()));

  const handleSelect = tag => {
    onChange([...tags, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemove = tag => {
    onChange(tags.filter(t => t.name !== tag.name));
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        const match = available.find(
          t => t.name.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (match && !tags.some(t => t.name === match.name)) {
          handleSelect(match);
        } else {
          setNewTagName(inputValue.trim());
          setNewTagColor(DEFAULT_COLOR);
          setError('');
          setShowModal(true);
        }
      }
    }
  };

  const handleRandomColor = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0');
    setNewTagColor(randomColor);
  };

  const handleCreate = () => {
    const name = newTagName.trim();
    if (!name) {
      setError('Введите имя метки');
      return;
    }
    if (name.length > 40) {
      setError('Имя метки не должно превышать 40 символов');
      return;
    }
    if (available.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      setError('Метка с таким именем уже существует');
      return;
    }
    const tag = { name, color: newTagColor };
    setAvailable(prev => [...prev, tag]);
    onChange([...tags, tag]);
    setShowModal(false);
    setInputValue('');
    setShowSuggestions(false);
  };

  return (
    <div className="tag-selector" ref={wrapperRef}>
      <div className="selected-tags">
        {tags.map(tag => (
          <div
            key={tag.name}
            className="tag"
            style={{ backgroundColor: tag.color }}
          >
            <span className="tag-name">{tag.name}</span>
            <button
              type="button"
              className="tag-remove"
              onClick={() => handleRemove(tag)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="tag-input-wrapper" onClick={() => setShowSuggestions(true)}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск или создать тег..."
        />
      </div>

      {showSuggestions && (
        <ul className="suggestions-list">
          {filtered.map(tag => (
            <li
              key={tag.name}
              className="suggestion"
              onClick={() => handleSelect(tag)}
            >
              <span
                className="tag-dot"
                style={{ backgroundColor: tag.color }}
              />
              <span className="suggestion-name">{tag.name}</span>
            </li>
          ))}
          {inputValue.trim() &&
            !available.some(
              t => t.name.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <li
                className="suggestion create"
                onClick={() => {
                  setNewTagName(inputValue.trim());
                  setNewTagColor(DEFAULT_COLOR);
                  setError('');
                  setShowModal(true);
                }}
              >
                <span
                  className="tag-dot"
                  style={{ backgroundColor: newTagColor }}
                />
                Создать тег «{inputValue.trim()}»
              </li>
            )}
        </ul>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать тег</h3>
            {error && <p className="error">{error}</p>}
            <label>Имя</label>
            <input
              maxLength={40}
              value={newTagName}
              onChange={e => {
                setNewTagName(e.target.value);
                setError('');
              }}
            />
            <label>Цвет</label>
            <div className="color-input-group">
              <input
                type="color"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
              />
              <RefreshCw
                className="random-color-icon"
                onClick={handleRandomColor}
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleCreate}>
                Создать
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}