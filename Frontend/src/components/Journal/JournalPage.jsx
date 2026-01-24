import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import "../../styles/JournalPage.css";
import LogEntryDetails from "./LogEntryDetail";
import AddLogEntryForm from "./AddLogEntryForm";
import FormattedDate from "../FormattedDate.jsx";


import { fetchOrders, updateOrder } from "../../api/orders";
import { fetchEmployees } from "../../api/employees";

const MultiSelectDropdown = ({ label, name, options, selectedValues, onChange }) => {
    const [inputValue, setInputValue] = useState("");
    const [showOptions, setShowOptions] = useState(false);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setShowOptions(e.target.value.length > 0);
    };

    const handleSelectOption = (value) => {
        let newValues;
        if (selectedValues.includes(value)) {
            newValues = selectedValues.filter(v => v !== value);
        } else {
            newValues = [...selectedValues, value];
        }
        onChange({ target: { name, value: newValues } }); 
        setInputValue(""); 
        setShowOptions(false); 
    };

    const handleRemoveTag = (value) => {
        const newValues = selectedValues.filter(v => v !== value);
        onChange({ target: { name, value: newValues } });
    };

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase()) && !selectedValues.includes(option)
    );

    return (
        <div className="search-field-group multiselect-group">
            <label>{label}</label>
            <div className="multiselect-container">
                <div className="selected-tags">
                    {selectedValues.map(value => (
                        <span key={value} className="tag">
                            {value}
                            <span className="remove-tag" onClick={() => handleRemoveTag(value)}>
                                ✖
                            </span>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder={`Выберите ${label.toLowerCase()}`}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={() => setTimeout(() => setShowOptions(false), 200)} 
                />
                {showOptions && filteredOptions.length > 0 && (
                    <ul className="dropdown-options">
                        {filteredOptions.map(option => (
                            <li
                                key={option}
                                onMouseDown={(e) => { 
                                    e.preventDefault();
                                    handleSelectOption(option);
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {(selectedValues.length > 0) && (
                <span className="clear-input" onClick={() => onChange({ target: { name, value: [] } })}>✖️</span>
            )}
        </div>
    );
};

const SimpleSearchInput = ({ label, name, value, onChange, placeholder, type = "text" }) => (
    <div className="search-field-group">
        <label>{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
        />
        {(value && value.length > 0) && (
            <span className="clear-input" onClick={() => onChange({ target: { name, value: '' } })}>✖️</span>
        )}
    </div>
);


const JournalPage = () => {
    const orderStatuses = [
        "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
        "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
        "На уточнении у клиента", "Тестируем", "Тестирует клиент",
        "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
        "Неудачно завершён", "Удаленные"
    ];

    const statusToEmojiMap = {
        "Лид": "🎯", "Изучаем ТЗ": "📄", "Обсуждаем с клиентом": "💬",
        "Клиент думает": "🤔", "Ожидаем предоплату": "💳", "Взяли в работу": "🚀",
        "Ведется разработка": "💻", "На уточнении у клиента": "📝", "Тестируем": "🧪",
        "Тестирует клиент": "👀", "На доработке": "🔧", "Ожидаем оплату": "💸",
        "Успешно завершен": "🏆", "Закрыт": "🏁", "Неудачно завершён": "❌", "Удаленные": "🗑️"
    };
    
    const approvalOptions = ["Одобрено", "Не одобрено", "Ожидает"]; 
    const sourceOptions = ["Все", "СРМ", "Таблица"]; 

    const [allLogEntries, setAllLogEntries] = useState([]); 
    const [displayedLogEntries, setDisplayedLogEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]); 

    const [filterData, setFilterData] = useState({
        searchStatus: [], 
        searchOrderNumber: "", 
        searchExecutor: [], 
        searchRole: [], 
        searchWorkDate: "", 
        searchWorkDone: "", 
        searchAdminApproved: [], 
        searchSource: "Все", 
    });

    const toText = (value) => String(value ?? "").trim();

    const buildJournalEntriesFromOrders = (ordersList = []) => {
        const entries = [];
        ordersList.forEach((order) => {
            const workLog =
                order?.workLog ??
                order?.work_log ??
                order?.meta?.workLog ??
                order?.meta?.work_log ??
                order?.meta?.worklog ??
                [];
            if (!Array.isArray(workLog)) return;
            const orderNumber = order.orderSequence ?? order.numberOrder ?? order.id;
            workLog.forEach((entry, idx) => {
                entries.push({
                    id: entry?.id ?? entry?.original_id ?? `${order.id}-${idx}`,
                    orderId: order.id,
                    orderNumber,
                    status: toText(order.orderStatus ?? order.stage ?? ""),
                    adminApproved: toText(entry?.adminApproved ?? "Ожидает"),
                    source: toText(entry?.source ?? "СРМ"),
                    description: toText(entry?.description ?? order.orderDescription ?? ""),
                    executorRole: toText(entry?.executorRole ?? entry?.role ?? entry?.performer ?? ""),
                    role: toText(entry?.role ?? entry?.executorRole ?? ""),
                    workDate: toText(entry?.workDate ?? entry?.work_date ?? entry?.date ?? ""),
                    workDone: toText(entry?.workDone ?? entry?.description ?? ""),
                    startTime: toText(entry?.startTime ?? entry?.start_time ?? ""),
                    endTime: toText(entry?.endTime ?? entry?.end_time ?? ""),
                    hours: toText(entry?.hours ?? entry?.time ?? entry?.spentHours ?? ""),
                    email: toText(entry?.email ?? ""),
                });
            });
        });
        return entries;
    };

    const computeRoles = (entries) => {
        const roles = new Set();
        entries.forEach((entry) => {
            if (entry.executorRole) roles.add(entry.executorRole);
            if (entry.role) roles.add(entry.role);
        });
        return Array.from(roles).sort();
    };

    // --- Загрузка данных ---
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                const [ordersRes, employeesRes] = await Promise.all([
                    fetchOrders({ page: 1, limit: 1000 }),
                    fetchEmployees(),
                ]);
                const list = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
                const entries = buildJournalEntriesFromOrders(list);
                if (!mounted) return;
                setOrders(list);
                setEmployees(employeesRes || []);
                setAllLogEntries(entries);
                setDisplayedLogEntries(entries);
                setAvailableRoles(computeRoles(entries));
            } catch (error) {
                console.error("Ошибка загрузки журнала из БД:", error);
                if (!mounted) return;
                setOrders([]);
                setEmployees([]);
                setAllLogEntries([]);
                setDisplayedLogEntries([]);
                setAvailableRoles([]);
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const applyFilters = () => {
        const {
            searchStatus,
            searchOrderNumber,
            searchExecutor,
            searchRole,
            searchWorkDate,
            searchWorkDone,
            searchAdminApproved,
            searchSource,
        } = filterData;

        let filtered = allLogEntries.filter(entry => {
            const matchesStatus = searchStatus.length === 0 || searchStatus.includes(entry.status);

            const matchesOrderNumber = searchOrderNumber ?
                String(entry.orderNumber).toLowerCase().includes(searchOrderNumber.toLowerCase()) :
                true;

            const matchesExecutor = searchExecutor.length === 0 || searchExecutor.includes(entry.executorRole);

            const matchesRole = searchRole.length === 0 || searchRole.includes(entry.role || entry.executorRole); 

            const matchesWorkDate = searchWorkDate ?
                entry.workDate.toLowerCase().includes(searchWorkDate.toLowerCase()) :
                true;

            const matchesWorkDone = searchWorkDone ?
                entry.workDone.toLowerCase().includes(searchWorkDone.toLowerCase()) :
                true;

            const matchesAdminApproved = searchAdminApproved.length === 0 || searchAdminApproved.includes(entry.adminApproved);

            const matchesSource = searchSource === "Все" || entry.source === searchSource;

            return matchesStatus && matchesOrderNumber && matchesExecutor && matchesRole &&
                   matchesWorkDate && matchesWorkDone && matchesAdminApproved && matchesSource;
        });
        setDisplayedLogEntries(filtered);
    };

    const handleResetSearch = () => {
        setFilterData({
            searchStatus: [],
            searchOrderNumber: "",
            searchExecutor: [],
            searchRole: [],
            searchWorkDate: "",
            searchWorkDone: "",
            searchAdminApproved: [],
            searchSource: "Все",
        });
        setDisplayedLogEntries(allLogEntries); 
    };

    const employeeNames = useMemo(() => employees.map(emp => emp.fullName), [employees]);

    const activeFiltersCount = Object.values(filterData).filter(
        value => (Array.isArray(value) ? value.length > 0 : value !== "" && value !== "Все")
    ).length;
    const mainSearchPlaceholder = activeFiltersCount > 0
        ? `Активно ${activeFiltersCount} фильтров...`
        : "Используйте расширенный поиск";


    const handleRowClick = (entry) => setSelectedEntry(entry);
    const handleCloseDetails = () => setSelectedEntry(null);

    const handleAddLogEntry = async (newEntry) => {
        const orderId = String(newEntry.orderNumber || "");
        const targetOrder = orders.find((order) => String(order.id) === orderId);
        if (!targetOrder) return;

        const workLog = Array.isArray(targetOrder.workLog) ? targetOrder.workLog.slice() : [];
        const nextEntry = {
            id: Date.now(),
            description: newEntry.description || "",
            executorRole: newEntry.executorRole || "",
            role: newEntry.executorRole || "",
            workDate: newEntry.workDate || "",
            startTime: newEntry.startTime || "",
            endTime: newEntry.endTime || "",
            hours: newEntry.hours || "",
            workDone: newEntry.workDone || "",
            email: newEntry.email || "",
        };
        const updatedWorkLog = [nextEntry, ...workLog];
        try {
            await updateOrder(targetOrder.id, { workLog: updatedWorkLog });
            const nextOrders = orders.map((order) =>
                String(order.id) === String(targetOrder.id)
                    ? { ...order, workLog: updatedWorkLog }
                    : order
            );
            const entries = buildJournalEntriesFromOrders(nextOrders);
            setOrders(nextOrders);
            setAllLogEntries(entries);
            setDisplayedLogEntries(entries);
            setAvailableRoles(computeRoles(entries));
            setShowAddForm(false);
        } catch (error) {
            console.error("Ошибка сохранения записи журнала:", error);
        }
    };

    const handleUpdateLogEntry = async (updatedEntry) => {
        const orderId = String(updatedEntry.orderNumber || updatedEntry.orderId || "");
        const targetOrder = orders.find((order) => String(order.id) === orderId);
        if (!targetOrder) return;

        const workLog = Array.isArray(targetOrder.workLog) ? targetOrder.workLog.slice() : [];
        const updatedWorkLog = workLog.map((entry) =>
            String(entry.id ?? entry.original_id) === String(updatedEntry.id)
                ? {
                      ...entry,
                      description: updatedEntry.description || entry.description,
                      executorRole: updatedEntry.executorRole || entry.executorRole,
                      role: updatedEntry.role || entry.role,
                      workDate: updatedEntry.workDate || entry.workDate,
                      startTime: updatedEntry.startTime || entry.startTime,
                      endTime: updatedEntry.endTime || entry.endTime,
                      hours: updatedEntry.hours || entry.hours,
                      workDone: updatedEntry.workDone || entry.workDone,
                      email: updatedEntry.email || entry.email,
                  }
                : entry
        );

        try {
            await updateOrder(targetOrder.id, { workLog: updatedWorkLog });
            const nextOrders = orders.map((order) =>
                String(order.id) === String(targetOrder.id)
                    ? { ...order, workLog: updatedWorkLog }
                    : order
            );
            const entries = buildJournalEntriesFromOrders(nextOrders);
            setOrders(nextOrders);
            setAllLogEntries(entries);
            setDisplayedLogEntries(entries);
            setAvailableRoles(computeRoles(entries));
            setSelectedEntry(null);
        } catch (error) {
            console.error("Ошибка обновления записи журнала:", error);
        }
    };

    const handleDeleteLogEntry = async (idToDelete) => {
        const ownerOrder = orders.find((order) => {
            const workLog = Array.isArray(order.workLog) ? order.workLog : [];
            return workLog.some((entry) => String(entry.id ?? entry.original_id) === String(idToDelete));
        });
        if (!ownerOrder) return;
        const updatedWorkLog = (ownerOrder.workLog || []).filter(
            (entry) => String(entry.id ?? entry.original_id) !== String(idToDelete)
        );
        try {
            await updateOrder(ownerOrder.id, { workLog: updatedWorkLog });
            const nextOrders = orders.map((order) =>
                String(order.id) === String(ownerOrder.id)
                    ? { ...order, workLog: updatedWorkLog }
                    : order
            );
            const entries = buildJournalEntriesFromOrders(nextOrders);
            setOrders(nextOrders);
            setAllLogEntries(entries);
            setDisplayedLogEntries(entries);
            setAvailableRoles(computeRoles(entries));
            setSelectedEntry(null);
        } catch (error) {
            console.error("Ошибка удаления записи журнала:", error);
        }
    };

    const handleDuplicateLogEntry = async (entryToDuplicate) => {
        const orderId = String(entryToDuplicate.orderNumber || entryToDuplicate.orderId || "");
        const targetOrder = orders.find((order) => String(order.id) === orderId);
        if (!targetOrder) return;
        const workLog = Array.isArray(targetOrder.workLog) ? targetOrder.workLog.slice() : [];
        const clone = { ...entryToDuplicate, id: Date.now() };
        const updatedWorkLog = [clone, ...workLog];
        try {
            await updateOrder(targetOrder.id, { workLog: updatedWorkLog });
            const nextOrders = orders.map((order) =>
                String(order.id) === String(targetOrder.id)
                    ? { ...order, workLog: updatedWorkLog }
                    : order
            );
            const entries = buildJournalEntriesFromOrders(nextOrders);
            setOrders(nextOrders);
            setAllLogEntries(entries);
            setDisplayedLogEntries(entries);
            setAvailableRoles(computeRoles(entries));
        } catch (error) {
            console.error("Ошибка дублирования записи журнала:", error);
        }
    };

    return (
        <div className="journal-page">
            <Sidebar />
            <div className="journal-page-main-container">
                <header className="journal-header-container">
                    <PageHeaderIcon pageName="Журнал" />
                    <h1 className="journal-title">Журнал</h1>
                    <div className="search-container">
                        <div className="main-search-bar">
                            <span className="search-icon"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg></span>
                            <input
                                type="text"
                                placeholder={mainSearchPlaceholder}
                                className="main-search-input"
                                readOnly 
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            />
                            <span
                                className="toggle-advanced-search"
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            >
                                {showAdvancedSearch ? "▲" : "▼"}
                            </span>
                        </div>

                        {showAdvancedSearch && (
                            <div className="advanced-search-fields">
                                <MultiSelectDropdown
                                    label="Статус"
                                    name="searchStatus"
                                    options={orderStatuses}
                                    selectedValues={filterData.searchStatus}
                                    onChange={handleFilterChange}
                                />
                                <SimpleSearchInput
                                    label="Номер заказа"
                                    name="searchOrderNumber"
                                    value={filterData.searchOrderNumber}
                                    onChange={handleFilterChange}
                                    placeholder="Укажите номер заказа"
                                />
                                <MultiSelectDropdown
                                    label="Исполнитель"
                                    name="searchExecutor"
                                    options={employeeNames}
                                    selectedValues={filterData.searchExecutor}
                                    onChange={handleFilterChange}
                                />
                                <MultiSelectDropdown
                                    label="Роль"
                                    name="searchRole"
                                    options={availableRoles}
                                    selectedValues={filterData.searchRole}
                                    onChange={handleFilterChange}
                                />
                                <SimpleSearchInput
                                    label="Дата работы"
                                    name="searchWorkDate"
                                    value={filterData.searchWorkDate}
                                    onChange={handleFilterChange}
                                    placeholder="Укажите день (YYYY-MM-DD)"
                                    type="date"
                                />
                                <SimpleSearchInput
                                    label="Что было сделано?"
                                    name="searchWorkDone"
                                    value={filterData.searchWorkDone}
                                    onChange={handleFilterChange}
                                    placeholder="Укажите слова"
                                />
                                <MultiSelectDropdown
                                    label="Одобрено администратором"
                                    name="searchAdminApproved"
                                    options={approvalOptions}
                                    selectedValues={filterData.searchAdminApproved}
                                    onChange={handleFilterChange}
                                />
                                <div className="search-field-group">
                                    <label>Источник отчёта</label>
                                    <select
                                        name="searchSource"
                                        value={filterData.searchSource}
                                        onChange={handleFilterChange}
                                    >
                                        {sourceOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="search-buttons">
                                    <button type="button" className="reset-button" onClick={handleResetSearch}>Сбросить</button>
                                    <button type="button" className="search-button" onClick={applyFilters}>Поиск</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="add-entry-button-wrapper">
                        <button className="add-entry-button" onClick={() => setShowAddForm(true)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>  Добавить запись
                        </button>
                    </div>
                </header>

                <div className="journal-table-container">
                    <table className="journal-table">
                        <thead>
                            <tr>
                                <th>Ст </th>
                                <th>№</th>
                                <th>Описание</th>
                                <th>Исполнитель</th>
                                <th>Дата</th>
                                <th>Начало</th>
                                <th>Конец</th>
                                <th>Часы</th>
                                <th>Что было сделано?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedLogEntries.map((entry) => (
                                <tr key={entry.id} onClick={() => handleRowClick(entry)} className="journal-table-row">
                                    <td className="status-cell" title={entry.status}>
                                        {statusToEmojiMap[entry.status] || entry.status}
                                    </td>
                                    <td>{entry.orderNumber}</td>
                                    <td>{entry.description}</td>
                                    
                                    <td>{entry.executorRole}</td>
                                    <td><FormattedDate dateString={entry.workDate}/></td>
                                    <td>{entry.startTime}</td>
                                    <td>{entry.endTime}</td>
                                    <td>{entry.hours}</td>
                                    <td>{entry.workDone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEntry && (
                <LogEntryDetails
                    entry={selectedEntry}
                    onClose={handleCloseDetails}
                    onDelete={handleDeleteLogEntry}
                    onDuplicate={handleDuplicateLogEntry}
                    onUpdate={handleUpdateLogEntry}
                    orderStatuses={orderStatuses}
                    employees={employees}
                    orders={orders}
                />
            )}

            {showAddForm && (
                <AddLogEntryForm
                    onAdd={handleAddLogEntry}
                    onClose={() => setShowAddForm(false)}
                    orderStatuses={orderStatuses}
                    employees={employees}
                    orders={orders}
                />
            )}
        </div>
    );
};

export default JournalPage;
