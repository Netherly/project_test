import React, { useState, useEffect, useRef } from "react";
import "./AccessModal.css";
import ThreeStateToggle from "./ThreeStateToggle.jsx";
import ConfirmationModal from "../modals/confirm/ConfirmationModal.jsx";
import { ModulePermissionStatus } from './AccessSettingsPage.jsx';
import { Plus, X, Lock, LockOpen, Trash2 } from 'lucide-react';
import {
    modules,
    actions,
    defaultRoles,
    createNewRole,
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
            console.error('Error loading roles:', error);
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
    const [showConfirmationModal, setShowConfirmationModal] = useState(false); 
    const [selectedRoleForEmployee, setSelectedRoleForEmployee] = useState(null);
    const contentRef = useRef(null);

    
    const permissionsAreEqual = (perms1, perms2) => {
        const keys1 = Object.keys(perms1 || {});
        const keys2 = Object.keys(perms2 || {});
        if (keys1.length !== keys2.length) return false;
        for (const moduleKey of keys1) {
            const modulePerms1 = perms1[moduleKey] || {};
            const modulePerms2 = perms2[moduleKey] || {};
            const actionKeys1 = Object.keys(modulePerms1);
            if (actionKeys1.length !== Object.keys(modulePerms2).length) return false;
            for (const actionKey of actionKeys1) {
                if (modulePerms1[actionKey] !== modulePerms2[actionKey]) return false;
            }
        }
        return true;
    };

    
    const rolesAreEqual = (roles1, roles2) => {
        if (roles1.length !== roles2.length) return false;
        return roles1.every(role1 => {
            const role2 = roles2.find(r => r.id === role1.id);
            if (!role2) return false;
            return role1.name === role2.name && role1.isProtected === role2.isProtected && permissionsAreEqual(role1.permissions, role2.permissions);
        });
    };
    
    
    useEffect(() => {
        if (!isOpen) return;
        if (isGeneralMode) {
            setHasChanges(!rolesAreEqual(roles, originalRoles));
        } else {
            if (!selectedEmployee) return;
            const originalRole = originalRoles.find(r => r.id === selectedEmployee.roleId);
            const selectedRole = roles.find(r => r.id === selectedRoleForEmployee);
            if (!selectedRole || !originalRole) {
                setHasChanges(selectedRoleForEmployee !== selectedEmployee.roleId);
                return;
            }
            if (selectedRoleForEmployee !== selectedEmployee.roleId) {
                setHasChanges(true);
            } else {
                setHasChanges(!permissionsAreEqual(selectedRole.permissions, originalRole.permissions));
            }
        }
    }, [roles, originalRoles, selectedRoleForEmployee, selectedEmployee, isGeneralMode, isOpen]);


    
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

    
    const handleToggleRoleProtection = (roleIdToToggle) => {
        if (roleIdToToggle === 'owner') return;
        setRoles(prev => prev.map(role => role.id === roleIdToToggle ? { ...role, isProtected: !role.isProtected } : role));
    };

    
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
        const remainingRoles = roles.filter(role => !rolesToDelete.includes(role.id));
        setRoles(remainingRoles);
        if (rolesToDelete.includes(activeRoleId)) setActiveRoleId('owner');
        setRolesToDelete([]);
        setShowDeleteMode(false);
    };
    const toggleDeleteMode = () => { setShowDeleteMode(!showDeleteMode); setRolesToDelete([]); };
    const toggleRoleForDeletion = (roleId) => { setRolesToDelete(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]); };

    
    const handlePermissionChange = (moduleKey, actionKey, newValue) => {
        const currentActiveRole = roles.find(role => role.id === activeRoleId);
        if (!currentActiveRole || currentActiveRole.isProtected) return;

        
        if (!isGeneralMode && !currentActiveRole.id.startsWith('custom_')) {
            const baseName = currentActiveRole.name;
            const allSavedRoles = loadSavedRoles();
            const existingCustomRoles = allSavedRoles.filter(r => r.name.startsWith(`Пользовательский`));
            const newIndex = existingCustomRoles.length + 1;
            const finalName = newIndex > 1
                ? `Пользовательский`
                : `Пользовательский`;
            
            const newCustomRoleId = `custom_${selectedEmployee.id}_${Date.now()}`;
            const customRolePreset = {
                ...JSON.parse(JSON.stringify(currentActiveRole)),
                id: newCustomRoleId,
                name: finalName,
                isProtected: false,
                isBase: false,
                employeeId: selectedEmployee.id,
            };
            customRolePreset.permissions[moduleKey][actionKey] = newValue;
            
            
            const updatedRoles = [...allSavedRoles, customRolePreset];
            localStorage.setItem('access-roles', JSON.stringify(updatedRoles));
            
            setRoles(updatedRoles);
            setActiveRoleId(newCustomRoleId);
            setSelectedRoleForEmployee(newCustomRoleId);
            return;
        }

        
        setRoles(prev => prev.map(role =>
            role.id === activeRoleId
                ? { ...role, permissions: { ...role.permissions, [moduleKey]: { ...role.permissions[moduleKey], [actionKey]: newValue } } }
                : role
        ));
    };
    
    
    const handleRoleClick = (newRoleId) => {
        if (isGeneralMode && !showDeleteMode) {
            setActiveRoleId(newRoleId);
        } else if (!isGeneralMode) {
            

            const previousRoleId = selectedRoleForEmployee; 
            const previousRole = roles.find(r => r.id === previousRoleId);

            
            if (previousRole && previousRole.id.startsWith('custom_') && !newRoleId.startsWith('custom_')) {
                
                
                const updatedRoles = roles.filter(r => r.id !== previousRoleId);
                
                
                setRoles(updatedRoles);
                
                
                localStorage.setItem('access-roles', JSON.stringify(updatedRoles));
            }
            
            
            setSelectedRoleForEmployee(newRoleId);
            setActiveRoleId(newRoleId);
        }
    };

    
    const handleSave = () => {
        try {
            if (isGeneralMode) {
                localStorage.setItem('access-roles', JSON.stringify(roles));
                setOriginalRoles(JSON.parse(JSON.stringify(roles)));
            } else {
                if (selectedEmployee && onEmployeeRoleChange) {
                    const allEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
                    const allRoles = loadSavedRoles();
                    
                    const unusedCustomRoles = allRoles.filter(role => 
                        role.id.startsWith('custom_') &&
                        role.id !== selectedRoleForEmployee &&
                        !allEmployees.some(emp => emp.roleId === role.id)
                    );
                    
                    const rolesToKeep = allRoles.filter(role => !unusedCustomRoles.some(unused => unused.id === role.id));

                    let finalRoles = [...rolesToKeep];
                    if (selectedRoleForEmployee.startsWith('custom_') && hasChanges) {
                        const updatedRole = roles.find(r => r.id === selectedRoleForEmployee);
                        if(updatedRole) {
                           finalRoles = finalRoles.map(r => r.id === selectedRoleForEmployee ? updatedRole : r);
                        }
                    }

                    localStorage.setItem('access-roles', JSON.stringify(finalRoles));
                    onEmployeeRoleChange(selectedEmployee.id, selectedRoleForEmployee);
                }
            }
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Ошибка при сохранении!');
        }
    };

    
    const handleConfirmClose = () => {
        setShowConfirmationModal(false); 
        onClose();                      
    };

    
    const handleCancelClose = () => {
        setShowConfirmationModal(false);
    };

    
    const handleAttemptClose = () => {
        if (hasChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };
    
    
    const rolesToDisplay = isGeneralMode
    ? roles.filter(role => !role.id.startsWith('custom_'))
    : roles.filter(role => {
        const isBaseRole = !role.id.startsWith('custom_');
        const isCurrentlyAssigned = role.id === selectedEmployee?.roleId;
        const isCustomRoleForThisEmployee = role.id.startsWith('custom_') && role.employeeId === selectedEmployee?.id;

        
        return (isBaseRole || isCurrentlyAssigned || isCustomRoleForThisEmployee) && role.id !== 'owner';
    });

    const activeRole = roles.find(role => role.id === activeRoleId);
    const isPermissionsDisabled = activeRole?.isProtected;
    const isEmployeeProtected = !isGeneralMode && selectedEmployee?.isProtected;
    const showFooter = !isEmployeeProtected;

    
    const [employees] = useState(() => {
        try {
            const saved = localStorage.getItem('employees');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    if (!isOpen) return null;

    return (
         <>
            <div className="access-modal-overlay" onClick={handleAttemptClose}></div>
            <div className="access-modal custom-scrollbar">
                <div className="access-modal-header">
                    <div className="access-modal-header-content">
                        <h2>
                            {isGeneralMode ? 'Настройка доступов' : `Назначение роли - ${selectedEmployee?.fullName}`}
                        </h2>
                        {selectedEmployee && !isGeneralMode && (
                            <div className="access-modal-employee-info">
                                <p>Текущая роль: <strong>{originalRoles.find(r => r.id === selectedEmployee.roleId)?.name || selectedEmployee.roleName}</strong></p>
                            </div>
                        )}
                    </div>
                    <div className="access-modal-header-actions">
                        <button className="access-modal-close-button" onClick={handleAttemptClose}><X/></button>
                    </div>
                </div>

                <div className="access-modal-content" ref={contentRef}>
                    <div className="access-modal-roles-section">
                        <div className="access-modal-roles-header">
                            <span className="access-modal-roles-label">{isGeneralMode ? 'Роли' : 'Выберите роль'}</span>
                            {isGeneralMode && (
                                <div className="access-modal-roles-actions">
                                    <button className="access-modal-add-role-btn" onClick={handleAddRole} title="Добавить роль"><Plus size={16}/></button>
                                    <button className={`access-modal-delete-mode-btn ${showDeleteMode ? 'active' : ''}`} onClick={toggleDeleteMode} title="Удалить роли"><Trash2 size={16} color="white"/></button>
                                </div>
                            )}
                        </div>
                        <div className="access-modal-roles-container">
                             {rolesToDisplay.map(role => (
                                <div
                                    key={role.id}
                                    className={`access-modal-role-item ${ (isGeneralMode ? activeRoleId : selectedRoleForEmployee) === role.id ? 'active' : ''} 
                                    ${isGeneralMode && showDeleteMode && rolesToDelete.includes(role.id) ? 'selected-for-delete' : ''} 
                                    ${isEmployeeProtected ? 'disabled' : ''}`}
                                    onClick={(e) => !isEmployeeProtected && handleRoleClick(role.id, e)}
                                >
                                    {isGeneralMode && <span className={`access-modal-protection-badge ${role.id === 'owner' ? 'disabled' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggleRoleProtection(role.id); }} title={role.id === 'owner' ? 'Роль Владельца защищена системно' : (role.isProtected ? "Нажмите, чтобы разблокировать" : "Нажмите, чтобы защитить")}>{role.isProtected ? <Lock size={20}/> : <LockOpen size={20}/>}</span>}
                                    <span className="access-modal-role-name">{role.name}</span>
                                    {isGeneralMode && showDeleteMode && role.id !== 'owner' && <input type="checkbox" className="access-modal-role-checkbox" checked={rolesToDelete.includes(role.id)} onChange={() => toggleRoleForDeletion(role.id)} onClick={(e) => e.stopPropagation()}/>}
                                    {!isGeneralMode && selectedRoleForEmployee === role.id && !isEmployeeProtected && <span className="access-modal-selected-badge">✓</span>}
                                </div>
                            ))}
                            {isGeneralMode && showAddRoleInput && (
                                <div className="access-modal-add-role-input">
                                    <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Название роли" onKeyPress={(e) => e.key === 'Enter' && handleAddRole()} autoFocus/>
                                    <button onClick={handleAddRole}>✓</button>
                                    <button onClick={() => { setShowAddRoleInput(false); setNewRoleName(''); }}>✕</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="access-modal-permissions-section">
                        <h3 className="access-modal-permissions-title">
                            {isGeneralMode ? 'Настройки роли:' : 'Права доступа роли:'} <span>{activeRole?.name}</span>
                            {activeRole?.isProtected && <span style={{ marginLeft: '10px', verticalAlign: 'middle'}}><Lock size={20}/></span>}
                        </h3>
                        <div className="access-modal-description-cell">
                                       <div className="description-line"><div className="permission-dot permission-dot-green" /><span>Разрешено</span></div>
                                       <div className="description-line"><div className="permission-dot permission-dot-orange" /><span>Если ответственный</span></div>
                                       <div className="description-line"><div className="permission-dot permission-dot-red" /><span>Запрещено</span></div>
                        </div>
                        <div className="access-modal-permissions-table">
                            <div className="access-modal-table-header">
                                <div className="access-modal-module-column">Доступы</div>
                                {actions.map(action => (<div key={action.key} className="access-modal-action-column"><div className="access-modal-action-header-content"><span className="access-modal-action-name">{action.name}</span></div></div>))}
                                <div className="access-modal-description-column">Описание</div>
                            </div>
                            {modules.map(module => (
                                <div key={module.key} className="access-modal-table-row">
                                    <div className="access-modal-module-name">{module.name}</div>
                                    {actions.map(action => (
                                        <div key={action.key} className="access-modal-action-cell">
                                            <ThreeStateToggle value={activeRole?.permissions?.[module.key]?.[action.key] || 'forbidden'} onChange={(newValue) => handlePermissionChange(module.key, action.key, newValue)} disabled={isPermissionsDisabled || isEmployeeProtected}/>
                                        </div>
                                    ))}
                                    <div className="access-modal-description-column">
                                        {activeRole && (
                                            <ModulePermissionStatus
                                                rolePermissions={activeRole.permissions}
                                                moduleKey={module.key}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {showFooter && (
                    <div className="access-modal-footer">
                        <div className="access-modal-action-buttons">
                            {isGeneralMode && showDeleteMode && rolesToDelete.length > 0 ? (
                                <>
                                    <button className="cancel-order-btn" onClick={toggleDeleteMode}>Отмена</button>
                                    <button className="save-order-btn" onClick={handleDeleteRoles}>Удалить выбранные ({rolesToDelete.length})</button>
                                </>
                            ) : (
                                <>
                                    <button className="cancel-order-btn" onClick={handleAttemptClose}>Отмена</button>
                                    <button className="save-order-btn" onClick={handleSave}>Сохранить</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showConfirmationModal && (
                <ConfirmationModal
                    title="Подтверждение"
                    message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно без сохранения?"
                    confirmText="Закрыть"
                    cancelText="Отмена"
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                />
            )}
        </>
    );
};

export default AccessModal;