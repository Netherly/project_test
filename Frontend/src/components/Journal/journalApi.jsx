

const JOURNAL_KEY = 'journalEntries'; 

/**
 * Получает все записи журнала из localStorage.
 * @returns {Array} Массив записей журнала или пустой массив, если записей нет.
 */
export const getLogEntries = () => {
    try {
        const savedLogs = localStorage.getItem(JOURNAL_KEY);
        return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
        console.error("Ошибка при чтении записей журнала из localStorage:", error);
        return [];
    }
};

/**
 * Сохраняет массив записей журнала в localStorage.
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
 * Добавляет новую запись в журнал.
 * @param {Object} newEntryData - Данные новой записи из формы.
 * @returns {Array} Обновленный массив всех записей.
 */
export const addLogEntry = (newEntryData) => {
    const allEntries = getLogEntries();
    const entryToAdd = {
        id: Date.now(), // Генерируем уникальный ID на основе времени
        status: newEntryData.status || "Лид", // Статус по умолчанию
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