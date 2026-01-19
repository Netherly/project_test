import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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


const getFirstRequisite = (requisites) => {
    if (!requisites || typeof requisites !== 'object' || Array.isArray(requisites)) {
      return null;
    }
    const allRequisiteArrays = Object.values(requisites);
    const firstValidArray = allRequisiteArrays.find(arr => Array.isArray(arr) && arr.length > 0);
    return firstValidArray ? firstValidArray[0] : null;
};


const EmployeeCard = ({ employee, onClick }) => {
  const avatar = employee.avatarUrl || employee.photoLink || avatarPlaceholder; 
  const tags = Array.isArray(employee.tags) ? employee.tags : [];
  return (
    <div className="employee-card" onClick={onClick}>
      <img
        src={avatar}
        alt={employee.fullName || employee.full_name || "Сотрудник"} 
        className="card-avatar"
      />
      <div className="card-details">
        <div className="card-header">
          <span className="card-full-name">
            {employee.fullName || employee.full_name || "Без имени"}
          </span>
          {employee.birthDate && (
            <span className="card-birthdate">{formatDate(employee.birthDate)}</span>
          )}
        </div>
        <div className="card-login-wrapper">
          <span className="card-login">{employee.login}</span>
        </div>
        <div className="card-footer">
          <div className="card-tags-container">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag.id || tag.name}
                  className="tag-chip"
                  style={{ backgroundColor: tag.color || "#777" }}
                >
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="card-label" />
            )}
          </div>
          <div className="card-balance-container">
            <span className="card-label">Баланс:</span>
            <span className="card-balance">
              {formatNumberWithSpaces(employee.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeePage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultEmployees = [
    {
      id: 1,
      fullName: "Иванов И.И.",
      tags: [{ id: "t1", name: "IT", color: "#4b7bec" }],
      login: "ivanov_i",
      telegramNick: "@ivan_dev", 
      startDate: "2024-01-10", 
      source: "Telegram",
      birthDate: "1990-01-01",
      phone: "+380501234567",
      balance: "100",
      cashOnHand: "50",
      status: "active",
      requisites: { UAH: [{ bank: "ПриватБанк", card: "1234...", holder: "IVANOV I. I." }] }, 
      hourlyRates: { uah: 350, usd: 10, usdt: 10.1, eur: 8, rub: 700 },
    },
    {
      id: 2,
      fullName: "Петров П.П.",
      tags: [{ id: "t2", name: "Sales", color: "#ff9f43" }],
      login: "petrov_p",
      telegramNick: "@petr_sales",
      startDate: "2023-05-20",
      source: "Viber",
      birthDate: "1985-11-05",
      phone: "+380679876543",
      balance: "1000",
      cashOnHand: "500",
      status: "inactive",
      hourlyRates: { uah: 400, usd: 12, usdt: 12.1, eur: 10, rub: 800 },
    },
    {
      id: 3,
      fullName: "Сидоров С.С.",
      tags: [],
      login: "sidorov_s",
      telegramNick: "@sid_devops",
      startDate: "2024-03-15",
      source: "Referral",
      birthDate: "1995-07-20",
      phone: "+380995554433",
      balance: "0",
      cashOnHand: "0",
      status: "pending", 
      hourlyRates: { uah: 500, usd: 15, usdt: 15.1, eur: 13, rub: 1000 },
    },
  ];

  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem("employees");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.map(normalizeEmployee)
          : defaultEmployees.map(normalizeEmployee);
      }
    } catch (_) {}
    return defaultEmployees.map(normalizeEmployee);
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
  const selectedEmployee = useMemo(() => {
      if (!employeeId || employeeId === 'new') return null;
      return employees.find(e => String(e.id) === String(employeeId)) || null;
  }, [employees, employeeId]);

  const isModalOpen = Boolean(employeeId); 

  
  const viewMode = searchParams.get('view') || 'card';

  const setViewMode = (mode) => {
      setSearchParams({ view: mode });
  };

  useEffect(() => {
    try {
      localStorage.setItem("employees", JSON.stringify(employees));
    } catch (_) {}
  }, [employees]);

  
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
        console.warn(
          "API /employees недоступен, используем кэш/localStorage. Причина:",
          e?.message || e
        );
        if (!mounted) return;
        setError("Не удалось получить данные с сервера. Показаны сохранённые локально.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [collapsedGroups, setCollapsedGroups] = useState({});

  
  const handleOpenModal = (employee = null) => {
    if (employee) {
        navigate({
            pathname: `/employees/${employee.id}`,
            search: searchParams.toString()
        });
    } else {
        navigate({
            pathname: '/employees/new',
            search: searchParams.toString()
        });
    }
  };

  const handleCloseModal = () => {
    navigate({
        pathname: '/employees',
        search: searchParams.toString()
    });
  };

  const upsertLocal = (data, existedId) => {
    if (existedId) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === existedId ? normalizeEmployee({ ...e, ...data }) : e))
      );
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

  const handleDeleteEmployee = async (idToDelete) => {
    try {
      await apiDeleteEmployee(idToDelete);
      setEmployees((prev) => prev.filter((e) => e.id !== idToDelete));
    } catch (e) {
      console.warn("Удаление через API не удалось, удаляю локально:", e?.message || e);
      setEmployees((prev) => prev.filter((e) => e.id !== idToDelete));
      setError("Сервер недоступен. Удалено локально.");
    } finally {
      handleCloseModal();
    }
  };

  
  const groupedEmployees = useMemo(() => {
    return (employees || []).reduce(
      (acc, employee) => {
        let key;
        switch (employee.status) {
          case "inactive":
            key = "Не работает";
            break;
          case "pending": 
            key = "На рассмотрении";
            break;
          case "active":
          default:
            key = "Работает";
        }
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(employee);
        return acc;
      },
      {} 
    );
  }, [employees]);


  const groupOrder = {
    "На рассмотрении": 1,
    "Работает": 2,
    "Не работает": 3,
  };

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };


  return (
    <div className="employees-page">
      <Sidebar />
      <div className="employees-page-main-container">
        <header className="employees-header-container">
          <h1 className="employees-title">
            <PageHeaderIcon pageName={"Сотрудники"} />
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

          <button className="add-employee-button" onClick={() => handleOpenModal(null)}>
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
                    <th>ФИО</th>
                    <th>Логин</th>
                    <th>Ник ТГ</th>
                    <th>ДР</th>
                    <th>Теги</th>
                    <th>ДН</th>
                    <th>UAH/ч</th>
                    <th>USD/ч</th>
                    <th>USDT/ч</th>
                    <th>EUR/ч</th>
                    <th>RUB/ч</th>
                    <th>Баланс</th>
                    <th>Банк</th>
                    <th>Карта</th>
                    <th>Держатель</th>
                    <th>На руках</th>
                  </tr>
                </thead>
                {Object.entries(groupedEmployees)
                  .sort(([groupNameA], [groupNameB]) => (groupOrder[groupNameA] || 99) - (groupOrder[groupNameB] || 99))
                  .map(([groupName, groupEmployees], idx) => (
                  <tbody key={groupName}>
                    <tr className="group-header" onClick={() => toggleGroup(groupName)}>
                      <td colSpan="16"> 
                        <span className={`collapse-icon ${collapsedGroups[groupName] ? "collapsed" : ""}`}>▼</span>
                        {`${groupName.toUpperCase()}`}
                        <span className="group-count">{groupEmployees.length}</span>
                      </td>
                    </tr>
                    {!collapsedGroups[groupName] &&
                      groupEmployees.map((employee) => {
                        const firstReq = getFirstRequisite(employee.requisites);
                        return (
                          <tr key={employee.id} onClick={() => handleOpenModal(employee)} style={{ cursor: "pointer" }}>
                            <td>{employee.fullName}</td>
                            <td>{employee.login}</td>
                            <td>{employee.telegramNick || '—'}</td> 
                            <td>{formatDate(employee.birthDate)}</td>
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
                            <td>{formatDate(employee.startDate) || '—'}</td>
                            <td>{employee.hourlyRates?.uah}</td>
                            <td>{employee.hourlyRates?.usd}</td>
                            <td>{employee.hourlyRates?.usdt}</td>
                            <td>{employee.hourlyRates?.eur}</td>
                            <td>{employee.hourlyRates?.rub}</td>
                            <td>{formatNumberWithSpaces(employee.balance)}</td>
                            <td>{firstReq?.bank || '—'}</td>
                            <td>{firstReq?.card || '—'}</td>
                            <td>{firstReq?.holder || '—'}</td> 
                            <td>{formatNumberWithSpaces(employee.cashOnHand)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            <div className="employees-card-view">
              {Object.entries(groupedEmployees)
                .sort(([groupNameA], [groupNameB]) => (groupOrder[groupNameA] || 99) - (groupOrder[groupNameB] || 99))
                .map(([groupName, groupEmployees], index) => (
                <div key={groupName} className="card-group">
                  <h2 className="group-header card-group-header" onClick={() => toggleGroup(groupName)}>
                    <span className={`collapse-icon ${collapsedGroups[groupName] ? "collapsed" : ""}`}>▼</span>
                    {`${groupName.toUpperCase()}`}
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