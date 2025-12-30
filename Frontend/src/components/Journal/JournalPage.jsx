import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../Sidebar";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import MassActionBar from './MassActionBar.jsx';
import MultiSelectCheckboxDropdown from './MultiSelectCheckboxDropdown.jsx';
import "./JournalPage.css";
import LogEntryDetails from "./LogEntryDetail";
import AddLogEntryForm from "./AddLogEntryForm";
import { formatDate, formatTime } from "./formatUtils";

import {
    getLogEntries,
    addLogEntry,
    updateLogEntry,
    deleteLogEntry,
    getEmployees,
    getOrders,
    getAvailableRoles,
} from "./journalApi";

const COLUMNS = [
    { key: 'orderNumber', label: '№', filterKey: 'searchOrderNumber' },
    { key: 'status', label: 'Ст', filterKey: 'searchStatus' },
    { key: 'description', label: 'Описание' },
    { key: 'executorRole', label: 'Исполнитель', filterKey: 'searchExecutor' },
    { key: 'role', label: 'Роль', filterKey: 'searchRole' },
    { key: 'workDate', label: 'Дата', filterKey: 'searchWorkDate' },
    { key: 'startTime', label: 'Начало' },
    { key: 'endTime', label: 'Конец' },
    { key: 'hours', label: 'Часы' },
    { key: 'workDone', label: 'Что было сделано?' },
    { key: 'adminApproved', label: 'Одобрено', filterKey: 'searchAdminApproved' },
    { key: 'payDay', label: 'Зарплата' },
    { key: 'totalHours', label: 'Итоги часы' },
    { key: 'points', label: 'Баллы' },
    { key: 'payLost', label: 'Потери ЗП' },
    { key: 'trackerHours', label: 'Часы трекер' },
    { key: 'type', label: 'Тип' },
    { key: 'project', label: 'Проект' },
    { key: 'workCategory', label: 'Категория работ' },
    { key: 'task', label: 'Задача' },
    { key: 'workDoneGPT', label: 'Что было сделано (GPT)' },
];

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
        "Ведется разработка": "💻", "На уточнении у клиента": "📋", "Тестируем": "🧪",
        "Тестирует клиент": "👀", "На доработке": "🔧", "Ожидаем оплату": "💸",
        "Успешно завершен": "🏆", "Закрыт": "🔒", "Неудачно завершён": "❌", "Удаленные": "🗑️"
    };

    const [allLogEntries, setAllLogEntries] = useState([]); 
    const [displayedLogEntries, setDisplayedLogEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [expandedRows, setExpandedRows] = useState(false);
    const availableRoles = useMemo(() => getAvailableRoles(), []);  
    const [quickFilterMode, setQuickFilterMode] = useState(false);
    const searchContainerRef = useRef(null);

    const [filterData, setFilterData] = useState({
        searchStatus: [], 
        searchOrderNumber: [], 
        searchExecutor: [], 
        searchRole: [], 
        searchWorkDate: [], 
        searchWorkDone: "", 
        searchAdminApproved: [], 
        searchSource: [], 
    });

    const [tempFilterData, setTempFilterData] = useState({
        searchStatus: [], 
        searchOrderNumber: [], 
        searchExecutor: [], 
        searchRole: [], 
        searchWorkDate: [], 
        searchWorkDone: "", 
        searchAdminApproved: [], 
        searchSource: [], 
    });

    const [isMassEditMode, setIsMassEditMode] = useState(false);
    const [selectedEntries, setSelectedEntries] = useState([]);

    const toggleMassEditMode = () => {
        setIsMassEditMode(prev => !prev);
        setSelectedEntries([]);
    };

    const handleSelectEntry = (id) => {
        setSelectedEntries(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = displayedLogEntries.map(entry => entry.id);
            setSelectedEntries(allIds);
        } else {
            setSelectedEntries([]);
        }
    };

    const loadData = () => {
        const entries = getLogEntries();
        setAllLogEntries(entries);
        setDisplayedLogEntries(entries); 
        setEmployees(getEmployees());
        setOrders(getOrders());
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                setQuickFilterMode(true);
            }
        };

        const handleKeyUp = (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                setQuickFilterMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowAdvancedSearch(false);
            }
        };

        if (showAdvancedSearch) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAdvancedSearch]);

    const getActiveOrders = () => {
        const activeStatuses = [
            "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
            "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
            "На уточнении у клиента", "Тестируем", "Тестирует клиент",
            "На доработке", "Ожидаем оплату"
        ];

        const normalizedOrders = orders.map(order => ({
            orderNumber: order.orderNumber || order.id || "",
            description: order.description || order.orderDescription || order.name || "",
            status: order.status || order.stage || "",
        }));

        return normalizedOrders.filter(order => 
            activeStatuses.includes(order.status)
        );
    };

    const activeOrders = useMemo(() => getActiveOrders(), [orders]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setTempFilterData(prevData => ({
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
            const matchesOrderNumber = searchOrderNumber.length === 0 ||
                searchOrderNumber.includes(String(entry.orderNumber));
            const matchesExecutor = searchExecutor.length === 0 || searchExecutor.includes(entry.executorRole);
            const matchesRole = searchRole.length === 0 || searchRole.includes(entry.role);
            const matchesWorkDate = searchWorkDate.length === 0 || searchWorkDate.includes(entry.workDate);
            const matchesWorkDone = searchWorkDone ?
                entry.workDone.toLowerCase().includes(searchWorkDone.toLowerCase()) : true;
            const matchesAdminApproved = searchAdminApproved.length === 0 || searchAdminApproved.includes(entry.adminApproved);
            const matchesSource = searchSource.length === 0 || searchSource.includes(entry.source);

            return matchesStatus && matchesOrderNumber && matchesExecutor && matchesRole &&
                matchesWorkDate && matchesWorkDone && matchesAdminApproved && matchesSource;
        });
        setDisplayedLogEntries(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [filterData, allLogEntries]);

    const handleApplyFilters = () => {
        setFilterData(tempFilterData);
        setShowAdvancedSearch(false);
    };

    const handleCancelFilters = () => {
        setTempFilterData(filterData);
        setShowAdvancedSearch(false);
    };

    const handleQuickFilter = (columnKey, value) => {
        
        const filterKey = COLUMNS.find(c => c.key === columnKey)?.filterKey;
        if (!filterKey) return;

        setFilterData(prev => {
            const currentValues = prev[filterKey];
            let newValues;
            
            if (Array.isArray(currentValues)) {
                if (currentValues.includes(value)) {
                    newValues = currentValues.filter(v => v !== value);
                } else {
                    newValues = [...currentValues, value];
                }
            } else {
                newValues = value;
            }
            
            return { ...prev, [filterKey]: newValues };
        });

        setTempFilterData(prev => {
            const currentValues = prev[filterKey];
            let newValues;
            
            if (Array.isArray(currentValues)) {
                if (currentValues.includes(value)) {
                    newValues = currentValues.filter(v => v !== value);
                } else {
                    newValues = [...currentValues, value];
                }
            } else {
                newValues = value;
            }
            
            return { ...prev, [filterKey]: newValues };
        });
    };

    const handleResetSearch = () => {
        const emptyFilters = {
            searchStatus: [],
            searchOrderNumber: [],
            searchExecutor: [],
            searchRole: [],
            searchWorkDate: [],
            searchWorkDone: "",
            searchAdminApproved: [],
            searchSource: [],
        };
        setTempFilterData(emptyFilters);
        setFilterData(emptyFilters);
    };

    const activeFiltersCount = Object.values(filterData).filter(
        value => (Array.isArray(value) ? value.length > 0 : value !== "")
    ).length;
    const mainSearchPlaceholder = activeFiltersCount > 0
        ? `Активно ${activeFiltersCount} фильтров...`
        : "Используйте расширенный поиск";

    const handleRowClick = (entry) => setSelectedEntry(entry);
    const handleCloseDetails = () => setSelectedEntry(null);

    const handleAddLogEntry = (newEntry) => {
        const updatedEntries = addLogEntry(newEntry);
        setAllLogEntries(updatedEntries);
        setShowAddForm(false);
    };

    const handleUpdateLogEntry = (updatedEntry) => {
        const updatedEntries = updateLogEntry(updatedEntry);
        setAllLogEntries(updatedEntries);
        setSelectedEntry(null);
    };

    const handleDeleteLogEntry = (idToDelete) => {
        const updatedEntries = deleteLogEntry(idToDelete);
        setAllLogEntries(updatedEntries);
        setSelectedEntry(null);
    };

    const handleDuplicateLogEntry = (entryToDuplicate) => {
        const duplicatedData = {
            ...entryToDuplicate,
            description: `${entryToDuplicate.description} (Копи)`,
        };
        delete duplicatedData.id;

        const updatedEntries = addLogEntry(duplicatedData);
        setAllLogEntries(updatedEntries);
    };

    const handleMassUpdate = (field, value) => {
        const entriesToUpdate = allLogEntries.map(entry => {
            if (selectedEntries.includes(entry.id)) {
                return { ...entry, [field]: value };
            }
            return entry;
        });
        
        entriesToUpdate.forEach(entry => {
            if (selectedEntries.includes(entry.id)) {
                updateLogEntry(entry);
            }
        });
        
        setAllLogEntries(entriesToUpdate);
    };

    const handleMassDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить ${selectedEntries.length} записей?`)) {
            selectedEntries.forEach(id => deleteLogEntry(id));
            const updatedEntries = getLogEntries();
            setAllLogEntries(updatedEntries);
            setSelectedEntries([]);
        }
    };

    const handleCellClick = (entry, columnKey, value) => (e) => {
        if (isMassEditMode) return;

        if (e.target.closest('.prevent-row-click')) return;

        const column = COLUMNS.find(c => c.key === columnKey);
        const hasQuickFilter = column && column.filterKey;

        if (hasQuickFilter) {
            if (e.ctrlKey || e.altKey) {
                e.stopPropagation();
                handleQuickFilter(columnKey, value);
            } else {
                e.stopPropagation();
                handleRowClick(entry);
            }
        } else {
            e.stopPropagation();
            handleRowClick(entry);
        }
    };

    const uniqueStatuses = useMemo(() => {
        const statuses = activeOrders
            .map(order => order.status)
            .filter(Boolean);
        return [...new Set(statuses)];
    }, [activeOrders]);

    const uniqueOrderNumbers = useMemo(() => {
        const orderNumbers = activeOrders
            .map(order => String(order.orderNumber))
            .filter(Boolean);
        return [...new Set(orderNumbers)];
    }, [activeOrders]);

    const uniqueExecutors = useMemo(() => {
        return employees
            .map(emp => emp.fullName || emp.name)
            .filter(Boolean);
    }, [employees]);

    const uniqueWorkDates = useMemo(() => {
        const dates = allLogEntries
            .map(entry => entry.workDate)
            .filter(Boolean);
        return [...new Set(dates)].sort();
    }, [allLogEntries]);

    const parseHoursToMinutes = (hoursStr) => {
        if (!hoursStr && hoursStr !== 0) return 0;
        const s = String(hoursStr).trim();
        if (s.includes(':')) {
            const [h, m] = s.split(':').map(part => parseInt(part, 10) || 0);
            return h * 60 + m;
        }
        const num = parseFloat(s.replace(',', '.'));
        if (isNaN(num)) return 0;
        return Math.round(num * 60);
    };

    const formatMinutesToHMM = (minutes) => {
        if (!minutes && minutes !== 0) return "00:00";
        const m = Number(minutes);
        const sign = m < 0 ? '-' : '';
        const abs = Math.abs(m);
        const h = Math.floor(abs / 60);
        const mm = abs % 60;
        const hh = String(h).padStart(2, '0');
        return `${sign}${hh}:${String(mm).padStart(2, '0')}`;
    };


    const calculatePointsAndPenalty = (workDate, startTime, createdAt = new Date()) => {
        if (!workDate || !startTime) {
            return { points: 0, penalty: 0, coefficient: 1 };
        }

        try {
            const [year, month, day] = workDate.split('-').map(Number);
            const [hours, minutes] = startTime.split(':').map(Number);
            const workDateTime = new Date(year, month - 1, day, hours, minutes);
            
            const diffMs = createdAt - workDateTime;
            const diffHours = diffMs / (1000 * 60 * 60);

            let points = 0;
            let penalty = 0;
            let coefficient = 1;

            if (diffHours <= 24) {
                points = 1;
                coefficient = 1;
            } else if (diffHours <= 48) {
                points = 0;
                coefficient = 1;
            } else if (diffHours <= 72) {
                penalty = 0.5;
                coefficient = 0.75; 
            } else {
                penalty = 1;
                coefficient = 0.5;
            }

            return { points, penalty, coefficient };
        } catch (error) {
            console.error('Ошибка при расчете баллов:', error);
            return { points: 0, penalty: 0, coefficient: 1 };
        }
    };

    const calculateDisplayTime = (entry) => {
        const approval = entry.adminApproved;
        
        let baseTime = "00:00";
        
        if (approval === "Время трекера") {
            baseTime = entry.trackerHours || "00:00";
        } else if (approval === "Корректировка администратором" && entry.correctionTime) {
            baseTime = entry.correctionTime;
        } else {
            baseTime = entry.hours || "00:00";
        }

        const { coefficient } = calculatePointsAndPenalty(
            entry.workDate, 
            entry.startTime, 
            entry.createdAt ? new Date(entry.createdAt) : new Date()
        );

        const minutes = parseHoursToMinutes(baseTime);
        const adjustedMinutes = Math.round(minutes * coefficient);

        const roundedMinutes = Math.round(adjustedMinutes / 5) * 5;
        
        return formatMinutesToHMM(roundedMinutes);
    };

    const totalMinutesByOrderAndExecutorGlobal = useMemo(() => {
        const totals = {};
        displayedLogEntries.forEach(entry => { 
            const orderKey = entry.orderId || entry.orderNumber || '';
            const executor = entry.executorRole || '';
            const key = `${orderKey}_${executor}`; 
            
            const displayTime = calculateDisplayTime(entry);
            const minutes = parseHoursToMinutes(displayTime); 
            
            totals[key] = (totals[key] || 0) + minutes;
        });
        return totals;
    }, [displayedLogEntries]);

    const adminApprovalOptions = [
        "Ожидает",
        "Принято",
        "Время трекера",
        "Время журнала",
        "Корректировка администратором"
    ];

    const sourceOptions = ["СРМ", "Таблица"];

    const groupedEntries = displayedLogEntries.reduce((acc, entry) => {
        const date = entry.workDate || "Без даты";
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {});

    return (
        <div className="journal-page">
            <Sidebar />
            <div className="journal-page-main-container">
                <header className="journal-header-container">
                    <PageHeaderIcon pageName="Журнал" />
                    <h1 className="journal-page-title">Журнал</h1>

                    <div className="journal-search-container" ref={searchContainerRef}>
                        <div className="journal-main-search-bar">
                            <span className="journal-search-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder={mainSearchPlaceholder}
                                className="journal-main-search-input"
                                readOnly 
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            />
                            <span
                                className="journal-toggle-advanced-search"
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            >
                                {showAdvancedSearch ? "▲" : "▼"}
                            </span>
                        </div>

                        {showAdvancedSearch && (
                            <div className="journal-advanced-search-fields">
                                <MultiSelectCheckboxDropdown
                                    label="Статус"
                                    name="searchStatus"
                                    options={uniqueStatuses}
                                    selectedValues={tempFilterData.searchStatus}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите статус"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Номер заказа"
                                    name="searchOrderNumber"
                                    options={uniqueOrderNumbers}
                                    selectedValues={tempFilterData.searchOrderNumber}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите номер заказа"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Исполнитель"
                                    name="searchExecutor"
                                    options={uniqueExecutors}
                                    selectedValues={tempFilterData.searchExecutor}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите исполнителя"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Роль"
                                    name="searchRole"
                                    options={availableRoles}
                                    selectedValues={tempFilterData.searchRole}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите роль"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Дата"
                                    name="searchWorkDate"
                                    options={uniqueWorkDates}
                                    selectedValues={tempFilterData.searchWorkDate}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите дату"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Одобрено администратором"
                                    name="searchAdminApproved"
                                    options={adminApprovalOptions}
                                    selectedValues={tempFilterData.searchAdminApproved}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите статус одобрения"
                                />

                                <MultiSelectCheckboxDropdown
                                    label="Источник отчёта"
                                    name="searchSource"
                                    options={sourceOptions}
                                    selectedValues={tempFilterData.searchSource}
                                    onChange={handleFilterChange}
                                    placeholder="Выберите источник"
                                />

                                <div className="journal-search-buttons">
                                    <button type="button" className="journal-reset-button" onClick={handleResetSearch}>
                                        Сбросить фильтры
                                    </button>
                                    <button type="button" className="journal-cancel-button" onClick={handleCancelFilters}>
                                        Отмена
                                    </button>
                                    <button type="button" className="journal-search-button" onClick={handleApplyFilters}>
                                        Фильтровать
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="journal-view-toggle-buttons">
                        <button 
                            className={`journal-view-toggle-btn-single ${expandedRows ? 'active' : ''}`}
                            onClick={() => setExpandedRows(!expandedRows)}
                            title={expandedRows ? "Компактный вид" : "Расширенный вид"}
                        >
                            {expandedRows ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="4" rx="1"/>
                                    <rect x="3" y="10" width="18" height="4" rx="1"/>
                                    <rect x="3" y="17" width="18" height="4" rx="1"/>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="6" rx="1"/>
                                    <rect x="3" y="12" width="18" height="6" rx="1"/>
                                </svg>
                            )}
                        </button>
                    </div>
                    <button className="journal-mass-action-button" onClick={toggleMassEditMode}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                    
                    <div className="journal-add-entry-button-wrapper">
                        <button className="journal-add-entry-button" onClick={() => setShowAddForm(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>  Добавить
                        </button>
                    </div>
                </header>
                
                {isMassEditMode && selectedEntries.length > 0 && (
                    <MassActionBar
                        selectedCount={selectedEntries.length}
                        onClose={() => { setIsMassEditMode(false); setSelectedEntries([]); }}
                        employees={employees}
                        availableRoles={availableRoles}
                        onMassUpdate={handleMassUpdate}
                        onMassDelete={handleMassDelete}
                    />
                )}

                <div className="journal-table-container">
                    <table className={`journal-table ${expandedRows ? 'expanded-rows' : ''} ${isMassEditMode ? 'mass-mode' : ''}`}>
                        <thead>
                            <tr>
                                {isMassEditMode && (
                                    <th className="journal-checkbox-cell journal-sticky-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={displayedLogEntries.length > 0 && displayedLogEntries.every(e => selectedEntries.includes(e.id))}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                {COLUMNS.map((column) => (
                                    <th key={column.key}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedEntries).map(([date, entries]) => {
                                return (
                                <React.Fragment key={date}>
                                    <tr className="journal-date-separator-row">
                                    <td
                                        colSpan={isMassEditMode ? COLUMNS.length + 1 : COLUMNS.length}
                                        className="journal-date-separator-cell"
                                    >
                                        <span className="journal-date-chip">{formatDate(date)}</span>
                                    </td>
                                    </tr>

                                    {entries.map(entry => {
                                        const key = `${entry.orderId || entry.orderNumber || ''}_${entry.executorRole || ''}`;
                                        const totalMinutes = totalMinutesByOrderAndExecutorGlobal[key] || 0;
                                        const totalHoursFormatted = formatMinutesToHMM(totalMinutes);
                                        
                                        const { points, penalty, coefficient } = calculatePointsAndPenalty(
                                            entry.workDate,
                                            entry.startTime,
                                            entry.createdAt ? new Date(entry.createdAt) : new Date()
                                        );
                                        
                                        const displayTime = calculateDisplayTime(entry);
                                        
                                        const pointsDisplay = points > 0 ? `+${points}` : penalty > 0 ? `-${penalty}` : '0';


                                    return (
                                        <tr
                                        key={entry.id}
                                        className="journal-data-row"
                                        onClick={(e) => {
                                            if (!isMassEditMode && !e.target.closest('.prevent-row-click')) {
                                            handleRowClick(entry);
                                            }
                                        }}
                                        >
                                        {isMassEditMode && (
                                            <td
                                            className="journal-checkbox-cell journal-sticky-checkbox prevent-row-click"
                                            onClick={(e) => e.stopPropagation()}
                                            >
                                            <input
                                                type="checkbox"
                                                checked={selectedEntries.includes(entry.id)}
                                                onChange={() => handleSelectEntry(entry.id)}
                                                className="row-checkbox"
                                            />
                                            </td>
                                        )}

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'orderNumber', String(entry.orderNumber))}
                                        >
                                            <div className="cell-content">{entry.orderNumber}</div>
                                        </td>

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'status', entry.status)}
                                        >
                                            <div className="cell-content">{statusToEmojiMap[entry.status] || entry.status}</div>
                                        </td>

                                        <td><div className="cell-content">{entry.description}</div></td>

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'executorRole', entry.executorRole)}
                                        >
                                            <div className="cell-content">{entry.executorRole}</div>
                                        </td>

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'role', entry.role)}
                                        >
                                            <div className="cell-content">{entry.role}</div>
                                        </td>

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'workDate', entry.workDate)}
                                        >
                                            <div className="cell-content">{formatDate(entry.workDate)}</div>
                                        </td>

                                        <td><div className="cell-content">{formatTime(entry.startTime)}</div></td>
                                        <td><div className="cell-content">{entry.endTime}</div></td>
                                        <td><div className="cell-content">{entry.hours}</div></td>
                                        <td><div className="cell-content">{entry.workDone}</div></td>

                                        <td
                                            className={quickFilterMode ? 'quick-filter-cell' : ''}
                                            onClick={handleCellClick(entry, 'adminApproved', entry.adminApproved)}
                                        >
                                            <div className="cell-content">{entry.adminApproved}</div>
                                        </td>

                                        {/* Зарплата */}
                                        <td><div className="cell-content">{entry.salary || "-"}</div></td>

                                        {/* Итоги часы */}
                                        <td><div className="cell-content">{displayTime}</div></td>

                                        {/* Баллы */}
                                        <td>
                                            <div className="cell-content" style={{ 
                                                color: points > 0 ? '#28a745' : penalty > 0 ? '#dc3545' : 'inherit' 
                                            }}>
                                                {pointsDisplay}
                                            </div>
                                        </td>

                                        {/* Потери ЗП */}
                                        <td><div className="cell-content">{coefficient < 1 ? `${Math.round((1 - coefficient) * 100)}%` : '-'}</div></td>

                                        {/* Часы трекер */}
                                        <td><div className="cell-content">00:00</div></td>

                                        {/* Тип */}
                                        <td><div className="cell-content">-</div></td>

                                        {/* Проект */}
                                        <td><div className="cell-content">-</div></td>

                                        {/* Категория работ */}
                                        <td><div className="cell-content">-</div></td>

                                        {/* Задача */}
                                        <td><div className="cell-content">-</div></td>

                                        {/* Что было сделано (GPT) */}
                                        <td><div className="cell-content">{entry.gptSummary || "-"}</div></td>
                                        </tr>
                                    );
                                    })}
                                </React.Fragment>
                                );
                            })}
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
                    availableRoles={availableRoles}
                    statusToEmojiMap={statusToEmojiMap}
                />
            )}

            {showAddForm && (
                <AddLogEntryForm
                    onAdd={handleAddLogEntry}
                    onClose={() => setShowAddForm(false)}
                    orderStatuses={orderStatuses}
                    employees={employees}
                    orders={orders}
                    availableRoles={availableRoles}
                    statusToEmojiMap={statusToEmojiMap}
                />
            )}
        </div>
    );
};

export default JournalPage;