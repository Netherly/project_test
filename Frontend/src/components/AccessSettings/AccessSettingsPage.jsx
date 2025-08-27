import React, { useState, useMemo, useCallback } from "react";
import "./AccessSettings.css";
import Sidebar from "../Sidebar.jsx";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import AccessModal from './AccessModal.jsx';
import { modules, defaultRoles } from './RolesConfig.jsx';

const ModulePermissionStatus = ({ rolePermissions, moduleKey }) => {
    const modulePerms = rolePermissions[moduleKey] || {};

    const actions = [
        { key: 'create', letter: 'С', name: 'Создание' },
        { key: 'view', letter: 'П', name: 'Просмотр' },
        { key: 'edit', letter: 'П', name: 'Правка' },
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

    // Загрузка ролей из localStorage или использование дефолтных
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

    // Загрузка сотрудников из localStorage или использование дефолтных
    const loadEmployees = () => {
        try {
            const saved = localStorage.getItem('employees-roles');
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
                isProtected: true // Защищенный пользователь
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

    // Функция для синхронизации ролей сотрудников с актуальными ролями
    const syncEmployeeRoles = useCallback(() => {
        const currentRoles = loadRoles();
        setRoles(currentRoles);

        // Обновляем сотрудников, проверяя существование их ролей
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

        // Сохраняем обновленных сотрудников
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

    const getProtectedRoles = () => ['owner']; // Роли, которые нельзя назначать другим пользователям

    // Проверка, может ли пользователь изменить роль
    const canChangeEmployeeRole = (employee) => {
        if (employee.isProtected) return false;

        return true;
    };

    // Получение доступных ролей для назначения
    const getAvailableRolesForEmployee = (employee) => {
        const protectedRoles = getProtectedRoles();

        if (employee.isProtected) {
            // Для защищенных пользователей - только их текущая роль
            return roles.filter(role => role.id === employee.roleId);
        }

        // Для обычных пользователей - все роли кроме защищенных
        return roles.filter(role => !protectedRoles.includes(role.id));
    };

    const getEmployeeRole = (employee) => {
        return roles.find(role => role.id === employee.roleId);
    };

    // Функция для получения отображаемой роли
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

    // Простая фильтрация только по имени (включая фамилию)
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

    // Обработка сохранения назначения роли сотруднику
    const handleEmployeeRoleChange = (employeeId, newRoleId) => {
        const newRole = roles.find(role => role.id === newRoleId);
        if (!newRole) return;

        setEmployees(prev => prev.map(employee =>
            employee.id === employeeId
                ? {
                    ...employee,
                    roleId: newRoleId,
                    roleName: newRole.name
                }
                : employee
        ));

        // Сохраняем в localStorage
        try {
            const updatedEmployees = employees.map(employee =>
                employee.id === employeeId
                    ? {
                        ...employee,
                        roleId: newRoleId,
                        roleName: newRole.name
                    }
                    : employee
            );
            localStorage.setItem('employees-roles', JSON.stringify(updatedEmployees));
            console.log(`Роль ${newRole.name} назначена сотруднику ${employees.find(e => e.id === employeeId)?.name}`);
        } catch (error) {
            console.error('Ошибка сохранения назначения роли:', error);
        }
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
                    <div className="access-filter">
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
                    <button className="access-button" onClick={handleAccessButtonClick}>
                        Доступы
                    </button>
                </header>

                <div className="access-table-container">
                    <table className="access-table">
                        <thead>
                            <tr>
                                <th>ИМЯ</th>
                                <th>РОЛЬ</th>
                                <th>E-MAIL</th>
                                {modules.map(module => (
                                    <th key={module.key} className="module-header">
                                        <div className="module-header-content">
                                            <span className="module-name">{module.name.toUpperCase()}</span>
                                            <div className="permission-legend">
                                                <span title="Создание">С</span>
                                                <span title="Просмотр">П</span>
                                                <span title="Правка">П</span>
                                                <span title="Удаление">У</span>
                                            </div>
                                            <div className="permission-legend-dots">
                                                <span className="legend-dot green" title="Разрешено"></span>
                                                <span className="legend-dot orange" title="Если ответственный"></span>
                                                <span className="legend-dot red" title="Запрещено"></span>
                                            </div>
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
                                                {employee.name}
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
                                                        {displayRole.role.isProtected ? '🔒' : '👑'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {employee.email}
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