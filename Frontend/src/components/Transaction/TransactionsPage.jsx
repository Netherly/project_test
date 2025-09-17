import React from "react";
import Sidebar from "../Sidebar";
import AddTransactionModal from "./AddTransactionModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ViewEditTransactionModal from "./ViewEditTransactionModal";
import "../../styles/TransactionsPage.css";
import { useTransactions } from '../../context/TransactionsContext'; 

const TransactionsPage = () => {
    const {
        transactions,
        assets,
        financeFields,
        isAddModalOpen,
        isViewEditModalOpen,
        selectedTransaction,
        initialDataForModal,
        openAddTransactionModal,
        closeAddTransactionModal,
        openViewEditModal,
        closeViewEditModal,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        duplicateTransaction,
        orders,
        counterparties,
    } = useTransactions();

    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => alert("Скопировано!"))
            .catch((err) => console.error("Не удалось скопировать: ", err));
    };

    
    return (
        <div className="transactions-page">
            <Sidebar />
            <div className="transactions-page-main-container">
                <header className="transactions-header-container">
                    <h1 className="transactions-title">
                    <PageHeaderIcon pageName="Транзакции" />
                    Транзакции
                    </h1>
                    <div className="add-transaction-wrapper">
                        <button
                            className="add-transaction-button"
                            onClick={() => openAddTransactionModal()} 
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить транзакцию
                        </button>
                    </div>
                </header>

                <div className="transactions-table-container">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Статья</th>
                                <th>Подстатья</th>
                                <th>Описание</th>
                                <th>Счет</th>
                                <th>Валюта</th>
                                <th>Операция</th>
                                <th>Сумма</th>
                                <th>Контрагент</th>
                                <th>Реквизиты</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="transaction-row"
                                    onClick={() => openViewEditModal(transaction)} // <-- Используем функцию из контекста
                                >
                                    <td>{transaction.date}</td>
                                    <td>{transaction.category}</td>
                                    <td>{transaction.subcategory}</td>
                                    <td>{transaction.description}</td>
                                    <td>
                                        <div className="account-info">
                                            <span className="account-main-name">
                                                {transaction.account}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{transaction.accountCurrency}</td>
                                    <td>{transaction.operation}</td>
                                    <td
                                        className={
                                            transaction.operation === "Зачисление"
                                                ? "amount-positive"
                                                : "amount-negative"
                                        }
                                    >
                                        {transaction.amount}
                                    </td>
                                    <td>{transaction.counterparty}</td>
                                    <td>
                                        <div className="copy-button-container">
                                            <span
                                                className="copy-button-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    copyToClipboard(transaction.counterpartyRequisites);
                                                }}
                                                title="Копировать реквизиты"
                                            ></span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            
            {isAddModalOpen && (
                <AddTransactionModal
                    onAdd={addTransaction}
                    onClose={closeAddTransactionModal}
                    assets={assets}
                    financeFields={financeFields}
                    initialData={initialDataForModal}
                    orders={orders}
                    counterparties={counterparties} 
                />
            )}

            {isViewEditModalOpen && selectedTransaction && (
                <ViewEditTransactionModal
                    transaction={selectedTransaction}
                    onUpdate={updateTransaction}
                    onDelete={deleteTransaction}
                    onDuplicate={duplicateTransaction}
                    onClose={closeViewEditModal}
                    assets={assets}
                    financeFields={financeFields}
                    orders={orders}
                    counterparties={counterparties} 
                />
            )}
        </div>
    );
};

export default TransactionsPage;