import React, { useMemo } from "react";
import Sidebar from "../Sidebar";
import AddTransactionModal from "./AddTransactionModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ViewEditTransactionModal from "./ViewEditTransactionModal";
import "../../styles/TransactionsPage.css";
import { useTransactions } from "../../context/TransactionsContext";

const TransactionsPage = () => {
    
    const {
        transactions,
        assets,
        financeFields,    
        addTransaction,
        updateTransaction,
        deleteTransaction,
        duplicateTransaction,
        openViewEditModal,
        closeViewEditModal,
        isAddModalOpen,
        isViewEditModalOpen,
        selectedTransaction,
        openAddTransactionModal,
        closeAddTransactionModal,
        orders, 
        counterparties,
    } = useTransactions();
    
    const formatNumberWithSpaces = (num) => {
        if (num === null || num === undefined || isNaN(Number(num))) {
            return '0.00';
        }
        const fixedNum = Number(num).toFixed(2);
        const parts = fixedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard
            .writeText(text)
            .then(() => alert("Скопировано!"))
            .catch((err) => console.error("Не удалось скопировать: ", err));
    };

   
    const transactionsWithBalances = useMemo(() => {
        if (!assets.length > 0) {
            return transactions.map(t => ({ ...t, balanceBefore: null, balanceAfter: null }));
        }

        const runningBalances = new Map();
        assets.forEach((asset) => {
            if (asset.id) runningBalances.set(asset.id, asset.balance);
            if (asset.accountName) runningBalances.set(asset.accountName, asset.balance);
        });

        const sortedTransactions = [...transactions];

        sortedTransactions.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateB - dateA !== 0) {
                return dateB - dateA; 
            }
            
            if (a.operation === 'Зачисление' && b.operation !== 'Зачисление') {
                return -1; 
            }
            if (a.operation !== 'Зачисление' && b.operation === 'Зачисление') {
                return 1; 
            }
            return 0;
        });

        return sortedTransactions.map(transaction => {
            // --- ИСПРАВЛЕНИЕ 1: Получаем имя счета корректно, даже если это объект ---
            const accountId =
                transaction.accountId ||
                transaction.account?.id ||
                (typeof transaction.account === 'string' ? transaction.account : null);
            const accountName =
                transaction.accountName ||
                transaction.account?.accountName ||
                (typeof transaction.account === 'string' ? transaction.account : '');
            
            const amount = Number(transaction.amount) || 0;
            const commission = Number(transaction.commission) || 0;
            const netDelta =
                transaction.operation === 'Зачисление'
                    ? amount - commission
                    : amount + commission;

            // Используем имя счета для поиска баланса
            const balanceKey = accountId || accountName;
            const balanceAfter = runningBalances.get(balanceKey) ?? runningBalances.get(accountName) ?? 0;

            let balanceBefore;
            if (transaction.operation === 'Зачисление') {
                balanceBefore = balanceAfter - netDelta;
            } else { 
                balanceBefore = balanceAfter + netDelta;
            }
            
            // Обновляем текущий баланс для следующей итерации (идем от новых к старым)
            if (balanceKey) runningBalances.set(balanceKey, balanceBefore);
            if (accountName && !runningBalances.has(accountName)) {
                runningBalances.set(accountName, balanceBefore);
            }

            return {
                ...transaction,
                balanceBefore,
                balanceAfter,
            };
        });
    }, [transactions, assets]);


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
                            onClick={openAddTransactionModal} 
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
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
                                <th>Баланс до</th>
                                <th>Операция</th>
                                <th>Сумма</th>
                                <th>Баланс после</th> 
                                <th>Контрагент</th>
                                <th>Рекв.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="table-spacer-row"><td colSpan={12}></td></tr>
                            {transactionsWithBalances.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="transaction-row"
                                onClick={() => openViewEditModal(transaction)}
                            >
                                <td>{formatDate(transaction.date)}</td>
                                <td>{transaction.category}</td>
                                <td>{transaction.subcategory}</td>
                                <td>{transaction.description}</td>
                                <td>
                                    <div className="transaction-account-info">
                                        <span className="transaction-account-main-name">
                                            {/* --- ИСПРАВЛЕНИЕ 2: Корректный вывод имени счета --- */}
                                            {transaction.accountName || transaction.account?.accountName || transaction.account}
                                        </span>
                                    </div>
                                </td>
                                <td>{transaction.accountCurrency}</td>

                                
                                <td>{formatNumberWithSpaces(transaction.balanceBefore)}</td>
                                
                                <td>{transaction.operation}</td>

                                <td
                                    className={
                                        transaction.operation === "Зачисление"
                                            ? "amount-positive"
                                            : "amount-negative"
                                    }
                                >
                                    {formatNumberWithSpaces(transaction.amount)}
                                </td>

                                <td>{formatNumberWithSpaces(transaction.balanceAfter)}</td>

                        
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
                                        {transaction.counterpartyRequisites}
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
