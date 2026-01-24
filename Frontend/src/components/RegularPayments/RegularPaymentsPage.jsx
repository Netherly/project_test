
import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import AddRegularPaymentModal from "./AddRegularPaymentModal";
import ViewEditRegularPaymentModal from "./ViewEditRegularPaymentModal"; 
import "../../styles/RegularPaymentsPage.css";
import { fetchAssets } from "../../api/assets";
import { fetchFields, withDefaults } from "../../api/fields";
import {
    fetchRegularPayments,
    createRegularPayment,
    updateRegularPayment,
    deleteRegularPayment,
    duplicateRegularPayment,
} from "../../api/regular-payments";

const RegularPaymentsPage = () => {
    const [regularPayments, setRegularPayments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [financeFields, setFinanceFields] = useState({});
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [payments, assetsData, fieldsData] = await Promise.all([
                    fetchRegularPayments(),
                    fetchAssets(),
                    fetchFields(),
                ]);
                if (!mounted) return;
                setRegularPayments(Array.isArray(payments) ? payments : []);
                setAssets(Array.isArray(assetsData) ? assetsData : []);
                const normalized = withDefaults(fieldsData);
                setFinanceFields(normalized.financeFields || {});
            } catch (e) {
                console.error("Failed to load regular payments data:", e);
                if (mounted) {
                    setRegularPayments([]);
                    setAssets([]);
                    setFinanceFields({});
                }
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    
    const handleUpdatePayment = async (updatedPaymentData) => {
        const updated = await updateRegularPayment(updatedPaymentData.id, updatedPaymentData);
        setRegularPayments((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
        );
        closeViewEditModal();
    };

    const handleDeletePayment = async (paymentId) => {
        await deleteRegularPayment(paymentId);
        setRegularPayments((prev) => prev.filter((p) => p.id !== paymentId));
        closeViewEditModal();
    };
    
    
    const handleDuplicatePayment = async (paymentToDuplicate) => {
        const created = await duplicateRegularPayment(paymentToDuplicate.id);
        setRegularPayments((prev) => [created, ...prev]);
        closeViewEditModal();
    };

    
    const openAddModal = () => setIsAddModalOpen(true);
    const closeAddModal = () => setIsAddModalOpen(false);

    const handleAddPayment = async (newPaymentData) => {
        const created = await createRegularPayment(newPaymentData);
        setRegularPayments((prev) => [created, ...prev]);
    };

    const openViewEditModal = (payment) => {
        setSelectedPayment(payment);
        setIsViewEditModalOpen(true);
    };
    const closeViewEditModal = () => {
        setSelectedPayment(null);
        setIsViewEditModalOpen(false);
    };

    const getAccountNameById = (accountId, fallbackName) => {
        const account = assets.find((a) => a.id === accountId);
        return account?.accountName || fallbackName || accountId;
    };

    const formatDate = (dateString, timeString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const year = date.getFullYear();
            
            // Время берем из timeString (которое 'HH:mm'), если оно есть
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
                                    <td>{getAccountNameById(payment.account, payment.accountName)}</td>
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
