

const EXECUTORS_KEY = 'executorsData'; // Ключ для хранения в localStorage

// Данные по умолчанию, если в localStorage ничего нет
const defaultPerformers = [
    {
        id: "P001",
        orderNumber: "001",
        orderStatus: "В работе",
        orderStatusEmoji: "⏳",
        orderDate: "2025-08-01",
        description: "Оплата за товар #12345",
        client: "Иванов И.И.",
        clientHidden: false,
        performer: "Петров П.П.",
        login: "petrov_p",
        fullName: "Петров П.П.",
        performerRole: "Основной",
        orderCurrency: "USD",
        orderSum: 500.00,
        hourlyRate: 25.00,
        paymentBalance: 0.00,
        workTime: 20,
        paymentSum: 500.00,
        paymentRemaining: 0.00,
        accountingCurrency: "UAH",
    },
    // ... (остальные исполнители по умолчанию из вашего файла ExecutorsPage) ...
];

/**
 * Генерирует уникальный ID для новой записи.
 * @returns {string} ID в формате 'P' + случайные символы.
 */
const generateId = () => {
    return 'P' + Math.random().toString(36).substring(2, 9);
};

/**
 * Получает все записи исполнителей из localStorage.
 * @returns {Array} Массив записей.
 */
export const getExecutors = () => {
    try {
        const savedData = localStorage.getItem(EXECUTORS_KEY);
        // Если данные есть, парсим их, иначе возвращаем массив по умолчанию
        return savedData ? JSON.parse(savedData) : defaultPerformers;
    } catch (error) {
        console.error("Ошибка при чтении данных исполнителей из localStorage:", error);
        return []; // В случае ошибки возвращаем пустой массив
    }
};

/**
 * Сохраняет массив записей исполнителей в localStorage. (Приватная функция)
 * @param {Array} executors - Массив для сохранения.
 */
const saveExecutors = (executors) => {
    try {
        localStorage.setItem(EXECUTORS_KEY, JSON.stringify(executors));
    } catch (error) {
        console.error("Ошибка при сохранении данных исполнителей в localStorage:", error);
    }
};

/**
 * Добавляет новую запись об исполнителе.
 * @param {Object} newExecutorData - Данные новой записи.
 * @returns {Array} Обновленный массив всех записей.
 */
export const addExecutor = (newExecutorData) => {
    const allExecutors = getExecutors();
    // Убеждаемся, что у новой записи есть ID
    const executorToAdd = {
        id: newExecutorData.id || generateId(),
        ...newExecutorData,
    };
    const updatedExecutors = [...allExecutors, executorToAdd];
    saveExecutors(updatedExecutors);
    return updatedExecutors;
};

/**
 * Обновляет существующую запись.
 * @param {Object} updatedExecutor - Объект с обновленными данными.
 * @returns {Array} Обновленный массив всех записей.
 */
export const updateExecutor = (updatedExecutor) => {
    const allExecutors = getExecutors();
    const updatedList = allExecutors.map(ex =>
        ex.id === updatedExecutor.id ? updatedExecutor : ex
    );
    saveExecutors(updatedList);
    return updatedList;
};

/**
 * Удаляет запись по ее ID.
 * @param {string} executorId - ID записи для удаления.
 * @returns {Array} Обновленный массив всех записей.
 */
export const deleteExecutor = (executorId) => {
    const allExecutors = getExecutors();
    const updatedList = allExecutors.filter(ex => ex.id !== executorId);
    saveExecutors(updatedList);
    return updatedList;
};

/**
 * Дублирует существующую запись.
 * @param {Object} executorToDuplicate - Запись, которую нужно скопировать.
 * @returns {Array} Обновленный массив всех записей.
 */
export const duplicateExecutor = (executorToDuplicate) => {
    const allExecutors = getExecutors();
    const newExecutor = {
        ...executorToDuplicate,
        id: generateId(),
        orderNumber: `${executorToDuplicate.orderNumber}-copy`,
    };
    const updatedList = [...allExecutors, newExecutor];
    saveExecutors(updatedList);
    return updatedList;
};