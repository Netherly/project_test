import React, { useEffect, useRef } from 'react';

const AutoResizeTextarea = React.forwardRef(function AutoResizeTextarea(
  { value, onChange, onInput, className, style, ...rest },
  ref
) {
  const localRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const resize = (node) => {
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };

  useEffect(() => {
    resize(localRef.current);
  }, [value]);

  const handleChange = (event) => {
    if (onChange) onChange(event);
    if (onInput && onInput !== onChange) onInput(event);
    resize(event.target);
  };

  return (
    <textarea
      {...rest}
      ref={setRefs}
      value={value ?? ''}
      onChange={handleChange}
      className={className}
      style={style}
    />
  );
});

export default AutoResizeTextarea;
