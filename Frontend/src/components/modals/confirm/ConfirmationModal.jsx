import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  title, 
  message, 
  confirmText = 'Подтвердить', 
  cancelText = 'Отмена', 
  onConfirm, 
  onCancel 
}) => {
  return (
    <div className="confirmation-modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <h3 className="confirmation-modal-title">{title}</h3>
          <button className="confirmation-modal-close" onClick={onCancel}>
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