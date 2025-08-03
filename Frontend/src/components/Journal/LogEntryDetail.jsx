import React, { useState } from 'react';
import '../../styles/LogEntryDetails.css';


const LogEntryDetail = ({ entry, onClose, onDelete, onDuplicate }) => {
    
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    if (!entry) {
        return null;
    }

    const handleMenuToggle = () => {
        setShowOptionsMenu(prev => !prev);
    };

    const handleDeleteClick = () => {
        if (window.confirm(`Вы уверены, что хотите удалить запись "${entry.description}"?`)) {
            onDelete(entry.id);
            onClose(); 
        }
        setShowOptionsMenu(false); 
    };

    const handleDuplicateClick = () => {
        onDuplicate(entry);
        onClose(); 
        setShowOptionsMenu(false); 
    };

    return (
        <div className="log-entry-details-overlay">
            <div className="log-entry-details-modal">
                <div className="log-entry-details-header">
                    <h2>Информация о записи</h2>
                    <div className="log-entry-details-actions">
                        
                        <button className="options-button" onClick={handleMenuToggle}>
                            &#x22EF; 
                        </button>
                        
                        {showOptionsMenu && (
                            <div className="options-menu">
                                <button className="menu-item" onClick={handleDuplicateClick}>Дублировать запись</button>
                                <button className="menu-item delete-item" onClick={handleDeleteClick}>Удалить запись</button>
                            </div>
                        )}
                        
                        <button className="modal-close-button" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div className="log-entry-details-content">
                    <h3>📄 Подробности</h3>
                    <p className="details-description">"{entry.description}"</p>
                    <p>
                        <span>🧑‍💻 {entry.executorRole}</span>
                        <span>✉️ {entry.email}</span>
                    </p>
                    <p>
                        <span>🗓️ {entry.workDate}</span>
                        <span>⏰ {entry.startTime} - {entry.endTime}</span>
                        <span>🕒 {entry.hours}</span>
                    </p>
                    <p>{entry.workDone}</p>

                    <h3>📝 Редактировать запись</h3>
                    <p>
                        <span>№ заказа</span>
                        <span>{entry.orderNumber}</span>
                    </p>
                    <p>
                        <span>Исполнитель роль</span>
                        <span>{entry.executorRole}</span>
                    </p>
                    <p>
                        <span>Дата работы</span>
                        <span>{entry.workDate}</span>
                    </p>
                    <p>
                        <span>Время начала</span>
                        <span>{entry.startTime}</span>
                    </p>
                    <p>
                        <span>Время окончания</span>
                        <span>{entry.endTime}</span>
                    </p>
                    <p>
                        <span>Что было сделано?</span>
                        <span>{entry.workDone}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LogEntryDetail;