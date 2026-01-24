import React, { useState } from "react";

const MassActionBar = ({ selectedCount, onClose, employees, availableRoles, onMassUpdate, onMassDelete }) => {
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedExecutor, setSelectedExecutor] = useState("");
    const [adminApproval, setAdminApproval] = useState("");

    const handleApplyChanges = () => {
        let changesMade = [];

        if (adminApproval) {
            onMassUpdate('adminApproved', adminApproval);
            changesMade.push('одобрение администратора');
        }

        if (selectedRole) {
            onMassUpdate('role', [selectedRole]);
            changesMade.push('роль');
        }

        if (selectedExecutor) {
            onMassUpdate('executorRole', selectedExecutor);
            changesMade.push('исполнителя');
        }

        if (changesMade.length > 0) {
            // Сбросить селекты после применения
            setAdminApproval("");
            setSelectedRole("");
            setSelectedExecutor("");
            
            alert(`Изменены поля: ${changesMade.join(', ')} для ${selectedCount} записей`);
        } else {
            alert("Выберите хотя бы одно изменение для применения");
        }
    };

    const handleDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить ${selectedCount} записей?`)) {
            onMassDelete();
            onClose();
        }
    };

    return (
        <div className="journal-mass-action-bar">
            <span className="journal-selected-count">Выбрано: {selectedCount}</span>

            <div className="journal-mass-action-controls">
                <select value={adminApproval} onChange={(e) => setAdminApproval(e.target.value)}>
                    <option value="">Одобрение администратора</option>
                    <option value="Ожидает">Ожидает</option>
                    <option value="Принято">Принято</option>
                    <option value="Время трекера">Время трекера</option>
                    <option value="Время журнала">Время журнала</option>
                    <option value="Корректировка администратором">Корректировка</option>
                </select>

                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    <option value="">Изменить роль</option>
                    {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>

                <select value={selectedExecutor} onChange={(e) => setSelectedExecutor(e.target.value)}>
                    <option value="">Изменить исполнителя</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                    ))}
                </select>

                <div className="journal-divider"></div>

                <button className="journal-mass-edit-button" onClick={handleApplyChanges}>
                    Применить изменения
                </button>
                <button className="journal-mass-delete-button" onClick={handleDelete}>
                    Удалить
                </button>

                <span className="journal-close-icon" onClick={onClose}>✕</span>
            </div>
        </div>
    );
};

export default MassActionBar;