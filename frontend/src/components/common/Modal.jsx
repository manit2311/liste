import React from 'react';
import { FiX } from 'react-icons/fi';

export function Modal({ title, onClose, children, footer, size = "md" }) {
  const sizeClass = size === "sm" ? "confirm-modal" : size === "lg" ? "modal-lg" : "";
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizeClass}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button 
            className="icon-btn" 
            onClick={onClose} 
            style={{ border: "none", background: "none", cursor: "pointer", color: "#a87c9e", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}