

const REGULAR_PAYMENTS_KEY = 'regularPaymentsData';


const defaultRegularPayments = [
    
];

const generateId = () => {
    return 'RP_' + Math.random().toString(36).substring(2, 9);
};



/**
 * Рассчитывает дату следующего платежа.
 * @param {string} period - Период ('Ежедневно', 'Еженедельно', 'Ежемесячно', 'Ежегодно').
 * @param {string} time - Время в формате 'HH:mm'.
 * @returns {string} - Дата в формате 'YYYY-MM-DD'.
 */
export const calculateNextPaymentDate = (period, time, lastPaymentDateStr) => {
    
    const startDate = lastPaymentDateStr ? new Date(lastPaymentDateStr) : new Date();
    const [hours, minutes] = time.split(':');

    startDate.setHours(hours, minutes, 0, 0);

    const futureDate = new Date(startDate);

    switch (period) {
        case 'Ежедневно':
            futureDate.setDate(futureDate.getDate() + 1);
            break;
        case 'Еженедельно':
            futureDate.setDate(futureDate.getDate() + 7);
            break;
        case 'Ежемесячно':
            futureDate.setMonth(futureDate.getMonth() + 1);
            break;
        case 'Ежегодно':
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            break;
        default:
            futureDate.setDate(futureDate.getDate() + 1); 
    }

    
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};


export const getRegularPayments = () => {
    try {
        const savedData = localStorage.getItem(REGULAR_PAYMENTS_KEY);
        return savedData ? JSON.parse(savedData) : defaultRegularPayments;
    } catch (error) {
        console.error("Ошибка при чтении регулярных платежей из localStorage:", error);
        return defaultRegularPayments;
    }
};

const saveRegularPayments = (payments) => {
    try {
        localStorage.setItem(REGULAR_PAYMENTS_KEY, JSON.stringify(payments));
    } catch (error) {
        console.error("Ошибка при сохранении регулярных платежей в localStorage:", error);
    }
};


export const addRegularPayment = (newPaymentData) => {
    const allPayments = getRegularPayments();
    
    const paymentToAdd = {
        id: generateId(),
        status: 'Активен',
        ...newPaymentData,
        nextPaymentDate: calculateNextPaymentDate(newPaymentData.period, newPaymentData.time, null),
    };
    
    
    const updatedPayments = [paymentToAdd, ...allPayments];
    
    saveRegularPayments(updatedPayments);
    return updatedPayments;
};


export const updateRegularPayment = (updatedPayment) => {
    const allPayments = getRegularPayments();
    const updatedList = allPayments.map(p =>
        p.id === updatedPayment.id ? updatedPayment : p
    );
    saveRegularPayments(updatedList);
    return updatedList;
};

export const deleteRegularPayment = (paymentId) => {
    const allPayments = getRegularPayments();
    const updatedList = allPayments.filter(p => p.id !== paymentId);
    saveRegularPayments(updatedList);
    return updatedList;
};

export const duplicateRegularPayment = (paymentToDuplicate) => {
    const allPayments = getRegularPayments();
    const newPayment = {
        ...paymentToDuplicate,
        id: generateId(),
    };
    const updatedList = [newPayment, ...allPayments]; 
    saveRegularPayments(updatedList);
    return updatedList;
};