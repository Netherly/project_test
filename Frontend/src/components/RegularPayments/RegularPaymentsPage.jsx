import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import AddRegularPaymentModal from "./AddRegularPaymentModal";
import ViewEditRegularPaymentModal from "./ViewEditRegularPaymentModal";
import "../../styles/RegularPaymentsPage.css";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon";
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
  const navigate = useNavigate();
  const { paymentId } = useParams();

  const [regularPayments, setRegularPayments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [financeFields, setFinanceFields] = useState({});

  const selectedPayment = useMemo(() => {
    if (!paymentId || paymentId === "new") return null;
    return regularPayments.find((p) => String(p.id) === String(paymentId)) || null;
  }, [regularPayments, paymentId]);

  const isAddMode = paymentId === "new";

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

  const handleCloseModal = () => {
    navigate("/regular");
  };

  const openAddModal = () => {
    navigate("/regular/new");
  };

  const openViewEditModal = (payment) => {
    navigate(`/regular/${payment.id}`);
  };

  const handleAddPayment = async (newPaymentData) => {
    const created = await createRegularPayment(newPaymentData);
    setRegularPayments((prev) => [created, ...prev]);
    handleCloseModal();
  };

  const handleUpdatePayment = async (updatedPaymentData) => {
    const updated = await updateRegularPayment(updatedPaymentData.id, updatedPaymentData);
    setRegularPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    handleCloseModal();
  };

  const handleDeletePayment = async (id) => {
    await deleteRegularPayment(id);
    setRegularPayments((prev) => prev.filter((p) => p.id !== id));
    handleCloseModal();
  };

  const handleDuplicatePayment = async (paymentToDuplicate) => {
    const created = await duplicateRegularPayment(paymentToDuplicate.id);
    setRegularPayments((prev) => [created, ...prev]);
    handleCloseModal();
  };

  const getAccountNameById = (accountId, fallbackName) => {
    const account = assets.find((a) => a.id === accountId);
    return account?.accountName || fallbackName || accountId;
  };

  const formatDate = (dateString, timeString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const time = timeString ? ` ${timeString}` : "";
    return `${day}.${month}.${year}${time}`;
  };

  const formatNumberWithSpaces = (num) => {
    if (num === null || num === undefined || isNaN(Number(num))) {
      return "0.00";
    }
    const fixedNum = Number(num).toFixed(2);
    const parts = fixedNum.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-plus-icon lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>{" "}
              Добавить
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
              <tr className="table-spacer-row">
                <td colSpan={12}></td>
              </tr>
              {regularPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="regular-payment-row"
                  onClick={() => openViewEditModal(payment)}
                >
                  <td>{formatDate(payment.nextPaymentDate, payment.time)}</td>
                  <td>{payment.category}</td>
                  <td>{payment.subcategory}</td>
                  <td>{payment.description}</td>
                  <td>{getAccountNameById(payment.account, payment.accountName)}</td>
                  <td>{payment.accountCurrency}</td>
                  <td>{payment.operation}</td>
                  <td>{formatNumberWithSpaces(payment.amount)}</td>
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
