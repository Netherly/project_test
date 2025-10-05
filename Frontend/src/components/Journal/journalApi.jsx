// journalApi.jsx

const JOURNAL_KEY = 'journalEntries'; 


/**
 * Получает всех исполнителей из localStorage.
 * @returns {Array} Массив исполнителей или пустой массив.
 */
export const getEmployees = () => {
    try {
        const savedEmployees = localStorage.getItem('employees'); 
        return savedEmployees ? JSON.parse(savedEmployees) : [];
    } catch (error) {
        console.error("Ошибка при чтении исполнителей из localStorage:", error);
        return [];
    }
};

/**
 * Получает все заказы из localStorage.
 * @returns {Array} Массив заказов или пустой массив.
 */
export const getOrders = () => {
    try {
        const savedOrders = localStorage.getItem('ordersData'); 
        return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (error) {
        console.error("Ошибка при чтении заказов из localStorage:", error);
        return [];
    }
};

/**
 * Получает все записи журнала из localStorage.
 * @returns {Array} Массив записей журнала или пустой массив, если записей нет.
 */
export const getLogEntries = () => {
    try {
        const savedLogs = localStorage.getItem(JOURNAL_KEY);
        // Добавление заглушек для новых полей, отсутствующих в старых данных
        const entries = savedLogs ? JSON.parse(savedLogs) : [];
        return entries.map(entry => ({
            // Поля, необходимые для фильтрации, но которых может не быть в старых данных
            role: entry.role || entry.executorRole, // Используем executorRole как роль, если роль не задана
            adminApproved: entry.adminApproved || (Math.random() > 0.66 ? "Одобрено" : Math.random() > 0.33 ? "Не одобрено" : "Ожидает"),
            source: entry.source || "СРМ", // Заглушка для источника отчета
            ...entry,
        }));
    } catch (error) {
        console.error("Ошибка при чтении записей журнала из localStorage:", error);
        return [];
    }
};

/**
 * Сохраняет текущий массив записей журнала в localStorage.
 * @param {Array} entries - Массив записей для сохранения.
 */
const saveLogEntries = (entries) => {
    try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error("Ошибка при сохранении записей журнала в localStorage:", error);
    }
};

// Добавляем статичные роли по умолчанию для фильтра
const DEFAULT_ROLES = ["Фронтендер", "Бэкендер", "Менеджер", "Дизайнер", "Тестировщик"];

/**
 * Получает уникальные роли исполнителей из записей журнала.
 * @returns {Array<string>} Массив уникальных ролей.
 */
export const getAvailableRoles = () => {
    const allEntries = getLogEntries();
    const uniqueRoles = new Set(DEFAULT_ROLES);

    allEntries.forEach(entry => {
        // Используем поле executorRole для извлечения ролей, так как в исходной структуре нет отдельного поля 'role'
        if (entry.executorRole) {
            uniqueRoles.add(entry.executorRole);
        }
    });

    return Array.from(uniqueRoles).sort();
};

/**
 * Добавляет новую запись в журнал.
 * @param {Object} newEntryData - Данные новой записи из формы.
 * @returns {Array} Обновленный массив всех записей.
 */
export const addLogEntry = (newEntryData) => {
    const allEntries = getLogEntries();
    const entryToAdd = {
        id: Date.now(), // Генерируем уникальный ID на основе времени
        status: newEntryData.status || "Лид", // Статус по умолчанию
        adminApproved: "Ожидает", // Дефолтное значение для нового поля
        source: newEntryData.source || "СРМ", // Дефолтное значение для нового поля
        ...newEntryData,
    };
    const updatedEntries = [entryToAdd, ...allEntries];
    saveLogEntries(updatedEntries);
    return updatedEntries;
};

/**
 * Обновляет существующую запись в журнале.
 * @param {Object} updatedEntry - Объект записи с обновленными данными.
 * @returns {Array} Обновленный массив всех записей.
 */
export const updateLogEntry = (updatedEntry) => {
    const allEntries = getLogEntries();
    const updatedEntries = allEntries.map(entry =>
        entry.id === updatedEntry.id ? updatedEntry : entry
    );
    saveLogEntries(updatedEntries);
    return updatedEntries;
};

/**
 * Удаляет запись из журнала по ее ID.
 * @param {number} entryId - ID записи для удаления.
 * @returns {Array} Обновленный массив всех записей.
 */
export const deleteLogEntry = (entryId) => {
    const allEntries = getLogEntries();
    const updatedEntries = allEntries.filter(entry => entry.id !== entryId);
    saveLogEntries(updatedEntries);
    return updatedEntries;
};