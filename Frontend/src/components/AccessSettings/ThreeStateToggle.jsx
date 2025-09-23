import React from "react";

const ThreeStateToggle = ({ value, onChange, disabled = false }) => {
    const getStateInfo = (state) => {
        switch (state) {
            case 'allowed':
                return {
                    icon: '✅',
                    text: 'Разрешено',
                    className: 'access-modal-allowed'
                };
            case 'responsible':
                return {
                    icon: '⚠️',
                    text: 'Если ответственный',
                    className: 'access-modal-responsible'
                };
            case 'forbidden':
            default:
                return {
                    icon: '❌',
                    text: 'Запрещено',
                    className: 'access-modal-forbidden'
                };
        }
    };

    const cycleState = () => {
        if (disabled) return;

        const states = ['forbidden', 'responsible', 'allowed'];
        const currentIndex = states.indexOf(value);
        const nextIndex = (currentIndex + 1) % states.length;
        onChange(states[nextIndex]);
    };

    const stateInfo = getStateInfo(value);
    const tooltipText = disabled
        ? 'Настройка заблокирована для данной роли'
        : stateInfo.text;

    return (
        <div
            className={`access-modal-three-state-toggle ${stateInfo.className} ${disabled ? 'access-modal-disabled' : ''}`}
            onClick={cycleState}
            title={tooltipText}
        >
            <span className="access-modal-toggle-icon">{stateInfo.icon}</span>
        </div>
    );
};

export default ThreeStateToggle;