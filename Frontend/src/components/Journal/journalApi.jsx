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
 * @returns {Array} Массив записей журнала.
 */
export const getLogEntries = () => {
    try {
        const savedLogs = localStorage.getItem(JOURNAL_KEY);
        const entries = savedLogs ? JSON.parse(savedLogs) : [];
        return entries.map(entry => {
            let roleValue = '';
            if (typeof entry.role === 'string') {
                roleValue = entry.role;
            } else if (Array.isArray(entry.role) && entry.role.length > 0) {
                roleValue = entry.role[0]; // Берем первую роль
            } else if (entry.executorRole) {
                roleValue = entry.executorRole; 
            }

            return {
                ...entry,
                role: roleValue,
                correctionTime: entry.correctionTime || ''
            };
        });
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

/**
 * Получает список всех уникальных ролей.
 * @returns {Array} Отсортированный массив строк-ролей.
 */
export const getAvailableRoles = () => {
    const defaultRoles = [
        "Фронтенд-разработчик", 
        "Бэкенд-разработчик", 
        "Дизайнер", 
        "Менеджер проекта", 
        "Тестировщик (QA)", 
        "Аналитик"
    ];
    return defaultRoles.sort();
};

/**
 * Добавляет новую запись в журнал.
 * @param {Object} newEntryData - Данные новой записи из формы.
 * @returns {Array} Обновленный массив всех записей.
 */
export const addLogEntry = (newEntryData) => {
    const allEntries = getLogEntries();
    const entryToAdd = {
        id: Date.now(),
        status: newEntryData.status || "Лид", 
        adminApproved: "Ожидает",
        source: newEntryData.source || "СРМ", 
        createdAt: new Date().toISOString(),
        ...newEntryData,
        role: typeof newEntryData.role === 'string' ? newEntryData.role : '',
        correctionTime: newEntryData.correctionTime || ''
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
        entry.id === updatedEntry.id ? {
            ...updatedEntry,
            role: typeof updatedEntry.role === 'string' ? updatedEntry.role : '',
            correctionTime: updatedEntry.correctionTime || '',
            createdAt: entry.createdAt || new Date().toISOString()
        } : entry
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