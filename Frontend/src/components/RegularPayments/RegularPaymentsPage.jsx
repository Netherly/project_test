
import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import AddRegularPaymentModal from "./AddRegularPaymentModal";
import ViewEditRegularPaymentModal from "./ViewEditRegularPaymentModal"; 
import "../../styles/RegularPaymentsPage.css";
import * as paymentApi from './regularPayments';
import FormattedDate from "../FormattedDate";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon";

const RegularPaymentsPage = () => {
    const [regularPayments, setRegularPayments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [financeFields, setFinanceFields] = useState({});
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

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

    
    const handleAddPayment = (newPaymentData) => {
        const updatedPayments = paymentApi.addRegularPayment(newPaymentData);
        setRegularPayments(updatedPayments);
    };
    
    const handleUpdatePayment = (updatedPaymentData) => {
        const updatedPayments = paymentApi.updateRegularPayment(updatedPaymentData);
        setRegularPayments(updatedPayments);
        closeViewEditModal(); 
    };

    const handleDeletePayment = (paymentId) => {
        const updatedPayments = paymentApi.deleteRegularPayment(paymentId);
        setRegularPayments(updatedPayments);
        closeViewEditModal(); 
    };
    
    
    const handleDuplicatePayment = (paymentToDuplicate) => {
        const updatedPayments = paymentApi.duplicateRegularPayment(paymentToDuplicate);
        setRegularPayments(updatedPayments);
        closeViewEditModal(); 
    };

    
    const openAddModal = () => setIsAddModalOpen(true);
    const closeAddModal = () => setIsAddModalOpen(false);

    const openViewEditModal = (payment) => {
        setSelectedPayment(payment);
        setIsViewEditModalOpen(true);
    };
    const closeViewEditModal = () => {
        setSelectedPayment(null);
        setIsViewEditModalOpen(false);
    };

    const getAccountNameById = (accountId) => {
        const account = assets.find(a => a.id === accountId);
        return account ? account.accountName : accountId;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year}`;
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
                        Регулярные платежи
                        </h1>
                    <div className="add-payment-wrapper">
                        <button className="add-payment-button" onClick={openAddModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
                        </button>
                    </div>
                </header>

                <div className="regular-payments-table-container">
                    <table className="regular-payments-table">
                        <thead>
                            <tr>
                                <th>Дата начала</th>
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
                                <th>Следующий платеж</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regularPayments.map((payment) => (
                                <tr key={payment.id} className="regular-payment-row" onClick={() => openViewEditModal(payment)}>
                                    <td>{formatDate(payment.startDate)}</td>
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
                                    <td>
                                        <span className={`status-chip status-${payment.status === 'Активен' ? 'active' : 'paused'}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(payment.nextPaymentDate || 'N/A')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddRegularPaymentModal
                    onAdd={handleAddPayment}
                    onClose={closeAddModal}
                    assets={assets}
                    financeFields={financeFields}
                />
            )}
            
            
            {isViewEditModalOpen && selectedPayment && (
                <ViewEditRegularPaymentModal
                    payment={selectedPayment}
                    onUpdate={handleUpdatePayment}
                    onDelete={handleDeletePayment}
                    onDuplicate={handleDuplicatePayment}
                    onClose={closeViewEditModal}
                    assets={assets}
                    financeFields={financeFields}
                />
            )}
        </div>
    );
};

export default RegularPaymentsPage;