// src/pages/EmployeePage.jsx
import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import EmployeeModal from "./EmployeesModal/EmployeeModal";
import "../../styles/EmployeesPage.css";
import avatarPlaceholder from "../../assets/avatar-placeholder.svg";
import {
  fetchEmployees as apiFetchEmployees,
  createEmployee as apiCreateEmployee,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  normalizeEmployee,
  serializeEmployee,
} from "../../api/employees";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const formatNumberWithSpaces = (num) => {
        if (num === null || num === undefined || isNaN(Number(num))) {
            return '0.00';
        }
        const fixedNum = Number(num).toFixed(2);
        const parts = fixedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    };

const EmployeeCard = ({ employee, onClick }) => {
  const avatar = employee.avatarUrl || avatarPlaceholder;
  const tags = Array.isArray(employee.tags) ? employee.tags : [];
  return (
    <div className="employee-card" onClick={onClick}>
      <img src={avatar} alt={employee.fullName || "Сотрудник"} className="card-avatar" />
      <div className="card-details">
        <div className="card-header">
          <span className="card-full-name">{employee.fullName}</span>
          {employee.birthDate && <span className="card-birthdate">{formatDate(employee.birthDate)}</span>}
        </div>
        <div className="card-login-wrapper">
          <span className="card-login">{employee.login}</span>
        </div>
        <div className="card-footer">
          <div className="card-tags-container">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span key={tag.id || tag.name} className="tag-chip" style={{ backgroundColor: tag.color || "#777" }}>
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="card-label" />
            )}
          </div>
          <div className="card-balance-container">
            <span className="card-label">Баланс:</span>
            <span className="card-balance">{employee.balance || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeePage = () => {
  // локальная «база» на случай оффлайна
  const defaultEmployees = [
    {
      id: 1,
      fullName: "Иванов И.И.",
      tags: [{ id: "t1", name: "IT", color: "#4b7bec" }],
      login: "ivanov_i",
      source: "Telegram",
      birthDate: "1990-01-01",
      phone: "+380501234567",
      balance: "100$",
      cashOnHand: "50грн",
      status: "active",
      requisites: { UAH: [{ bank: "Mono", card: "1234..." }] },
    },
    {
      id: 2,
      fullName: "Петров П.П.",
      tags: [{ id: "t2", name: "Sales", color: "#ff9f43" }],
      login: "petrov_p",
      source: "Viber",
      birthDate: "1985-11-05",
      phone: "+380679876543",
      balance: "1000$",
      cashOnHand: "50грн",
      status: "inactive",
    },
  ];

  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem("employees");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(normalizeEmployee) : defaultEmployees.map(normalizeEmployee);
      }
    } catch (_) {}
    return defaultEmployees.map(normalizeEmployee);
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // синк в localStorage как кэш
  useEffect(() => {
    try {
      localStorage.setItem("employees", JSON.stringify(employees));
    } catch (_) {}
  }, [employees]);

  // первичная загрузка из API (с фолбэком)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await apiFetchEmployees();
        if (!mounted) return;
        setEmployees(list);
      } catch (e) {
        console.warn("API /employees недоступен, используем кэш/localStorage. Причина:", e?.message || e);
        if (!mounted) return;
        // уже задали из localStorage в useState; просто пометим ошибку
        setError("Не удалось получить данные с сервера. Показаны сохранённые локально.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [viewMode, setViewMode] = useState("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const handleOpenModal = (employee = null) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const upsertLocal = (data, existedId) => {
    if (existedId) {
      setEmployees((prev) => prev.map((e) => (e.id === existedId ? normalizeEmployee({ ...e, ...data }) : e)));
    } else {
      const newEmp = normalizeEmployee({ ...data, id: Date.now() });
      setEmployees((prev) => [...prev, newEmp]);
    }
  };

  const handleSaveEmployee = async (formData) => {
    const outgoing = serializeEmployee(formData);
    try {
      if (selectedEmployee && selectedEmployee.id) {
        const saved = await apiUpdateEmployee(selectedEmployee.id, outgoing);
        setEmployees((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        const created = await apiCreateEmployee(outgoing);
        setEmployees((prev) => [...prev, created]);
      }
    } catch (e) {
      console.warn("Сохранение через API не удалось, применяю локально:", e?.message || e);
      upsertLocal(outgoing, selectedEmployee?.id);
      setError("Сервер недоступен. Изменения сохранены локально.");
    } finally {
      handleCloseModal();
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await apiDeleteEmployee(employeeId);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    } catch (e) {
      console.warn("Удаление через API не удалось, удаляю локально:", e?.message || e);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      setError("Сервер недоступен. Удалено локально.");
    } finally {
      handleCloseModal();
    }
  };

  const groupedEmployees = useMemo(() => {
    return (employees || []).reduce(
      (acc, employee) => {
        const key = employee.status === "inactive" ? "Не работает" : "Работает";
        acc[key].push(employee);
        return acc;
      },
      { Работает: [], "Не работает": [] }
    );
  }, [employees]);

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <div className="employees-page">
      <Sidebar />
      <div className="employees-page-main-container">
        <header className="employees-header-container">
          <h1 className="employees-title">
            <PageHeaderIcon pageName={"Сотрудники"}/>
            СОТРУДНИКИ
            </h1>

          <div className="view-mode-buttons">
            <button
              className={`view-mode-button ${viewMode === "card" ? "active" : ""}`}
              onClick={() => setViewMode("card")}
              title="Карточный вид"
            >
              &#x25A3;
            </button>
            <button
              className={`view-mode-button ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Табличный вид"
            >
              &#x2261;
            </button>
          </div>

          <button className="add-employee-button" onClick={() => handleOpenModal()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Добавить
          </button>
        </header>

        {loading && <div className="employees-loading">Загрузка…</div>}
        {!!error && !loading && <div className="employees-error">{error}</div>}

        <div className="employees-content">
          {viewMode === "table" ? (
            <div className="employees-table-container">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Теги</th>
                    <th>Логин</th>
                    <th>Источник</th>
                    <th>ДР</th>
                    <th>Телефон</th>
                    <th>Рекв.</th>
                    <th>Баланс</th>
                    <th>Средства на руках</th>
                  </tr>
                </thead>
                {Object.entries(groupedEmployees).map(([groupName, groupEmployees], idx) => (
                  <tbody key={groupName}>
                    <tr className="group-header" onClick={() => toggleGroup(groupName)}>
                      <td colSpan="9">
                        <span className={`collapse-icon ${collapsedGroups[groupName] ? "collapsed" : ""}`}>▼</span>
                        {`${idx + 1}. ${groupName.toUpperCase()}`}
                        <span className="group-count">{groupEmployees.length}</span>
                      </td>
                    </tr>
                    {!collapsedGroups[groupName] &&
                      groupEmployees.map((employee) => (
                        <tr key={employee.id} onClick={() => handleOpenModal(employee)} style={{ cursor: "pointer" }}>
                          <td>{employee.fullName}</td>
                          <td>
                            {(Array.isArray(employee.tags) ? employee.tags : []).map((tag) => (
                              <span
                                key={tag.id || tag.name}
                                style={{
                                  backgroundColor: tag.color || "#555",
                                  color: "#fff",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  marginRight: "4px",
                                  fontSize: "12px",
                                  display: "inline-block",
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </td>
                          <td>{employee.login}</td>
                          <td>{employee.source}</td>
                          <td>{formatDate(employee.birthDate)}</td>
                          <td>{employee.phone}</td>
                          <td><span className="copy-button-icon"
                                onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(transaction.counterpartyRequisites);
                                }}
                              title="Копировать реквизиты"></span>
                          </td>
                          <td>{formatNumberWithSpaces(employee.balance)}</td>
                          <td>{formatNumberWithSpaces(employee.cashOnHand)}</td>
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
                    <span className={`collapse-icon ${collapsedGroups[groupName] ? "collapsed" : ""}`}>▼</span>
                    {`${index + 1}. ${groupName.toUpperCase()}`}
                    <span className="group-count">{groupEmployees.length}</span>
                  </h2>
                  {!collapsedGroups[groupName] && (
                    <div className="cards-container">
                      {groupEmployees.map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} onClick={() => handleOpenModal(employee)} />
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
