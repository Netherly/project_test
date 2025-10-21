
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TextareaWithCounter.css';


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
  const [count, setCount] = useState(value ? value.length : 0);
  const textareaRef = useRef(null);
  const warningLimit = Math.floor(maxLength * warningThreshold);
  const criticalLimit = Math.floor(maxLength * criticalThreshold);

  
  const handleAutoResize = (target) => {
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  
  useEffect(() => {
    const newCount = value ? value.length : 0;
    setCount(newCount);
    
    if (newCount === maxLength && typeof onMaxReached === 'function') {
      onMaxReached();
    }
    
    
    if (textareaRef.current) {
      handleAutoResize(textareaRef.current);
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
        ref={textareaRef}
        className="textarea-input" 
        value={value || ''}
        onChange={handleChange}
        onInput={(e) => handleAutoResize(e.target)} 
        maxLength={maxLength}
        placeholder={placeholder}
        rows={1} 
      />
      <div className={counterClass}>
        {count} / {maxLength}
      </div>
    </div>
  );
};

TextareaWithCounter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  warningThreshold: PropTypes.number,
  criticalThreshold: PropTypes.number,
  onMaxReached: PropTypes.func,
};


TextareaWithCounter.defaultProps = {
  value: '',
  placeholder: '',
  label: '',
  className: '',
  warningThreshold: 0.8,
  criticalThreshold: 0.9,
  onMaxReached: () => {},
};

export default TextareaWithCounter;