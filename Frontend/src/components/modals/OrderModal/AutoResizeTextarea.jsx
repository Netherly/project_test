// src/components/modals/OrderModal/AutoResizeTextarea.jsx
import React, { useEffect, useRef } from "react";

/**
 * Авто-ресайз textarea под контент.
 * - Поддерживает forwardRef (и function ref, и object ref)
 * - Корректно работает при внешнем изменении value
 * - Не требует отдельного CSS, но className/стили можно передать
 */
const AutoResizeTextarea = React.forwardRef(function AutoResizeTextarea(
  { value, onChange, onInput, className = "", style, rows = 1, ...rest },
  ref
) {
  const localRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const resize = (node) => {
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  };

  useEffect(() => {
    resize(localRef.current);
  }, [value]);

  const handleChange = (event) => {
    // сначала даём родителю обновить value (если он контролирует)
    onChange?.(event);
    // если кто-то использует onInput отдельно — поддержим
    if (onInput && onInput !== onChange) onInput(event);
    // и ресайз под текущий DOM
    resize(event.target);
  };

  const handleInput = (event) => {
    onInput?.(event);
    resize(event.target);
  };

  return (
    <textarea
      {...rest}
      ref={setRefs}
      value={value ?? ""}
      rows={rows}
      className={className}
      style={style}
      onChange={handleChange}
      onInput={handleInput}
    />
  );
});

export default AutoResizeTextarea;
