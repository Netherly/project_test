import React from "react";

const ThreeStateToggle = ({ value, onChange, disabled }) => {

    
    const getNextValue = () => {
        if (value === 'allowed') return 'responsible';
        if (value === 'responsible') return 'forbidden';
        return 'allowed'; 
    };

    const handleClick = () => {
        if (!disabled) {
            onChange(getNextValue());
        }
    };

    
    const getDotProps = () => {
        switch (value) {
            case 'allowed':
                return {
                    className: 'permission-dot-green',
                    title: 'Разрешено'
                };
            case 'responsible':
                return {
                    className: 'permission-dot-orange',
                    title: 'Если ответственный'
                };
            case 'forbidden':
            default:
                return {
                    className: 'permission-dot-red',
                    title: 'Запрещено'
                };
        }
    };

    const dotProps = getDotProps();

    return (
        <div
            className={`permission-dot ${dotProps.className} ${disabled ? 'disabled' : ''}`}
            title={dotProps.title}
            onClick={handleClick}
        />
    );
};

export default ThreeStateToggle;