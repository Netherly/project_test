import React from 'react';
import './LogEntryDetails.css';

const LogEntryDetails = ({ entry, onClose }) => {
    if (!entry) {
        return null; 
    }

    return (
        <div className="log-entry-details-overlay">
            <div className="log-entry-details-modal">
                <div className="log-entry-details-header">
                    <h2>Информация о записи</h2>
                    <div className="log-entry-details-actions">
                        <span className="icon" onClick={() => console.log("Delete")}>🗑️</span>
                        <span className="icon" onClick={() => console.log("Edit")}>✏️</span>
                        <span className="icon" onClick={() => console.log("Previous")}>◀️</span>
                        <span className="icon" onClick={() => console.log("Next")}>▶️</span>
                        <span className="icon" onClick={onClose}>✖️</span>
                        <span className="icon" onClick={() => console.log("Expand")}>🗖</span>
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

export default LogEntryDetails;