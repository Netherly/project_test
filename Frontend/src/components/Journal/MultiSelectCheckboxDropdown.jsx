import React, { useState, useRef, useEffect } from 'react';

const MultiSelectCheckboxDropdown = ({ label, name, options, selectedValues, onChange, placeholder }) => {
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCheckboxes(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setShowCheckboxes(prev => !prev);
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        let newValues = [...selectedValues];
        
        if (checked) {
            newValues.push(value);
        } else {
            newValues = newValues.filter(v => v !== value);
        }
        
        onChange({ target: { name, value: newValues } });
    };

    const handleSelectAll = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: [...options] } });
    };

    const handleDeselectAll = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: [] } });
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: [] } });
    };

    const allSelected = options.length > 0 && selectedValues.length === options.length;
    const noneSelected = selectedValues.length === 0;

    return (
        <div className="journal-search-field-group journal-multiselect-checkbox-group" ref={dropdownRef}>
            <label>{label}</label>
            <div className="journal-multiselect-checkbox-container">
                <div
                    className="journal-custom-multiselect-input"
                    onClick={handleToggle}
                    tabIndex="0"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggle();
                        }
                    }}
                >
                    {selectedValues.length > 0 
                        ? selectedValues.join(', ') 
                        : <span className="journal-placeholder-text">{placeholder || `Выберите ${label.toLowerCase()}`}</span>
                    }
                    <span className={`journal-dropdown-arrow ${showCheckboxes ? 'open' : ''}`}>▼</span>
                </div>
                {showCheckboxes && (
                    <div className="journal-checkbox-dropdown-list-filter">
                        <label className="journal-checkbox-option-label-filter journal-select-action-label-filter">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={allSelected ? handleDeselectAll : handleSelectAll}
                            />
                            <span className="journal-select-action-text-filter">
                                {allSelected ? 'Убрать всё' : 'Выделить всё'}
                            </span>
                        </label>
                        <div className="journal-checkbox-divider-filter"></div>
                        {options.map(option => (
                            <label key={option} className="journal-checkbox-option-label-filter">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={selectedValues.includes(option)}
                                    onChange={handleCheckboxChange}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            {selectedValues.length > 0 && (
                <span className="journal-clear-input-filter" onClick={handleClear}>✖️</span>
            )}
        </div>
    );
};

export default MultiSelectCheckboxDropdown;