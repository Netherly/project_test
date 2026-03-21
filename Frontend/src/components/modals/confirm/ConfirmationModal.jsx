import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  title, 
  message, 
  confirmText = 'Подтвердить', 
  secondaryText = '',
  cancelText = 'Отмена', 
  onConfirm, 
  onSecondary,
  onCancel,
  onDismiss,
}) => {
  const handleDismiss = onDismiss || onCancel;

  return (
    <div className="confirmation-modal-overlay" onClick={handleDismiss}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <h3 className="confirmation-modal-title">{title}</h3>
          <button className="confirmation-modal-close" onClick={handleDismiss}>
            ×
          </button>
        </div>
        
        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">{message}</p>
        </div>
        
        <div className="confirmation-modal-footer">
          <button 
            className="confirmation-modal-btn confirmation-modal-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          {secondaryText ? (
            <button
              className="confirmation-modal-btn confirmation-modal-cancel"
              onClick={onSecondary}
            >
              {secondaryText}
            </button>
          ) : null}
          <button 
            className="confirmation-modal-btn confirmation-modal-confirm" 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
