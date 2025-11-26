import React, { useRef, useLayoutEffect } from 'react';
import './AutoResizeTextarea.css'; 

const AutoResizeTextarea = React.forwardRef(({ 
  value, 
  onChange, 
  className = '', 
  placeholder = '', 
  ...props 
}, ref) => {
  
  const innerRef = useRef(null);


  const adjustHeight = () => {
    const textarea = innerRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };


  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={`auto-resize-textarea ${className}`}
      value={value || ''}
      placeholder={placeholder}
      rows={1} 
      onChange={(e) => {
        adjustHeight();
        onChange(e);
      }}
      onInput={(e) => adjustHeight()} 
    />
  );
});

export default AutoResizeTextarea;