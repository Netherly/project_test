import React, { useState, useEffect, useRef } from "react";
import "./AccessModal.css";
import ThreeStateToggle from "./ThreeStateToggle.jsx";
import {
    modules,
    actions,
    defaultRoles,
    createNewRole,
    isRoleProtected,
    canDeleteRole
} from "./RolesConfig.jsx";

const AccessModal = ({
    isOpen,
    onClose,
    selectedEmployee,
    isGeneralMode,
    availableRoles = [],
    onEmployeeRoleChange
}) => {

    const loadSavedRoles = () => {
        try {
            const saved = localStorage.getItem('access-roles');
            if (saved) {
                const parsedRoles = JSON.parse(saved);
                if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                    return parsedRoles;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки сохраненных ролей:', error);
        }
        return defaultRoles;
    };

    const [roles, setRoles] = useState(loadSavedRoles);
    const [originalRoles, setOriginalRoles] = useState(loadSavedRoles);
    const [activeRoleId, setActiveRoleId] = useState('owner');
    const [showDeleteMode, setShowDeleteMode] = useState(false);
    const [rolesToDelete, setRolesToDelete] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [showAddRoleInput, setShowAddRoleInput] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Состояния для режима назначения роли
    const [selectedRoleForEmployee, setSelectedRoleForEmployee] = useState(null);

    const contentRef = useRef(null);

    const rolesAreEqual = (roles1, roles2) => {
        if (roles1.length !== roles2.length) return false;

        return roles1.every(role1 => {
            const role2 = roles2.find(r => r.id === role1.id);
            if (!role2) return false;

            if (role1.name !== role2.name) return false;

            const permissions1 = role1.permissions || {};
            const permissions2 = role2.permissions || {};

            for (const moduleKey of Object.keys(permissions1)) {
                const modulePerms1 = permissions1[moduleKey] || {};
                const modulePerms2 = permissions2[moduleKey] || {};

                for (const actionKey of Object.keys(modulePerms1)) {
                    if (modulePerms1[actionKey] !== modulePerms2[actionKey]) {
                        return false;
                    }
                }
            }

            return true;
        });
    };

    // Отслеживание изменений
    useEffect(() => {
        if (isGeneralMode) {
            const hasChanged = !rolesAreEqual(roles, originalRoles);
            setHasChanges(hasChanged);
        } else {
            setHasChanges(selectedRoleForEmployee !== null &&
                selectedRoleForEmployee !== selectedEmployee?.roleId);
        }
    }, [roles, originalRoles, selectedRoleForEmployee, selectedEmployee?.roleId, isGeneralMode]);

    useEffect(() => {
        if (isOpen) {
            const currentRoles = loadSavedRoles();
            setRoles(currentRoles);
            setOriginalRoles(JSON.parse(JSON.stringify(currentRoles)));
            setHasChanges(false);
            setShowDeleteMode(false);
            setRolesToDelete([]);
            setShowAddRoleInput(false);

            if (!isGeneralMode && selectedEmployee) {
                setSelectedRoleForEmployee(selectedEmployee.roleId);
                setActiveRoleId(selectedEmployee.roleId);
            } else {
                setSelectedRoleForEmployee(null);
                setActiveRoleId('owner');
            }
        }
    }, [isOpen, isGeneralMode, selectedEmployee]);

    const handleAddRole = () => {
        if (showAddRoleInput && newRoleName.trim()) {
            const newRole = createNewRole(newRoleName);
            setRoles(prev => [...prev, newRole]);
            setActiveRoleId(newRole.id);
            setNewRoleName('');
            setShowAddRoleInput(false);
        } else {
            setShowAddRoleInput(true);
        }
    };

    const handleDeleteRoles = () => {
        setRoles(prev => prev.filter(role => !rolesToDelete.includes(role.id)));
        if (rolesToDelete.includes(activeRoleId)) {
            setActiveRoleId('owner');
        }
        setRolesToDelete([]);
        setShowDeleteMode(false);
    };

    const toggleDeleteMode = () => {
        setShowDeleteMode(!showDeleteMode);
        setRolesToDelete([]);
    };

    const toggleRoleForDeletion = (roleId) => {
        setRolesToDelete(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handlePermissionChange = (moduleKey, actionKey, newValue) => {
        const activeRole = roles.find(role => role.id === activeRoleId);

        if (isRoleProtected(activeRole)) {
            return;
        }

        setRoles(prev => prev.map(role =>
            role.id === activeRoleId
                ? {
                    ...role,
                    permissions: {
                        ...role.permissions,
                        [moduleKey]: {
                            ...role.permissions[moduleKey],
                            [actionKey]: newValue
                        }
                    }
                }
                : role
        ));
    };

    // функция для массового изменения столбца
    const handleBulkColumnChange = (actionKey) => {
        const activeRole = roles.find(role => role.id === activeRoleId);

        if (isRoleProtected(activeRole)) {
            return;
        }

        const currentValues = modules.map(module =>
            activeRole?.permissions[module.key]?.[actionKey] || 'forbidden'
        );

        let nextValue;
        if (currentValues.every(val => val === 'allowed')) {
            nextValue = 'responsible';
        } else if (currentValues.every(val => val === 'responsible')) {
            nextValue = 'forbidden';
        } else {
            nextValue = 'allowed';
        }

        setRoles(prev => prev.map(role =>
            role.id === activeRoleId
                ? {
                    ...role,
                    permissions: {
                        ...role.permissions,
                        ...modules.reduce((acc, module) => ({
                            ...acc,
                            [module.key]: {
                                ...role.permissions[module.key],
                                [actionKey]: nextValue
                            }
                        }), {})
                    }
                }
                : role
        ));
    };

    // Функция для получения иконки состояния столбца
    const getColumnStateIcon = (actionKey) => {
        const activeRole = roles.find(role => role.id === activeRoleId);

        if (!activeRole) return '';

        const values = modules.map(module =>
            activeRole?.permissions[module.key]?.[actionKey] || 'forbidden'
        );

        if (values.every(val => val === 'allowed')) return '✅';
        if (values.every(val => val === 'responsible')) return '⚠️';
        if (values.every(val => val === 'forbidden')) return '❌';
        return '';
    };

    const handleRoleClick = (roleId, event) => {
        if (isGeneralMode) {
            if (!showDeleteMode && event.target.type !== 'checkbox') {
                setActiveRoleId(roleId);
            }
        } else {
            // В режиме назначения роли сотруднику
            setSelectedRoleForEmployee(roleId);
            setActiveRoleId(roleId);
        }
    };

    const handleSave = () => {
        try {
            if (isGeneralMode) {
                // Сохранение настроек ролей
                localStorage.setItem('access-roles', JSON.stringify(roles));
                setOriginalRoles(JSON.parse(JSON.stringify(roles)));
                setHasChanges(false);
                console.log('Настройки ролей сохранены:', roles);
            } else {
                // Назначение роли сотруднику
                if (selectedRoleForEmployee && selectedEmployee && onEmployeeRoleChange) {
                    onEmployeeRoleChange(selectedEmployee.id, selectedRoleForEmployee);
                    console.log(`Роль ${selectedRoleForEmployee} назначена сотруднику ${selectedEmployee.name}`);
                }
            }

            onClose();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении!');
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirmCancel = window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите отменить изменения?');
            if (!confirmCancel) {
                return;
            }
        }

        if (isGeneralMode) {
            setRoles(JSON.parse(JSON.stringify(originalRoles)));
            setShowDeleteMode(false);
            setRolesToDelete([]);
            setShowAddRoleInput(false);
        } else {
            setSelectedRoleForEmployee(selectedEmployee?.roleId);
        }

        setHasChanges(false);
        onClose();
    };

    const handleClose = () => {
        if (hasChanges) {
            const confirmClose = window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?');
            if (!confirmClose) {
                return;
            }
        }

        if (isGeneralMode) {
            setRoles(JSON.parse(JSON.stringify(originalRoles)));
            setShowDeleteMode(false);
            setRolesToDelete([]);
            setShowAddRoleInput(false);
        }

        setHasChanges(false);
        onClose();
    };

    // Получаем роли для отображения
    const rolesToDisplay = isGeneralMode ? roles : (availableRoles.length > 0 ? availableRoles : roles);
    const activeRole = rolesToDisplay.find(role => role.id === activeRoleId);
    const isActiveRoleProtected = isRoleProtected(activeRole);

    // Проверка, защищен ли сотрудник от изменения роли
    const isEmployeeProtected = !isGeneralMode && selectedEmployee?.isProtected;

    if (!isOpen) return null;

    return (
        <>
            <div className="access-modal-overlay" onClick={handleClose}></div>
            <div className="access-modal">
                <div className="access-modal-header">
                    <div className="access-modal-header-content">
                        <h2>
                            {isGeneralMode ? 'Настройка доступов' : `Назначение роли - ${selectedEmployee?.name}`}
                            {hasChanges && <span className="access-modal-changes-indicator"> *</span>}
                        </h2>
                        {selectedEmployee && !isGeneralMode && (
                            <div className="access-modal-employee-info">
                                <p>
                                    Текущая роль: <strong>{selectedEmployee.roleName}</strong>
                                </p>
                                {isEmployeeProtected && (
                                    <p className="protected-user-warning">
                                        🛡️ <em>Этот пользователь защищен от изменения роли</em>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="access-modal-header-actions">
                        <button className="access-modal-close-button" onClick={handleClose}>×</button>
                        {hasChanges && !isEmployeeProtected && (
                            <div className="access-modal-action-buttons">
                                <button className="access-modal-save-button" onClick={handleSave}>
                                    {isGeneralMode ? 'Сохранить' : 'Назначить роль'}
                                </button>
                                <button className="access-modal-cancel-button" onClick={handleCancel}>
                                    Отмена
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="access-modal-content" ref={contentRef}>
                    <div className="access-modal-roles-section">
                        <div className="access-modal-roles-header">
                            <span className="access-modal-roles-label">
                                {isGeneralMode ? 'Роли' : isEmployeeProtected ? 'Роль пользователя' : 'Выберите роль'}
                            </span>
                            {isGeneralMode && (
                                <div className="access-modal-roles-actions">
                                    <button
                                        className="access-modal-add-role-btn"
                                        onClick={handleAddRole}
                                        title="Добавить роль"
                                    >
                                        +
                                    </button>
                                    <button
                                        className={`access-modal-delete-mode-btn ${showDeleteMode ? 'active' : ''}`}
                                        onClick={toggleDeleteMode}
                                        title="Удалить роли"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="access-modal-roles-container">
                            {rolesToDisplay.map(role => (
                                <div
                                    key={role.id}
                                    className={`access-modal-role-item ${activeRoleId === role.id ? 'active' : ''} 
                                        ${showDeleteMode && rolesToDelete.includes(role.id) ? 'selected-for-delete' : ''} 
                                        ${!isGeneralMode && selectedRoleForEmployee === role.id ? 'selected-for-assignment' : ''}
                                        ${isEmployeeProtected ? 'disabled' : ''}`}
                                    onClick={(e) => !isEmployeeProtected && handleRoleClick(role.id, e)}
                                >
                                    {isGeneralMode && showDeleteMode && canDeleteRole(role) && (
                                        <input
                                            type="checkbox"
                                            className="access-modal-role-checkbox"
                                            checked={rolesToDelete.includes(role.id)}
                                            onChange={() => toggleRoleForDeletion(role.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                    <span className="access-modal-role-name">
                                        {role.name}
                                    </span>
                                    {role.isBase && (
                                        <span
                                            className="access-modal-base-badge"
                                            onClick={(e) => e.stopPropagation()}
                                            title={role.isProtected ? "Системная роль (защищена)" : "Системная роль"}
                                        >
                                            {role.isProtected ? '🔒' : '👑'}
                                        </span>
                                    )}
                                    {!isGeneralMode && selectedRoleForEmployee === role.id && !isEmployeeProtected && (
                                        <span className="access-modal-selected-badge">✓</span>
                                    )}
                                </div>
                            ))}

                            {isGeneralMode && showAddRoleInput && (
                                <div className="access-modal-add-role-input">
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="Название роли"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
                                        autoFocus
                                    />
                                    <button onClick={handleAddRole}>✓</button>
                                    <button onClick={() => { setShowAddRoleInput(false); setNewRoleName(''); }}>✕</button>
                                </div>
                            )}
                        </div>

                        {isGeneralMode && showDeleteMode && rolesToDelete.length > 0 && (
                            <div className="access-modal-delete-actions">
                                <button className="access-modal-confirm-delete-btn" onClick={handleDeleteRoles}>
                                    Удалить выбранные ({rolesToDelete.length})
                                </button>
                                <button className="access-modal-cancel-delete-btn" onClick={toggleDeleteMode}>
                                    Отмена
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="access-modal-permissions-section">
                        <h3 className="access-modal-permissions-title">
                            {isGeneralMode ? 'Настройки роли:' : 'Права доступа роли:'} <span>{activeRole?.name}</span>
                            {isActiveRoleProtected && (
                                <span style={{ color: '#dc3545', marginLeft: '10px', fontSize: '14px' }}>
                                    🔒 {isGeneralMode ? '(защищенная роль)' : '(системная роль)'}
                                </span>
                            )}
                            {isEmployeeProtected && (
                                <span style={{ color: '#dc3545', marginLeft: '10px', fontSize: '14px' }}>
                                    🛡️ (защищенный пользователь)
                                </span>
                            )}
                        </h3>

                        <div className="access-modal-permissions-table">
                            <div className="access-modal-table-header">
                                <div className="access-modal-module-column">Доступы</div>
                                {actions.map(action => (
                                    <div
                                        key={action.key}
                                        className={`access-modal-action-column ${(isGeneralMode && !isActiveRoleProtected) ? 'clickable' : ''}`}
                                        onClick={() => isGeneralMode && !isActiveRoleProtected && handleBulkColumnChange(action.key)}
                                        title={isGeneralMode && !isActiveRoleProtected ? `Клик для массового изменения столбца "${action.name}"` : ''}
                                    >
                                        <div className="access-modal-action-header-content">
                                            <span className="access-modal-action-name">{action.name}</span>
                                            <span className="access-modal-column-state-icon">
                                                {isGeneralMode && !isActiveRoleProtected ? getColumnStateIcon(action.key) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div className="access-modal-description-column">ОПИСАНИЕ</div>
                            </div>

                            {modules.map(module => (
                                <div key={module.key} className="access-modal-table-row">
                                    <div className="access-modal-module-name">{module.name}</div>
                                    {actions.map(action => (
                                        <div key={action.key} className="access-modal-action-cell">
                                            <ThreeStateToggle
                                                value={activeRole?.permissions[module.key]?.[action.key] || 'forbidden'}
                                                onChange={(newValue) => handlePermissionChange(module.key, action.key, newValue)}
                                                disabled={!isGeneralMode || isActiveRoleProtected}
                                            />
                                        </div>
                                    ))}
                                    <div className="access-modal-description-cell">
                                        <div className="description-line">
                                            <span>✅</span>
                                            <span>Разрешено</span>
                                        </div>
                                        <div className="description-line">
                                            <span>⚠️</span>
                                            <span>Если ответственный</span>
                                        </div>
                                        <div className="description-line">
                                            <span>❌</span>
                                            <span>Запрещено</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AccessModal;