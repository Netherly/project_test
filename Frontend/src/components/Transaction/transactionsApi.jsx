
const TRANSACTIONS_KEY = 'transactionsData';

/**
 * Вспомогательная функция для сортировки транзакций по дате (от новых к старым).
 * @param {Array} transactions - Массив транзакций.
 * @returns {Array} Отсортированный массив.
 */
const sortTransactions = (transactions) => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
};


/**
 * Обновляет балансы активов на основе транзакций.
 * Эта функция должна вызываться каждый раз при изменении транзакций.
 * @param {Array} updatedTransactions - Полный список текущих транзакций.
 */
const updateAssetsAfterTransactionChange = (updatedTransactions) => {
    try {
        const savedAssets = JSON.parse(localStorage.getItem('assetsData')) || [];
        if (!savedAssets.length) return;

        const updatedAssets = savedAssets.map(asset => {
            const assetTransactions = updatedTransactions.filter(t => t.account === asset.id);
            const totalIncoming = assetTransactions
                .filter(t => t.operation === 'Зачисление')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const totalOutgoing = assetTransactions
                .filter(t => t.operation === 'Списание')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const newBalance = (Number(asset.turnoverStartBalance) + totalIncoming - totalOutgoing).toFixed(2);

            return {
                ...asset,
                balance: parseFloat(newBalance),
                turnoverIncoming: totalIncoming,
                turnoverOutgoing: totalOutgoing,
                turnoverEndBalance: parseFloat(newBalance),
            };
        });
        localStorage.setItem('assetsData', JSON.stringify(updatedAssets));
    } catch (error) {
        console.error("Ошибка при обновлении активов в localStorage:", error);
    }
};


/**
 * Получает все транзакции из localStorage.
 * @returns {Array} Массив транзакций.
 */
export const getTransactions = () => {
    try {
        const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
        // Если данные есть, парсим их, иначе возвращаем пустой массив
        return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
        console.error("Ошибка при чтении транзакций из localStorage:", error);
        return [];
    }
};

/**
 * Сохраняет массив транзакций в localStorage.
 * @param {Array} transactions - Массив транзакций для сохранения.
 */
const saveTransactions = (transactions) => {
    try {
        const sorted = sortTransactions(transactions);
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(sorted));
        // После каждого сохранения транзакций, обновляем баланс активов
        updateAssetsAfterTransactionChange(sorted);
    } catch (error) {
        console.error("Ошибка при сохранении транзакций в localStorage:", error);
    }
};

/**
 * Добавляет новую транзакцию.
 * @param {Object} newTransactionData - Данные новой транзакции.
 * @returns {Array} Обновленный массив всех транзакций.
 */
export const addTransaction = (newTransactionData) => {
    const allTransactions = getTransactions();
    const transactionToAdd = {
        ...newTransactionData,
        id: `T${Date.now()}`, // Генерируем уникальный ID на основе времени
    };
    const updatedTransactions = [...allTransactions, transactionToAdd];
    saveTransactions(updatedTransactions);
    return sortTransactions(updatedTransactions);
};

/**
 * Обновляет существующую транзакцию.
 * @param {Object} updatedTransaction - Объект транзакции с обновленными данными.
 * @returns {Array} Обновленный массив всех транзакций.
 */
export const updateTransaction = (updatedTransaction) => {
    const allTransactions = getTransactions();
    const updatedTransactions = allTransactions.map(t =>
        t.id === updatedTransaction.id ? updatedTransaction : t
    );
    saveTransactions(updatedTransactions);
    return sortTransactions(updatedTransactions);
};

/**
 * Удаляет транзакцию по ее ID.
 * @param {string} transactionId - ID транзакции для удаления.
 * @returns {Array} Обновленный массив всех транзакций.
 */
export const deleteTransaction = (transactionId) => {
    const allTransactions = getTransactions();
    const updatedTransactions = allTransactions.filter(t => t.id !== transactionId);
    saveTransactions(updatedTransactions);
    return sortTransactions(updatedTransactions);
};

/**
 * Дублирует транзакцию.
 * @param {Object} transactionToDuplicate - Транзакция для дублирования.
 * @returns {Array} Обновленный массив всех транзакций.
 */
export const duplicateTransaction = (transactionToDuplicate) => {
    const newTransactionData = {
        ...transactionToDuplicate,
        id: `DUPLICATE_${Date.now()}`, // id нужно убрать, чтобы addTransaction сгенерировал новый
        description: `(Копия) ${transactionToDuplicate.description}`,
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    delete newTransactionData.id;
    return addTransaction(newTransactionData);
};