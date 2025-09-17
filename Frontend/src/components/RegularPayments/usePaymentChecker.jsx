import { useEffect } from 'react';
import { useTransactions } from '../../context/TransactionsContext'; 
import * as paymentApi from './regularPayments'; 
import { calculateNextPaymentDate } from './regularPayments';       


export const usePaymentChecker = () => {
    
    const { addTransaction } = useTransactions();

    
    useEffect(() => {
        const checkAndProcessPayments = () => {
            const now = new Date();
            const allPayments = paymentApi.getRegularPayments();

            const duePayments = allPayments.filter(p => {
                if (p.status !== 'Активен' || !p.nextPaymentDate) return false;
                const paymentDateTime = new Date(`${p.nextPaymentDate}T${p.time}`);
                return paymentDateTime <= now;
            });

            if (duePayments.length > 0) {
                console.log(`Найдено ${duePayments.length} регулярных платежей для обработки.`);
                
                duePayments.forEach(payment => {
                    const newTransaction = {
                        id: `TRX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        date: new Date().toISOString().slice(0, 16).replace("T", " "),
                        category: payment.category,
                        subcategory: payment.subcategory,
                        description: `Регулярный платеж: ${payment.category}`,
                        account: payment.account,
                        accountCurrency: payment.accountCurrency,
                        operation: payment.operation,
                        amount: parseFloat(payment.amount),
                    };
                    
                    addTransaction(newTransaction);

                    const updatedPayment = {
                        ...payment,
                        nextPaymentDate: calculateNextPaymentDate(payment.period, payment.time, payment.nextPaymentDate),
                    };
                    
                    paymentApi.updateRegularPayment(updatedPayment);
                });
            }
        };
        
        
        const intervalId = setInterval(checkAndProcessPayments, 60000); 

        
        return () => clearInterval(intervalId);

    }, [addTransaction]); 
};