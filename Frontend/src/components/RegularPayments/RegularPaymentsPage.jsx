import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import AddRegularPaymentModal from "./AddRegularPaymentModal";
import ViewEditRegularPaymentModal from "./ViewEditRegularPaymentModal"; 
import "../../styles/RegularPaymentsPage.css";
import * as paymentApi from './regularPayments';
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon";
import { useTransactions } from '../../context/TransactionsContext'; 
import { calculateNextPaymentDate } from './regularPayments';

const RegularPaymentsPage = () => {
    const navigate = useNavigate();
    const { paymentId } = useParams();

    const [regularPayments, setRegularPayments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [financeFields, setFinanceFields] = useState({});
    
    
    const selectedPayment = useMemo(() => {
        if (!paymentId || paymentId === 'new') return null;
        return regularPayments.find(p => String(p.id) === String(paymentId)) || null;
    }, [regularPayments, paymentId]);

    const isAddMode = paymentId === 'new';

    useEffect(() => {
        const payments = paymentApi.getRegularPayments();
        setRegularPayments(payments);

        const savedAssets = localStorage.getItem('assetsData');
        if (savedAssets) setAssets(JSON.parse(savedAssets));

        const savedFields = localStorage.getItem('fieldsData');
        if (savedFields) {
            const parsed = JSON.parse(savedFields);
            if (parsed.financeFields) setFinanceFields(parsed.financeFields);
        }
    }, []);

    
    const handleCloseModal = () => {
        navigate('/regular');
    };

    const openAddModal = () => {
        navigate('/regular/new');
    };

    const openViewEditModal = (payment) => {
        navigate(`/regular/${payment.id}`);
    };

    
    const handleUpdatePayment = (updatedPaymentData) => {
        const updatedPayments = paymentApi.updateRegularPayment(updatedPaymentData);
        setRegularPayments(updatedPayments);
        handleCloseModal(); 
    };

    const handleDeletePayment = (paymentId) => {
        const updatedPayments = paymentApi.deleteRegularPayment(paymentId);
        setRegularPayments(updatedPayments);
        handleCloseModal(); 
    };
    
    const handleDuplicatePayment = (paymentToDuplicate) => {
        const updatedPayments = paymentApi.duplicateRegularPayment(paymentToDuplicate);
        setRegularPayments(updatedPayments);
        handleCloseModal(); 
    };

    const { addTransaction } = useTransactions();

    const handleAddPayment = (newPaymentData) => {
        const now = new Date();
        
        const newTransaction = {
            id: `TRX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: now.toISOString(),
            category: newPaymentData.category,
            subcategory: newPaymentData.subcategory,
            description: `Регулярный платеж: ${newPaymentData.description || newPaymentData.category}`,
            account: newPaymentData.account,
            accountCurrency: newPaymentData.accountCurrency,
            operation: newPaymentData.operation,
            amount: parseFloat(newPaymentData.amount),
        };
        
        addTransaction(newTransaction); 

        const nextPaymentDateISO = calculateNextPaymentDate(newPaymentData, now);
      
        const paymentToAdd = {
            ...newPaymentData,
            nextPaymentDate: nextPaymentDateISO, 
        };
        
        const updatedPayments = paymentApi.addRegularPayment(paymentToAdd);
        setRegularPayments(updatedPayments);
        
       
        handleCloseModal();
    };

    const getAccountNameById = (accountId) => {
        const account = assets.find(a => a.id === accountId);
        return account ? account.accountName : accountId;
    };

    const formatDate = (dateString, timeString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const year = date.getFullYear();
            
            const time = timeString ? ` ${timeString}` : ''; 
            
            return `${day}.${month}.${year}${time}`;
    };

    const formatNumberWithSpaces = (num) => {
        if (num === null || num === undefined || isNaN(Number(num))) {
            return '0.00';
        }
        const fixedNum = Number(num).toFixed(2);
        const parts = fixedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    };

    return (
        <div className="regular-payments-page">
            <Sidebar />
            <div className="regular-payments-page-main-container">
                <header className="regular-payments-header-container">
                    <h1 className="regular-payments-title">
                        <PageHeaderIcon pageName="Регулярные платежи" />
                        Регулярные платежи
                        </h1>
                    <div className="add-payment-wrapper">
                        <button className="add-payment-button" onClick={openAddModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
                        </button>
                    </div>
                </header>

                <div className="regular-payments-table-container">
                    <table className="regular-payments-table">
                        <thead>
                            <tr>
                                <th>Следующий платеж</th>
                                <th>Статья</th>
                                <th>Подстатья</th>
                                <th>Описание</th>
                                <th>Счет</th>
                                <th>Валюта</th>
                                <th>Операция</th>
                                <th>Сумма</th>
                                <th>Период</th>
                                <th>Цикл</th>
                                <th>Время</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="table-spacer-row"><td colSpan={12}></td></tr>
                            {regularPayments.map((payment) => (
                                <tr key={payment.id} className="regular-payment-row" onClick={() => openViewEditModal(payment)}>
                                    <td>{formatDate(payment.nextPaymentDate, payment.time)}</td>
                                    <td>{payment.category}</td>
                                    <td>{payment.subcategory}</td>
                                    <td>{payment.description}</td>
                                    <td>{getAccountNameById(payment.account)}</td>
                                    <td>{payment.accountCurrency}</td>
                                    <td>{payment.operation}</td>
                                    <td>
                                        {formatNumberWithSpaces(payment.amount)}
                                    </td>
                                    <td>{payment.period}</td>
                                    <td>{payment.cycleDay}</td>
                                    <td>{payment.time}</td>
                                    <td>{payment.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddMode && (
                <AddRegularPaymentModal
                    onAdd={handleAddPayment}
                    onClose={handleCloseModal}
                    assets={assets}
                    financeFields={financeFields}
                />
            )}
            
            {selectedPayment && (
                <ViewEditRegularPaymentModal
                    payment={selectedPayment}
                    onUpdate={handleUpdatePayment}
                    onDelete={handleDeletePayment}
                    onDuplicate={handleDuplicatePayment}
                    onClose={handleCloseModal}
                    assets={assets}
                    financeFields={financeFields}
                />
            )}
        </div>
    );
};

export default RegularPaymentsPage;