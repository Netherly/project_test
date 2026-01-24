// src/components/Client/ImagePreviewModal.jsx
import React from 'react';

export default function ImagePreviewModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <img src={src} alt="Preview" />
      </div>
    </div>
  );
}
