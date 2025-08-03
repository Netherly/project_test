// TextareaWithCounter.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TextareaWithCounter.css';

/**
 * Многострочное текстовое поле с ограничением и счётчиком символов.
 */
const TextareaWithCounter = ({
  value,
  onChange,
  maxLength,
  placeholder = '',
  label = '',
  className = '',
  warningThreshold = 0.8,
  criticalThreshold = 0.9,
  onMaxReached,
}) => {
  const [count, setCount] = useState(value.length);
  const warningLimit = Math.floor(maxLength * warningThreshold);
  const criticalLimit = Math.floor(maxLength * criticalThreshold);

  // Обновляем счётчик и при достижении maxLength вызываем callback
  useEffect(() => {
    setCount(value.length);
    if (value.length === maxLength && typeof onMaxReached === 'function') {
      onMaxReached();
    }
  }, [value, maxLength, onMaxReached]);

  const handleChange = (e) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      onChange(text);
    }
  };

  let counterClass = 'counter';
  if (count >= criticalLimit) counterClass += ' critical';
  else if (count >= warningLimit) counterClass += ' warning';

  return (
    <div className={`textarea-with-counter ${className}`}>
      {label && <label className="label">{label}</label>}
      <textarea
        className="textarea-input"
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        placeholder={placeholder}
      />
      <div className={counterClass}>
        {count} / {maxLength}
      </div>
    </div>
  );
};

TextareaWithCounter.propTypes = {
  value:             PropTypes.string.isRequired,
  onChange:          PropTypes.func.isRequired,
  maxLength:         PropTypes.number.isRequired,
  placeholder:       PropTypes.string,
  label:             PropTypes.string,
  className:         PropTypes.string,
  warningThreshold:  PropTypes.number,
  criticalThreshold: PropTypes.number,
  onMaxReached:      PropTypes.func,
};

export default TextareaWithCounter;
