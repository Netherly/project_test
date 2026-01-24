

const REGULAR_PAYMENTS_KEY = 'regularPaymentsData';


const defaultRegularPayments = [
    
];

const getTodayISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const generateId = () => {
    return 'RP_' + Math.random().toString(36).substring(2, 9);
};




/**
 * 
 * @param {object} paymentData - Объект с { period, time, cycleDay }.
 * @param {Date | string} referenceDateInput - Дата, ОТ которой вести расчет.
 * @returns {string} - Новая дата в полном ISO формате (YYYY-MM-DDTHH:mm:ss.sssZ).
 */
export const calculateNextPaymentDate = (paymentData, referenceDateInput) => {
    const { period, time, cycleDay } = paymentData;
    
    
    const referenceDate = new Date(referenceDateInput);
    const [hours, minutes] = time.split(':');
    
    
    let nextDate = new Date(referenceDate);
    nextDate.setHours(hours, minutes, 0, 0); 

    
    const refDateWithTime = new Date(referenceDate);
    refDateWithTime.setHours(hours, minutes, 0, 0);

    
    switch (period) {
        case 'Ежедневно':
            nextDate.setDate(nextDate.getDate() + 1);
            break;

        case 'Еженедельно':
            
            const targetDay = parseInt(cycleDay, 10) % 7; 
            const currentDay = nextDate.getDay();

            let daysToAdd = (targetDay - currentDay + 7) % 7;
            
            
            if (daysToAdd === 0) {
                daysToAdd = 7;
            }
            
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            break;

        case 'Ежемесячно':
            const targetDate = parseInt(cycleDay, 10);
            nextDate.setDate(targetDate);
            
           
            if (nextDate <= refDateWithTime) {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;

        case 'Ежегодно':
            const [day, month] = cycleDay.split('.').map(n => parseInt(n, 10));
            nextDate.setMonth(month - 1); 
            nextDate.setDate(day);

            
            if (nextDate <= refDateWithTime) {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            break;

        default:
            nextDate.setDate(nextDate.getDate() + 1); 
    }
    return nextDate.toISOString(); 
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


export const addRegularPayment = (paymentData) => {
    const allPayments = getRegularPayments();
    
    const paymentToAdd = {
        id: generateId(),
        status: 'Активен',
        ...paymentData,
        
    };
    
    const updatedPayments = [paymentToAdd, ...allPayments];
    saveRegularPayments(updatedPayments);
    return updatedPayments;
};



export const updateRegularPayment = (updatedPayment) => {
    const allPayments = getRegularPayments();

    const updatedList = allPayments.map(p => {
        if (p.id !== updatedPayment.id) {
            return p;
        }

        let paymentToSave = { ...updatedPayment };

       
        if (paymentToSave.nextPaymentDate === null) {
            paymentToSave.nextPaymentDate = calculateNextPaymentDate(
                paymentToSave, 
                new Date()     
            );
        }
        
        return paymentToSave;
    });

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