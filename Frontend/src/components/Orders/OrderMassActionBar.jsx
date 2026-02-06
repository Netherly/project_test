import React, { useState } from "react";

const OrderMassActionBar = ({ selectedCount, onClose, stages, onMassUpdate }) => {
    const [selectedStage, setSelectedStage] = useState("");

    const handleApplyChanges = () => {
        if (!selectedStage) {
            alert("Выберите этап для перемещения");
            return;
        }
        onMassUpdate('stage', selectedStage);
        setSelectedStage("");
    };

    return (
        
        <div className="journal-mass-action-bar">
            <span className="journal-selected-count">Выбрано: {selectedCount}</span>

            <div className="journal-mass-action-controls">
                <select 
                    value={selectedStage} 
                    onChange={(e) => setSelectedStage(e.target.value)}
                    style={{ minWidth: '200px' }}
                >
                    <option value="" disabled hidden>Не выбрано</option>
                    {stages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
                </select>

                <div className="journal-divider"></div>

                <button className="journal-mass-edit-button" onClick={handleApplyChanges}>
                    Применить
                </button>

                <span className="journal-close-icon" onClick={onClose}>✕</span>
            </div>
        </div>
    );
};

export default OrderMassActionBar;