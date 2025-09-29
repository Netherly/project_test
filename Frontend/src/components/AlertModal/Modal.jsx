import React, { useEffect, useRef } from "react";
import "./modal.css";

/**
 * Универсальное модальное окно
 *
 * Пример:
 * <Modal
 *   open={isOpen}
 *   title="Ошибка сохранения"
 *   type="error" // "info" | "warning" | "success" | "error"
 *   onClose={() => setOpen(false)}
 *   closeOnBackdrop
 *   actions={[
 *     { label: "Закрыть", onClick: () => setOpen(false), variant: "ghost" },
 *     { label: "Повторить", onClick: retry, variant: "primary", autoFocus: true },
 *   ]}
 * >
 *   <p>Данные не сохранились. Возможно, проблема с подключением к серверу.</p>
 * </Modal>
 */
const Modal = ({
  open = false,
  title = "",
  type = "info",
  children,
  actions = [],
  onClose,
  closeOnBackdrop = true,
}) => {
  const dialogRef = useRef(null);

  // Закрытие по Esc
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Фокус на первой кнопке/элементе
  useEffect(() => {
    if (!open) return;
    const btnToFocus =
      dialogRef.current?.querySelector("[data-autofocus]") ||
      dialogRef.current?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    btnToFocus?.focus?.();
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target.classList.contains("modal-backdrop")) {
      onClose?.();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`modal-window modal-${type}`} ref={dialogRef}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button
            className="modal-close-btn"
            aria-label="Закрыть"
            onClick={() => onClose?.()}
            title="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {(actions?.length ?? 0) > 0 && (
          <div className="modal-footer">
            {actions.map((a, i) => (
              <button
                key={i}
                className={`btn ${btnClassByVariant(a.variant)}`}
                onClick={a.onClick}
                data-autofocus={a.autoFocus ? "true" : undefined}
                disabled={a.disabled}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function btnClassByVariant(variant) {
  switch (variant) {
    case "primary":
      return "btn-primary";
    case "danger":
      return "btn-danger";
    case "ghost":
      return "btn-ghost";
    default:
      return "btn-default";
  }
}

export default Modal;
