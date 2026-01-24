import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../Sidebar";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import MassActionBar from "./MassActionBar.jsx";
import MultiSelectCheckboxDropdown from "./MultiSelectCheckboxDropdown.jsx";
import "./JournalPage.css";
import LogEntryDetails from "./LogEntryDetail";
import AddLogEntryForm from "./AddLogEntryForm";
import { formatDate, formatTime } from "./formatUtils";

import { fetchOrders, updateOrder } from "../../api/orders";
import { fetchEmployees } from "../../api/employees";

const COLUMNS = [
  { key: "orderNumber", label: "№", filterKey: "searchOrderNumber" },
  { key: "status", label: "Ст", filterKey: "searchStatus" },
  { key: "description", label: "Описание" },
  { key: "executorRole", label: "Исполнитель", filterKey: "searchExecutor" },
  { key: "role", label: "Роль", filterKey: "searchRole" },
  { key: "workDate", label: "Дата", filterKey: "searchWorkDate" },
  { key: "startTime", label: "Начало" },
  { key: "endTime", label: "Конец" },
  { key: "hours", label: "Часы" },
  { key: "workDone", label: "Что было сделано?" },
  { key: "adminApproved", label: "Одобрено", filterKey: "searchAdminApproved" },
  { key: "payDay", label: "Зарплата" },
  { key: "totalHours", label: "Итоги часы" },
  { key: "points", label: "Баллы" },
  { key: "payLost", label: "Потери ЗП" },
  { key: "trackerHours", label: "Часы трекер" },
  { key: "type", label: "Тип" },
  { key: "project", label: "Проект" },
  { key: "workCategory", label: "Категория работ" },
  { key: "task", label: "Задача" },
  { key: "workDoneGPT", label: "Что было сделано (GPT)" },
];

const defaultFilterData = {
  searchGlobal: "",
  searchStatus: [],
  searchOrderNumber: [],
  searchExecutor: [],
  searchRole: [],
  searchWorkDate: [],
  searchWorkDone: "",
  searchAdminApproved: [],
  searchSource: [],
};

const toText = (value) => String(value ?? "").trim();

const JournalPage = () => {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const orderStatuses = [
    "Лид",
    "Изучаем ТЗ",
    "Обсуждаем с клиентом",
    "Клиент думает",
    "Ожидаем предоплату",
    "Взяли в работу",
    "Ведется разработка",
    "На уточнении у клиента",
    "Тестируем",
    "Тестирует клиент",
    "На доработке",
    "Ожидаем оплату",
    "Успешно завершен",
    "Закрыт",
    "Неудачно завершён",
    "Удаленные",
  ];

  const statusToEmojiMap = {
    Лид: "🎯",
    "Изучаем ТЗ": "📄",
    "Обсуждаем с клиентом": "💬",
    "Клиент думает": "🤔",
    "Ожидаем предоплату": "💳",
    "Взяли в работу": "🚀",
    "Ведется разработка": "💻",
    "На уточнении у клиента": "📋",
    Тестируем: "🧪",
    "Тестирует клиент": "👀",
    "На доработке": "🔧",
    "Ожидаем оплату": "💸",
    "Успешно завершен": "🏆",
    Закрыт: "🔒",
    "Неудачно завершён": "❌",
    Удаленные: "🗑️",
  };

  const [allLogEntries, setAllLogEntries] = useState([]);
  const [displayedLogEntries, setDisplayedLogEntries] = useState([]);

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);

  const [expandedRows, setExpandedRows] = useState(false);
  const [quickFilterMode, setQuickFilterMode] = useState(false);
  const searchContainerRef = useRef(null);

  const [availableRoles, setAvailableRoles] = useState([]);

  const [isMassEditMode, setIsMassEditMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);

  /* ---------------- URL filters ---------------- */

  const parseFiltersFromURL = (params) => {
    const filters = { ...defaultFilterData };

    Object.keys(defaultFilterData).forEach((key) => {
      const value = params.get(key);
      if (!value) return;

      if (key === "searchWorkDone" || key === "searchGlobal") {
        filters[key] = value;
      } else {
        filters[key] = value.split(",").filter(Boolean);
      }
    });

    return filters;
  };

  const [filterData, setFilterData] = useState(() => parseFiltersFromURL(searchParams));
  const [tempFilterData, setTempFilterData] = useState(() => parseFiltersFromURL(searchParams));

  useEffect(() => {
    const filtersFromUrl = parseFiltersFromURL(searchParams);
    if (JSON.stringify(filtersFromUrl) !== JSON.stringify(filterData)) {
      setFilterData(filtersFromUrl);
      setTempFilterData(filtersFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateURLWithFilters = (newFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(","));
      } else if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  /* ---------------- Build entries from API orders ---------------- */

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

      const orderNumber = order?.orderSequence ?? order?.numberOrder ?? order?.id;

      workLog.forEach((entry, idx) => {
        entries.push({
          id: entry?.id ?? entry?.original_id ?? `${order.id}-${idx}`,
          orderId: order.id,
          orderNumber,

          status: toText(order?.orderStatus ?? order?.status ?? order?.stage ?? ""),
          adminApproved: toText(entry?.adminApproved ?? "Ожидает"),
          source: toText(entry?.source ?? "СРМ"),

          description: toText(entry?.description ?? order?.orderDescription ?? order?.description ?? ""),
          executorRole: toText(entry?.executorRole ?? entry?.performer ?? entry?.role ?? ""),
          role: toText(entry?.role ?? entry?.executorRole ?? ""),

          workDate: toText(entry?.workDate ?? entry?.work_date ?? entry?.date ?? ""),
          startTime: toText(entry?.startTime ?? entry?.start_time ?? ""),
          endTime: toText(entry?.endTime ?? entry?.end_time ?? ""),
          hours: toText(entry?.hours ?? entry?.time ?? entry?.spentHours ?? ""),

          workDone: toText(entry?.workDone ?? entry?.work_done ?? entry?.done ?? ""),
          email: toText(entry?.email ?? ""),
          createdAt: entry?.createdAt ?? entry?.created_at ?? null,

          // доп поля таблицы (если есть в данных)
          salary: entry?.salary ?? entry?.payDay ?? null,
          trackerHours: entry?.trackerHours ?? entry?.tracker_hours ?? "",
          correctionTime: entry?.correctionTime ?? entry?.correction_time ?? "",
          gptSummary: entry?.gptSummary ?? entry?.workDoneGPT ?? "",
          project: entry?.project ?? "",
          task: entry?.task ?? "",
          type: entry?.type ?? "",
          workCategory: entry?.workCategory ?? entry?.work_category ?? "",
        });
      });
    });
    return entries;
  };

  const computeRoles = (entries) => {
    const roles = new Set();
    entries.forEach((e) => {
      if (e?.executorRole) roles.add(e.executorRole);
      if (e?.role) roles.add(e.role);
    });
    return Array.from(roles).sort((a, b) => a.localeCompare(b));
  };

  /* ---------------- Load data ---------------- */

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
        setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
        setAllLogEntries(entries);
        setDisplayedLogEntries(entries);
        setAvailableRoles(computeRoles(entries));
      } catch (err) {
        console.error("Ошибка загрузки журнала из БД:", err);
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

  /* ---------------- UX helpers ---------------- */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) setQuickFilterMode(true);
    };
    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) setQuickFilterMode(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!event.target.classList.contains("journal-main-search-input")) {
          setShowAdvancedSearch(false);
        }
      }
    };
    if (showAdvancedSearch) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdvancedSearch]);

  /* ---------------- Active orders for dropdowns ---------------- */

  const activeOrders = useMemo(() => {
    const activeStatuses = [
      "Лид",
      "Изучаем ТЗ",
      "Обсуждаем с клиентом",
      "Клиент думает",
      "Ожидаем предоплату",
      "Взяли в работу",
      "Ведется разработка",
      "На уточнении у клиента",
      "Тестируем",
      "Тестирует клиент",
      "На доработке",
      "Ожидаем оплату",
    ];

    return (orders || [])
      .map((order) => ({
        id: order?.id ?? "",
        label: order?.orderSequence ?? order?.numberOrder ?? order?.orderNumber ?? order?.id ?? "",
        orderNumber: order?.orderNumber ?? order?.id ?? "",
        description: order?.description || order?.orderDescription || order?.name || "",
        status: order?.status || order?.stage || order?.orderStatus || "",
      }))
      .filter((o) => activeStatuses.includes(o.status));
  }, [orders]);

  /* ---------------- Filtering ---------------- */

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGlobalSearchChange = (e) => {
    const value = e.target.value;
    updateURLWithFilters({ ...filterData, searchGlobal: value });
  };

  const applyFilters = () => {
    const {
      searchGlobal,
      searchStatus,
      searchOrderNumber,
      searchExecutor,
      searchRole,
      searchWorkDate,
      searchWorkDone,
      searchAdminApproved,
      searchSource,
    } = filterData;

    const filtered = allLogEntries.filter((entry) => {
      let matchesGlobal = true;

      if (searchGlobal) {
        const searchLower = searchGlobal.toLowerCase();
        const formatted = formatDate(entry.workDate).toLowerCase();
        const rawDate = String(entry.workDate || "").toLowerCase();

        matchesGlobal =
          String(entry.orderNumber || "").toLowerCase().includes(searchLower) ||
          String(entry.description || "").toLowerCase().includes(searchLower) ||
          String(entry.executorRole || "").toLowerCase().includes(searchLower) ||
          String(entry.role || "").toLowerCase().includes(searchLower) ||
          String(entry.workDone || "").toLowerCase().includes(searchLower) ||
          String(entry.status || "").toLowerCase().includes(searchLower) ||
          String(entry.project || "").toLowerCase().includes(searchLower) ||
          String(entry.task || "").toLowerCase().includes(searchLower) ||
          rawDate.includes(searchLower) ||
          formatted.includes(searchLower);
      }

      const matchesStatus = searchStatus.length === 0 || searchStatus.includes(entry.status);
      const matchesOrderNumber =
        searchOrderNumber.length === 0 ||
        searchOrderNumber.includes(String(entry.orderNumber));
      const matchesExecutor =
        searchExecutor.length === 0 || searchExecutor.includes(entry.executorRole);
      const matchesRole = searchRole.length === 0 || searchRole.includes(entry.role);
      const matchesWorkDate =
        searchWorkDate.length === 0 || searchWorkDate.includes(entry.workDate);
      const matchesWorkDone = searchWorkDone
        ? String(entry.workDone || "").toLowerCase().includes(searchWorkDone.toLowerCase())
        : true;
      const matchesAdminApproved =
        searchAdminApproved.length === 0 || searchAdminApproved.includes(entry.adminApproved);
      const matchesSource =
        searchSource.length === 0 || searchSource.includes(entry.source);

      return (
        matchesGlobal &&
        matchesStatus &&
        matchesOrderNumber &&
        matchesExecutor &&
        matchesRole &&
        matchesWorkDate &&
        matchesWorkDone &&
        matchesAdminApproved &&
        matchesSource
      );
    });

    setDisplayedLogEntries(filtered);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterData, allLogEntries]);

  const handleApplyFilters = () => {
    const merged = { ...tempFilterData, searchGlobal: filterData.searchGlobal };
    updateURLWithFilters(merged);
    setShowAdvancedSearch(false);
  };

  const handleCancelFilters = () => {
    setTempFilterData(filterData);
    setShowAdvancedSearch(false);
  };

  const handleResetSearch = () => {
    setSearchParams({});
  };

  const handleQuickFilter = (columnKey, value) => {
    const filterKey = COLUMNS.find((c) => c.key === columnKey)?.filterKey;
    if (!filterKey) return;

    const currentValues = filterData[filterKey];
    let newValues;

    if (Array.isArray(currentValues)) {
      newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
    } else {
      newValues = value;
    }

    updateURLWithFilters({ ...filterData, [filterKey]: newValues });
  };

  const activeFiltersCount = Object.entries(filterData)
    .filter(([key, value]) => {
      if (key === "searchGlobal") return false;
      return Array.isArray(value) ? value.length > 0 : value !== "";
    }).length;

  const mainSearchPlaceholder =
    activeFiltersCount > 0
      ? `Активно ${activeFiltersCount} фильтров... (Вводите текст для поиска)`
      : "Поиск по всем полям...";

  /* ---------------- Navigation ---------------- */

  const handleRowClick = (entry) => {
    navigate({ pathname: `/journal/${entry.id}`, search: searchParams.toString() });
  };

  const handleCloseDetails = () => {
    navigate({ pathname: "/journal", search: searchParams.toString() });
  };

  const handleAddButtonClick = () => {
    navigate({ pathname: "/journal/new", search: searchParams.toString() });
  };

  /* ---------------- Mass edit mode ---------------- */

  const toggleMassEditMode = () => {
    setIsMassEditMode((prev) => !prev);
    setSelectedEntries([]);
  };

  const handleSelectEntry = (id) => {
    setSelectedEntries((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEntries(displayedLogEntries.map((x) => x.id));
    } else {
      setSelectedEntries([]);
    }
  };

  /* ---------------- Salary/points helpers (оставлено как в твоей версии) ---------------- */

  const parseHoursToMinutes = (hoursStr) => {
    if (!hoursStr && hoursStr !== 0) return 0;
    const s = String(hoursStr).trim();
    if (s.includes(":")) {
      const [h, m] = s.split(":").map((part) => parseInt(part, 10) || 0);
      return h * 60 + m;
    }
    const num = parseFloat(s.replace(",", "."));
    if (Number.isNaN(num)) return 0;
    return Math.round(num * 60);
  };

  const formatMinutesToHMM = (minutes) => {
    if (!minutes && minutes !== 0) return "00:00";
    const m = Number(minutes);
    const sign = m < 0 ? "-" : "";
    const abs = Math.abs(m);
    const h = Math.floor(abs / 60);
    const mm = abs % 60;
    return `${sign}${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const calculatePointsAndPenalty = (workDate, startTime, createdAt = new Date()) => {
    if (!workDate || !startTime) return { points: 0, penalty: 0, coefficient: 1 };
    try {
      const [year, month, day] = workDate.split("-").map(Number);
      const [hours, minutes] = startTime.split(":").map(Number);
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
      console.error("Ошибка при расчете баллов:", error);
      return { points: 0, penalty: 0, coefficient: 1 };
    }
  };

  const calculateDisplayTime = (entry) => {
    const approval = entry.adminApproved;
    let baseTime = "00:00";

    if (approval === "Время трекера") baseTime = entry.trackerHours || "00:00";
    else if (approval === "Корректировка администратором" && entry.correctionTime)
      baseTime = entry.correctionTime;
    else baseTime = entry.hours || "00:00";

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
    displayedLogEntries.forEach((entry) => {
      const orderKey = entry.orderId || entry.orderNumber || "";
      const executor = entry.executorRole || "";
      const key = `${orderKey}_${executor}`;
      const displayTime = calculateDisplayTime(entry);
      const minutes = parseHoursToMinutes(displayTime);
      totals[key] = (totals[key] || 0) + minutes;
    });
    return totals;
  }, [displayedLogEntries]);

  /* ---------------- Options for dropdowns ---------------- */

  const uniqueStatuses = useMemo(() => {
    const statuses = activeOrders.map((o) => o.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [activeOrders]);

  const uniqueOrderNumbers = useMemo(() => {
    const nums = activeOrders.map((o) => String(o.label || o.orderNumber)).filter(Boolean);
    return [...new Set(nums)];
  }, [activeOrders]);

  const uniqueExecutors = useMemo(() => {
    return employees.map((emp) => emp.fullName || emp.name).filter(Boolean);
  }, [employees]);

  const uniqueWorkDates = useMemo(() => {
    const dates = allLogEntries.map((e) => e.workDate).filter(Boolean);
    return [...new Set(dates)].sort();
  }, [allLogEntries]);

  const adminApprovalOptions = [
    "Ожидает",
    "Принято",
    "Время трекера",
    "Время журнала",
    "Корректировка администратором",
  ];
  const sourceOptions = ["СРМ", "Таблица"];

  /* ---------------- Active entry ---------------- */

  const activeEntry = useMemo(() => {
    if (!entryId || entryId === "new") return null;
    return allLogEntries.find((e) => String(e.id) === String(entryId)) || null;
  }, [allLogEntries, entryId]);

  const isAddMode = entryId === "new";

  /* ---------------- Cell click with quick filter ---------------- */

  const handleCellClick = (entry, columnKey, value) => (e) => {
    if (isMassEditMode) return;
    if (e.target.closest(".prevent-row-click")) return;

    const column = COLUMNS.find((c) => c.key === columnKey);
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

  /* ---------------- CRUD: write into order.workLog via API ---------------- */

  const normalizeOrderWorkLog = (order) => {
    const workLog =
      order?.workLog ??
      order?.work_log ??
      order?.meta?.workLog ??
      order?.meta?.work_log ??
      order?.meta?.worklog ??
      [];
    return Array.isArray(workLog) ? workLog : [];
  };

  const handleAddLogEntry = async (newEntry) => {
    try {
      const orderId = String(newEntry.orderNumber || "");
      const targetOrder = orders.find((o) => String(o.id) === orderId);
      if (!targetOrder) return;

      const workLog = normalizeOrderWorkLog(targetOrder).slice();

      const nextEntry = {
        id: Date.now(),
        description: newEntry.description || "",
        executorRole: newEntry.executorRole || "",
        role: newEntry.role || newEntry.executorRole || "",
        workDate: newEntry.workDate || "",
        startTime: newEntry.startTime || "",
        endTime: newEntry.endTime || "",
        hours: newEntry.hours || "",
        workDone: newEntry.workDone || "",
        adminApproved: newEntry.adminApproved || "Ожидает",
        correctionTime: newEntry.correctionTime || "",
        source: newEntry.source || "СРМ",
        status: newEntry.status || "",
        email: newEntry.email || "",
        createdAt: new Date().toISOString(),
      };

      const updatedWorkLog = [nextEntry, ...workLog];

      await updateOrder(targetOrder.id, { workLog: updatedWorkLog });

      const nextOrders = orders.map((o) =>
        String(o.id) === String(targetOrder.id) ? { ...o, workLog: updatedWorkLog } : o
      );

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));

      handleCloseDetails();
    } catch (err) {
      console.error("Ошибка сохранения записи журнала:", err);
    }
  };

  const handleUpdateLogEntry = async (updatedEntry) => {
    try {
      const orderId = String(updatedEntry.orderId || updatedEntry.orderNumber || "");
      const targetOrder = orders.find((o) => String(o.id) === orderId);
      if (!targetOrder) return;

      const workLog = normalizeOrderWorkLog(targetOrder).slice();

      const updatedWorkLog = workLog.map((entry) => {
        const entryIdLocal = entry?.id ?? entry?.original_id;
        if (String(entryIdLocal) !== String(updatedEntry.id)) return entry;

        return {
          ...entry,
          description: updatedEntry.description ?? entry.description,
          executorRole: updatedEntry.executorRole ?? entry.executorRole,
          role: updatedEntry.role ?? entry.role,
          workDate: updatedEntry.workDate ?? entry.workDate,
          startTime: updatedEntry.startTime ?? entry.startTime,
          endTime: updatedEntry.endTime ?? entry.endTime,
          hours: updatedEntry.hours ?? entry.hours,
          workDone: updatedEntry.workDone ?? entry.workDone,
          adminApproved: updatedEntry.adminApproved ?? entry.adminApproved,
          correctionTime: updatedEntry.correctionTime ?? entry.correctionTime,
          source: updatedEntry.source ?? entry.source,
          email: updatedEntry.email ?? entry.email,
        };
      });

      await updateOrder(targetOrder.id, { workLog: updatedWorkLog });

      const nextOrders = orders.map((o) =>
        String(o.id) === String(targetOrder.id) ? { ...o, workLog: updatedWorkLog } : o
      );

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));

      handleCloseDetails();
    } catch (err) {
      console.error("Ошибка обновления записи журнала:", err);
    }
  };

  const handleDeleteLogEntry = async (idToDelete) => {
    try {
      const ownerOrder = orders.find((order) => {
        const workLog = normalizeOrderWorkLog(order);
        return workLog.some((e) => String(e?.id ?? e?.original_id) === String(idToDelete));
      });
      if (!ownerOrder) return;

      const workLog = normalizeOrderWorkLog(ownerOrder);
      const updatedWorkLog = workLog.filter(
        (e) => String(e?.id ?? e?.original_id) !== String(idToDelete)
      );

      await updateOrder(ownerOrder.id, { workLog: updatedWorkLog });

      const nextOrders = orders.map((o) =>
        String(o.id) === String(ownerOrder.id) ? { ...o, workLog: updatedWorkLog } : o
      );

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));

      handleCloseDetails();
    } catch (err) {
      console.error("Ошибка удаления записи журнала:", err);
    }
  };

  const handleDuplicateLogEntry = async (entryToDuplicate) => {
    try {
      const orderId = String(entryToDuplicate.orderId || entryToDuplicate.orderNumber || "");
      const targetOrder = orders.find((o) => String(o.id) === orderId);
      if (!targetOrder) return;

      const workLog = normalizeOrderWorkLog(targetOrder).slice();

      const clone = {
        ...entryToDuplicate,
        id: Date.now(),
        description: `${entryToDuplicate.description || ""} (Копия)`.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedWorkLog = [clone, ...workLog];

      await updateOrder(targetOrder.id, { workLog: updatedWorkLog });

      const nextOrders = orders.map((o) =>
        String(o.id) === String(targetOrder.id) ? { ...o, workLog: updatedWorkLog } : o
      );

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));
    } catch (err) {
      console.error("Ошибка дублирования записи журнала:", err);
    }
  };

  /* ---------------- Mass actions (API) ---------------- */

  const handleMassUpdate = async (field, value) => {
    // сгруппируем выбранные записи по orderId
    try {
      const byOrder = {};
      allLogEntries.forEach((entry) => {
        if (!selectedEntries.includes(entry.id)) return;
        const oid = entry.orderId || entry.orderNumber;
        if (!oid) return;
        if (!byOrder[oid]) byOrder[oid] = [];
        byOrder[oid].push(entry);
      });

      const nextOrders = orders.slice();

      // обновляем workLog каждого заказа
      // (делаем последовательно, чтобы проще отладить)
      // eslint-disable-next-line no-restricted-syntax
      for (const [oid, entriesToPatch] of Object.entries(byOrder)) {
        const order = nextOrders.find((o) => String(o.id) === String(oid));
        if (!order) continue;

        const workLog = normalizeOrderWorkLog(order).slice();

        const patched = workLog.map((wl) => {
          const wlId = wl?.id ?? wl?.original_id;
          const found = entriesToPatch.find((e) => String(e.id) === String(wlId));
          if (!found) return wl;
          return { ...wl, [field]: value };
        });

        await updateOrder(order.id, { workLog: patched });

        const idx = nextOrders.findIndex((o) => String(o.id) === String(order.id));
        if (idx !== -1) nextOrders[idx] = { ...order, workLog: patched };
      }

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));
    } catch (err) {
      console.error("Ошибка массового обновления:", err);
    }
  };

  const handleMassDelete = async () => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedEntries.length} записей?`)) return;

    try {
      // найдём owner orders для выбранных
      const nextOrders = orders.slice();

      // eslint-disable-next-line no-restricted-syntax
      for (const order of nextOrders) {
        const workLog = normalizeOrderWorkLog(order);
        const hasAny = workLog.some((wl) =>
          selectedEntries.includes(String(wl?.id ?? wl?.original_id))
        );
        if (!hasAny) continue;

        const patched = workLog.filter(
          (wl) => !selectedEntries.includes(String(wl?.id ?? wl?.original_id))
        );

        await updateOrder(order.id, { workLog: patched });

        const idx = nextOrders.findIndex((o) => String(o.id) === String(order.id));
        if (idx !== -1) nextOrders[idx] = { ...order, workLog: patched };
      }

      const entries = buildJournalEntriesFromOrders(nextOrders);
      setOrders(nextOrders);
      setAllLogEntries(entries);
      setDisplayedLogEntries(entries);
      setAvailableRoles(computeRoles(entries));

      setSelectedEntries([]);
      setIsMassEditMode(false);
    } catch (err) {
      console.error("Ошибка массового удаления:", err);
    }
  };

  /* ---------------- Group by date ---------------- */

  const groupedEntries = useMemo(() => {
    return displayedLogEntries.reduce((acc, entry) => {
      const date = entry.workDate || "Без даты";
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {});
  }, [displayedLogEntries]);

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
              </span>

              <input
                type="text"
                placeholder={mainSearchPlaceholder}
                className="journal-main-search-input"
                value={filterData.searchGlobal}
                onChange={handleGlobalSearchChange}
                onClick={() => {
                  if (!showAdvancedSearch) setShowAdvancedSearch(true);
                }}
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
              className={`journal-view-toggle-btn-single ${expandedRows ? "active" : ""}`}
              onClick={() => setExpandedRows(!expandedRows)}
              title={expandedRows ? "Компактный вид" : "Расширенный вид"}
            >
              {expandedRows ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="17" width="18" height="4" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="6" rx="1" />
                  <rect x="3" y="12" width="18" height="6" rx="1" />
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
            <button className="journal-add-entry-button" onClick={handleAddButtonClick}>
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
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>{" "}
              Добавить
            </button>
          </div>
        </header>

        {isMassEditMode && selectedEntries.length > 0 && (
          <MassActionBar
            selectedCount={selectedEntries.length}
            onClose={() => {
              setIsMassEditMode(false);
              setSelectedEntries([]);
            }}
            employees={employees}
            availableRoles={availableRoles}
            onMassUpdate={handleMassUpdate}
            onMassDelete={handleMassDelete}
          />
        )}

        <div className="journal-table-container">
          <table className={`journal-table ${expandedRows ? "expanded-rows" : ""} ${isMassEditMode ? "mass-mode" : ""}`}>
            <thead>
              <tr>
                {isMassEditMode && (
                  <th className="journal-checkbox-cell journal-sticky-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        displayedLogEntries.length > 0 &&
                        displayedLogEntries.every((e) => selectedEntries.includes(e.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                )}

                {COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Object.entries(groupedEntries).map(([date, entries]) => (
                <React.Fragment key={date}>
                  <tr className="journal-date-separator-row">
                    <td
                      colSpan={isMassEditMode ? COLUMNS.length + 1 : COLUMNS.length}
                      className="journal-date-separator-cell"
                    >
                      <span className="journal-date-chip">{formatDate(date)}</span>
                    </td>
                  </tr>

                  {entries.map((entry) => {
                    const key = `${entry.orderId || entry.orderNumber || ""}_${entry.executorRole || ""}`;
                    const totalMinutes = totalMinutesByOrderAndExecutorGlobal[key] || 0;
                    const totalHoursFormatted = formatMinutesToHMM(totalMinutes);

                    const { points, penalty, coefficient } = calculatePointsAndPenalty(
                      entry.workDate,
                      entry.startTime,
                      entry.createdAt ? new Date(entry.createdAt) : new Date()
                    );

                    const displayTime = calculateDisplayTime(entry);
                    const pointsDisplay = points > 0 ? `+${points}` : penalty > 0 ? `-${penalty}` : "0";

                    return (
                      <tr
                        key={entry.id}
                        className="journal-data-row"
                        onClick={(e) => {
                          if (!isMassEditMode && !e.target.closest(".prevent-row-click")) {
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
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "orderNumber", String(entry.orderNumber))}
                        >
                          <div className="cell-content">{entry.orderNumber}</div>
                        </td>

                        <td
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "status", entry.status)}
                        >
                          <div className="cell-content">
                            {statusToEmojiMap[entry.status] || entry.status}
                          </div>
                        </td>

                        <td>
                          <div className="cell-content">{entry.description}</div>
                        </td>

                        <td
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "executorRole", entry.executorRole)}
                        >
                          <div className="cell-content">{entry.executorRole}</div>
                        </td>

                        <td
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "role", entry.role)}
                        >
                          <div className="cell-content">{entry.role}</div>
                        </td>

                        <td
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "workDate", entry.workDate)}
                        >
                          <div className="cell-content">{formatDate(entry.workDate)}</div>
                        </td>

                        <td>
                          <div className="cell-content">{formatTime(entry.startTime)}</div>
                        </td>
                        <td>
                          <div className="cell-content">{entry.endTime}</div>
                        </td>
                        <td>
                          <div className="cell-content">{entry.hours}</div>
                        </td>
                        <td>
                          <div className="cell-content">{entry.workDone}</div>
                        </td>

                        <td
                          className={quickFilterMode ? "quick-filter-cell" : ""}
                          onClick={handleCellClick(entry, "adminApproved", entry.adminApproved)}
                        >
                          <div className="cell-content">{entry.adminApproved}</div>
                        </td>

                        {/* Salary */}
                        <td>
                          <div className="cell-content">{entry.salary || "-"}</div>
                        </td>

                        {/* Total Hours (по текущей логике) */}
                        <td>
                          <div className="cell-content">{displayTime}</div>
                        </td>

                        {/* Points */}
                        <td>
                          <div
                            className="cell-content"
                            style={{
                              color: points > 0 ? "#28a745" : penalty > 0 ? "#dc3545" : "inherit",
                            }}
                          >
                            {pointsDisplay}
                          </div>
                        </td>

                        {/* Pay Lost */}
                        <td>
                          <div className="cell-content">
                            {coefficient < 1 ? `${Math.round((1 - coefficient) * 100)}%` : "-"}
                          </div>
                        </td>

                        {/* Tracker Hours */}
                        <td>
                          <div className="cell-content">{entry.trackerHours || "00:00"}</div>
                        </td>

                        {/* Type */}
                        <td>
                          <div className="cell-content">{entry.type || "-"}</div>
                        </td>

                        {/* Project */}
                        <td>
                          <div className="cell-content">{entry.project || "-"}</div>
                        </td>

                        {/* Work Category */}
                        <td>
                          <div className="cell-content">{entry.workCategory || "-"}</div>
                        </td>

                        {/* Task */}
                        <td>
                          <div className="cell-content">{entry.task || "-"}</div>
                        </td>

                        {/* Work Done (GPT) */}
                        <td>
                          <div className="cell-content">{entry.gptSummary || "-"}</div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeEntry && (
        <LogEntryDetails
          entry={activeEntry}
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

      {isAddMode && (
        <AddLogEntryForm
          onAdd={handleAddLogEntry}
          onClose={handleCloseDetails}
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
