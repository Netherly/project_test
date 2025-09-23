import React, { useState, useRef, useEffect } from "react";

const ColumnVisibilityToggle = ({
    stages,
    visibleStages,
    onToggleStage
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    console.log('ColumnVisibilityToggle props:', { stages, visibleStages });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle clicked, current isOpen:', isOpen);
        setIsOpen(!isOpen);
    };

    const handleStageToggle = (stage) => {
        console.log('Stage toggle:', stage);
        onToggleStage(stage);
    };

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
        console.warn('ColumnVisibilityToggle: stages is empty or not an array', stages);
        return null;
    }

    if (!visibleStages || !Array.isArray(visibleStages)) {
        console.warn('ColumnVisibilityToggle: visibleStages is empty or not an array', visibleStages);
        return null;
    }

    return (
        <div className="orders-column-visibility-container">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="orders-column-visibility-btn"
                title="Фильтр заказов по стадиям"
                type="button"
            >
                <span className="orders-column-visibility-icon">🔍</span>
                Фильтр
                <span className={`orders-dropdown-arrow ${isOpen ? 'orders-dropdown-open' : ''}`}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="orders-column-visibility-dropdown"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="orders-dropdown-header">
                        <span className="orders-dropdown-title">
                            Показать заказы по стадиям
                        </span>
                    </div>

                    <div className="orders-dropdown-content">
                        {stages.map((stage) => {
                            const isChecked = visibleStages.includes(stage);

                            return (
                                <div
                                    key={stage}
                                    className="orders-stage-toggle-item"
                                    onClick={() => handleStageToggle(stage)}
                                >
                                    <div className="orders-checkbox-container">
                                        <input
                                            type="checkbox"
                                            className="orders-stage-checkbox"
                                            checked={isChecked}
                                            onChange={() => handleStageToggle(stage)}
                                            id={`orders-stage-${stage}`}
                                        />
                                        <div className="orders-custom-checkbox">
                                            {isChecked && '✓'}
                                        </div>
                                    </div>
                                    <label
                                        htmlFor={`orders-stage-${stage}`}
                                        className="orders-stage-label"
                                    >
                                        {stage}
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    <div className="orders-dropdown-footer">
                        <button
                            type="button"
                            className="orders-toggle-all-btn"
                            onClick={() => {
                                const allVisible = stages.every(stage => visibleStages.includes(stage));
                                stages.forEach(stage => {
                                    if (allVisible && visibleStages.includes(stage)) {
                                        onToggleStage(stage);
                                    } else if (!allVisible && !visibleStages.includes(stage)) {
                                        onToggleStage(stage);
                                    }
                                });
                            }}
                        >
                            {stages.every(stage => visibleStages.includes(stage))
                                ? 'Скрыть все заказы'
                                : 'Показать все заказы'
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColumnVisibilityToggle;