
import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import EmployeeModal from "./EmployeesModal/EmployeeModal";
import "../../styles/EmployeesPage.css";
import avatarPlaceholder from "../../assets/avatar-placeholder.svg"; 


const EmployeeCard = ({ employee, onClick }) => {
    return (
        <div className="employee-card" onClick={onClick}>
            <img src={avatarPlaceholder} alt={employee.fullName} className="card-avatar" />
            <div className="card-info">
                <span className="card-tag">{employee.login}</span>
                <span className="card-name">{employee.fullName}</span>
            </div>
        </div>
    );
};

const EmployeePage = () => {
    const defaultEmployees = [
        {
            id: 1,
            fullName: "Иванов И.И.",
            tags: "IT",
            login: "ivanov_i",
            source: "Telegram",
            birthDate: "1990-01-01",
            phone: "+380501234567",
            balance: "100$",
            cashOnHand: "50грн",
            status: 'active',
            requisites: { UAH: [{ bank: 'Mono', card: '1234...' }] }
        },
        {
            id: 2,
            fullName: "Петров П.П.",
            tags: "Sales",
            login: "petrov_p",
            source: "Viber",
            birthDate: "1985-11-05",
            phone: "+380679876543",
            balance: "1000$",
            cashOnHand: "50грн",
            status: 'inactive'
        },
    ];

    
    const [employees, setEmployees] = useState(() => {
        const savedEmployees = localStorage.getItem('employees');
        return savedEmployees ? JSON.parse(savedEmployees) : defaultEmployees;
    });

    
    useEffect(() => {
        localStorage.setItem('employees', JSON.stringify(employees));
    }, [employees]);

    
    const [viewMode, setViewMode] = useState('card'); 

    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    
    const handleOpenModal = (employee = null) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSaveEmployee = (data) => {
        if (selectedEmployee && selectedEmployee.id) {
            setEmployees(employees.map(emp => emp.id === selectedEmployee.id ? { ...emp, ...data } : emp));
        } else {
            const newEmployee = { ...data, id: Date.now(), balance: '0$', cashOnHand: '0грн' };
            setEmployees([...employees, newEmployee]);
        }
        handleCloseModal();
    };
    
    const handleDeleteEmployee = (employeeId) => {
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        handleCloseModal();
    };
    
    const [collapsedGroups, setCollapsedGroups] = useState({});

    const groupedEmployees = useMemo(() => {
        return employees.reduce((acc, employee) => {
            const groupKey = employee.status === 'active' ? 'Работает' : 'Не работает';
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(employee);
            return acc;
        }, {});
    }, [employees]);

    const toggleGroup = (groupKey) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };


    return (
        <div className="employees-page">
            <Sidebar />
            <div className="employees-page-main-container">
                <header className="employees-header-container">
                    <h1 className="employees-title">КОМАНДА</h1>
                    
                    
                    <div className="view-mode-buttons">
                        <button
                            className={`view-mode-button ${viewMode === 'card' ? 'active' : ''}`}
                            onClick={() => setViewMode('card')}
                            title="Карточный вид"
                        >
                            &#x25A3; 
                        </button>
                        <button
                            className={`view-mode-button ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Табличный вид"
                        >
                            &#x2261; 
                        </button>
                    </div>

                    <button className="add-employee-button" onClick={() => handleOpenModal()}>
                        ➕ добавить сотрудника
                    </button>
                </header>

                <div className="employees-content">
                    {viewMode === 'table' ? (
                        <div className="employees-table-container">
                            <table className="employees-table">
                                <thead>
                                    <tr>
                                        <th>Сотрудник</th>
                                        <th>Теги</th>
                                        <th>Логин</th>
                                        <th>Источник</th>
                                        <th>Дата рождения</th>
                                        <th>Телефон</th>
                                        <th>Реквизиты</th>
                                        <th>Баланс ЗП</th>
                                        <th>Средства на руках</th>
                                    </tr>
                                </thead>
                                {Object.entries(groupedEmployees).map(([groupName, groupEmployees], index) => (
                                    <tbody key={groupName}>
                                        <tr className="group-header" onClick={() => toggleGroup(groupName)}>
                                            <td colSpan="9">
                                                <span className={`collapse-icon ${collapsedGroups[groupName] ? 'collapsed' : ''}`}>▼</span>
                                                {`${index + 1}. ${groupName.toUpperCase()}`}
                                                <span className="group-count">{groupEmployees.length}</span>
                                            </td>
                                        </tr>
                                        {!collapsedGroups[groupName] && groupEmployees.map((employee) => (
                                            <tr key={employee.id} onClick={() => handleOpenModal(employee)} style={{cursor: 'pointer'}}>
                                                <td>{employee.fullName}</td>
                                                <td>
                                                {Array.isArray(employee.tags) ? employee.tags.map(tag => (
                                                    <span key={tag.name} style={{ backgroundColor: tag.color || '#555', color: '#fff', padding: '2px 8px', borderRadius: '12px', marginRight: '4px', fontSize: '12px', display: 'inline-block' }}>
                                                    {tag.name}
                                                    </span>
                                                )) : employee.tags}
                                                </td>
                                                <td>{employee.login}</td>
                                                <td>{employee.source}</td>
                                                <td>{employee.birthDate}</td>
                                                <td>{employee.phone}</td>
                                                <td>Копировать рек.</td>
                                                <td>{employee.balance}</td>
                                                <td>{employee.cashOnHand}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))}
                            </table>
                        </div>
                    ) : (
                        <div className="employees-card-view">
                            {Object.entries(groupedEmployees).map(([groupName, groupEmployees], index) => (
                                <div key={groupName} className="card-group">
                                    <h2 className="group-header card-group-header" onClick={() => toggleGroup(groupName)}>
                                        <span className={`collapse-icon ${collapsedGroups[groupName] ? 'collapsed' : ''}`}>▼</span>
                                        {`${index + 1}. ${groupName.toUpperCase()}`}
                                        <span className="group-count">{groupEmployees.length}</span>
                                    </h2>
                                    {!collapsedGroups[groupName] && (
                                        <div className="cards-container">
                                            {groupEmployees.map((employee) => (
                                                <EmployeeCard 
                                                    key={employee.id} 
                                                    employee={employee} 
                                                    onClick={() => handleOpenModal(employee)} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <EmployeeModal
                    employee={selectedEmployee}
                    onClose={handleCloseModal}
                    onSave={handleSaveEmployee}
                    onDelete={selectedEmployee ? () => handleDeleteEmployee(selectedEmployee.id) : null}
                />
            )}
        </div>
    );
};

export default EmployeePage;