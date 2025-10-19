import React, { useState, useMemo, useCallback } from "react";
import "./AccessSettings.css";
import Sidebar from "../Sidebar.jsx";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import AccessModal from './AccessModal.jsx';
import { modules, defaultRoles } from './RolesConfig.jsx';
import { Plus, Lock, LockOpen } from 'lucide-react';

export const ModulePermissionStatus = ({ rolePermissions, moduleKey }) => {
    const modulePerms = rolePermissions[moduleKey] || {};

    const actions = [
        { key: 'create', letter: 'С', name: 'Создание' },
        { key: 'view', letter: 'П', name: 'Просмотр' },
        { key: 'edit', letter: 'И', name: 'Изменения' },
        { key: 'delete', letter: 'У', name: 'Удаление' }
    ];

    const getPermissionColor = (permission) => {
        switch (permission) {
            case 'allowed': return 'green';
            case 'responsible': return 'orange';
            case 'forbidden':
            default: return 'red';
        }
    };

    return (
        <div className="permission-compact-display">
            {actions.map(action => (
                <div key={action.key} className="permission-row">
                    <span
                        className="permission-letter"
                        title={`${action.name}: ${modulePerms[action.key] || 'forbidden'}`}
                    >
                        {action.letter}
                    </span>
                    <span
                        className={`permission-dot permission-dot-${getPermissionColor(modulePerms[action.key] || 'forbidden')}`}
                        title={`${action.name}: ${modulePerms[action.key] || 'forbidden'}`}
                    />
                </div>
            ))}
        </div>
    );
};

function AccessSettings() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isGeneralMode, setIsGeneralMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    
    const loadRoles = () => {
        try {
            const saved = localStorage.getItem('access-roles');
            if (saved) {
                const parsedRoles = JSON.parse(saved);
                if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                    return parsedRoles;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки ролей:', error);
        }
        return defaultRoles;
    };

    
    const loadEmployees = () => {
        try {
            const saved = localStorage.getItem('employees');
            if (saved) {
                const parsedEmployees = JSON.parse(saved);
                if (Array.isArray(parsedEmployees) && parsedEmployees.length > 0) {
                    return parsedEmployees;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error);
        }

        return [
            {
                id: 1,
                name: "Лев",
                roleId: "owner",
                roleName: "Владелец",
                email: "systemallingenua@gmail.com",
                isProtected: true 
            },
            {
                id: 2,
                name: "Анна Петрова",
                roleId: "admin",
                roleName: "Админ",
                email: "anna.petrova@company.com",
                isProtected: false
            },
            {
                id: 3,
                name: "Михаил Сидоров",
                roleId: "manager",
                roleName: "Менеджер",
                email: "mikhail.sidorov@company.com",
                isProtected: false
            },
            {
                id: 4,
                name: "Екатерина Иванова",
                roleId: "employee",
                roleName: "Сотрудник",
                email: "ekaterina.ivanova@company.com",
                isProtected: false
            },
        ];
    };

    const [employees, setEmployees] = useState(loadEmployees);
    const [roles, setRoles] = useState(loadRoles);

   
    const syncEmployeeRoles = useCallback(() => {
        const currentRoles = loadRoles();
        setRoles(currentRoles);

        
        setEmployees(prev => prev.map(employee => {
            const currentRole = currentRoles.find(role => role.id === employee.roleId);

            if (currentRole) {
                return {
                    ...employee,
                    roleName: currentRole.name
                };
            } else {
                return {
                    ...employee,
                    roleId: null,
                    roleName: null
                };
            }
        }));

        
        try {
            const updatedEmployees = employees.map(employee => {
                const currentRole = currentRoles.find(role => role.id === employee.roleId);

                if (currentRole) {
                    return {
                        ...employee,
                        roleName: currentRole.name
                    };
                } else {
                    return {
                        ...employee,
                        roleId: null,
                        roleName: null
                    };
                }
            });
            localStorage.setItem('employees-roles', JSON.stringify(updatedEmployees));
        } catch (error) {
            console.error('Ошибка сохранения синхронизированных сотрудников:', error);
        }
    }, [employees]);

    const getProtectedRoles = () => ['owner']; 

    
    const canChangeEmployeeRole = (employee) => {
        if (employee.isProtected) return false;

        return true;
    };

    
    const getAvailableRolesForEmployee = (employee) => {
        const protectedRoles = getProtectedRoles();

        if (employee.isProtected) {
            return roles.filter(role => role.id === employee.roleId);
        }

        
        return roles.filter(role => !protectedRoles.includes(role.id));
    };

    const getEmployeeRole = (employee) => {
        return roles.find(role => role.id === employee.roleId);
    };

    
    const getDisplayRole = (employee) => {
        const role = getEmployeeRole(employee);

        if (role) {
            return {
                name: role.name,
                hasRole: true,
                role: role
            };
        } else {
            return {
                name: "Назначить роль",
                hasRole: false,
                role: null
            };
        }
    };

    
    const filteredEmployees = useMemo(() => {
        if (!searchTerm.trim()) {
            return employees;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        return employees.filter(employee => {
            const fullName = employee.name.toLowerCase();

            const searchWords = searchLower.split(/\s+/);

            return searchWords.every(word => fullName.includes(word));
        });
    }, [employees, searchTerm]);

    const refreshRoles = useCallback(() => {
        syncEmployeeRoles();
    }, [syncEmployeeRoles]);

    const handleAccessButtonClick = () => {
        setSelectedEmployee(null);
        setIsGeneralMode(true);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
        setIsGeneralMode(false);

        refreshRoles();
    };

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsGeneralMode(false);
        setIsModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    
    const handleEmployeeRoleChange = (employeeId, newRoleId) => {
        
        const currentRoles = loadRoles();
        const newRole = currentRoles.find(role => role.id === newRoleId);

        
        if (!newRole) {
            console.error("Не удалось найти назначенную роль. Синхронизация не удалась.");
            return;
        }

        
        setEmployees(prevEmployees => {
            const updatedEmployees = prevEmployees.map(employee =>
                employee.id === employeeId
                    ? {
                        ...employee,
                        roleId: newRoleId,
                        roleName: newRole.name
                    }
                    : employee
            );

            
            try {
                localStorage.setItem('employees', JSON.stringify(updatedEmployees));
                console.log(`Роль "${newRole.name}" назначена сотруднику.`);
            } catch (error) {
                console.error('Ошибка сохранения назначения роли:', error);
            }

            return updatedEmployees; 
        });
    };

    return (
        <div className="access-page">
            <Sidebar />
            <div className="access-page-main-container">
                <header className="access-header-container">
                    <h1 className="access-title">
                        <PageHeaderIcon pageName="Роли/Доступы" />
                        Доступы
                    </h1>
                     {/*<div className="access-filter">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Поиск по имени и фамилии..."
                                className="filter-input"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    */}
                    <button className="access-button" onClick={handleAccessButtonClick}>
                        <Plus size={20}/>Добавить
                    </button>
                </header>

                <div className="access-table-container">
                    <table className="access-table">
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Роль</th>
                                {modules.map(module => (
                                    <th key={module.key} className="module-header">
                                        <div className="module-header-content">
                                            <span className="module-name">{module.name}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee) => {
                                    const displayRole = getDisplayRole(employee);
                                    const canChange = canChangeEmployeeRole(employee);

                                    return (
                                        <tr
                                            key={employee.id}
                                            onClick={() => (canChange || !displayRole.hasRole) ? handleEmployeeClick(employee) : null}
                                            className={`employee-row ${(canChange || !displayRole.hasRole) ? 'clickable' : 'protected'}`}
                                            title={!canChange && displayRole.hasRole ? 'Роль этого пользователя защищена самим Богом!' :
                                                !displayRole.hasRole ? 'Нажмите для назначения роли' : 'Нажмите для изменения роли'}
                                        >
                                            <td>
                                                {employee.fullName}
                                                {employee.isProtected && (
                                                    <span className="protected-badge" title="Защищенный пользователь">
                                                        🛡️
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`role-name ${!displayRole.hasRole ? 'no-role' : ''}`}>
                                                    {displayRole.name}
                                                </span>
                                                {displayRole.hasRole && displayRole.role?.isBase && (
                                                    <span className="role-badge" title={displayRole.role.isProtected ? "Системная роль (защищена)" : "Системная роль"}>
                                                        {displayRole.role.isProtected ? <Lock size={14}/> : <LockOpen size={14}/>}
                                                    </span>
                                                )}
                                            </td>
                                            {modules.map(module => (
                                                <td key={module.key} className="permission-cell">
                                                    {displayRole.hasRole ? (
                                                        <ModulePermissionStatus
                                                            rolePermissions={displayRole.role.permissions}
                                                            moduleKey={module.key}
                                                        />
                                                    ) : (
                                                        <span className="permission-status no-access">Нет роли</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={3 + modules.length} className="no-results">
                                        Сотрудники не найдены
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <AccessModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    selectedEmployee={selectedEmployee}
                    isGeneralMode={isGeneralMode}
                    availableRoles={selectedEmployee ? getAvailableRolesForEmployee(selectedEmployee) : roles}
                    onEmployeeRoleChange={handleEmployeeRoleChange}
                />
            </div>
        </div>
    );
}

export default AccessSettings;