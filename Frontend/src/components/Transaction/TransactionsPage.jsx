import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import AddTransactionModal from "./AddTransactionModal";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import ViewEditTransactionModal from "./ViewEditTransactionModal";
import "../../styles/TransactionsPage.css";
import { useTransactions } from "../../context/TransactionsContext";
import FormattedDate from "../FormattedDate.jsx";

const TransactionsPage = () => {

    const {
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

    const defaultTransactions = [
        {
            id: "T001",
            date: "2025-07-27 10:30",
            category: "Продажи",
            subcategory: "Онлайн-продажи",
            description: "Оплата за товар #12345",
            account: "ПриватБанк - Ключ к счету",
            accountCurrency: "UAH",
            operation: "Зачисление",
            amount: 1500.00,
            counterparty: "Иванов И.И.",
            counterpartyRequisites: "UA987654321098765432109876543",
        },
        {
            id: "T002",
            date: "2025-07-26 15:00",
            category: "Расходы",
            subcategory: "Закупка материалов",
            description: "Оплата поставщику за сырье",
            account: "Монобанк - Черная (V) (0574)",
            accountCurrency: "UAH",
            operation: "Списание",
            amount: 500.50,
            counterparty: "ООО 'Поставщик'",
            counterpartyRequisites: "EDRPOU 12345678",
        },
        {
            id: "T003",
            date: "2025-07-25 09:00",
            category: "Зарплата",
            subcategory: "Выдача ЗП",
            description: "Выплата зарплаты сотруднику",
            account: "ПриватБанк - Ключ к счету",
            accountCurrency: "UAH",
            operation: "Списание",
            amount: 10000.00,
            counterparty: "Петров П.П.",
            counterpartyRequisites: "Паспорт СН123456",
        },
        {
            id: "T004",
            date: "2025-07-24 11:45",
            category: "Инвестиции",
            subcategory: "Покупка криптовалюты",
            description: "Покупка USDT на бирже",
            account: "Binance - Спотовый",
            accountCurrency: "USDT",
            operation: "Зачисление",
            amount: 50.00,
            counterparty: "Binance Exchange",
            counterpartyRequisites: "Binance ID: 987654321",
        },
        {
            id: "T005",
            date: "2025-07-23 18:20",
            category: "Доходы",
            subcategory: "Возврат средств",
            description: "Возврат переплаты от клиента",
            account: "Монобанк - Черная (V) (0574)",
            accountCurrency: "UAH",
            operation: "Зачисление",
            amount: 200.00,
            counterparty: "ООО 'Клиент'",
            counterpartyRequisites: "ИНН 87654321",
        },
        {
            id: "T006",
            date: "2025-07-22 09:00",
            category: "Налоги",
            subcategory: "Уплата ЕСВ",
            description: "Уплата единого социального взноса",
            account: "ПриватБанк - Ключ к счету",
            accountCurrency: "UAH",
            operation: "Списание",
            amount: 2500.00,
            counterparty: "Государственная Налоговая Служба",
            counterpartyRequisites: "UA456789012345678901234567890",
        },
    ];

    const [transactions, setTransactions] = useState(() => {
        const savedTransactions = localStorage.getItem("transactionsData");
        if (savedTransactions) {
            try {
                const parsedTransactions = JSON.parse(savedTransactions);
                return parsedTransactions.flat().sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
            } catch (e) {
                console.error("Ошибка парсинга localStorage:", e);
                return [...defaultTransactions].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
            }
        }
        return [...defaultTransactions].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );
    });

    const [assets, setAssets] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [financeFields, setFinanceFields] = useState({ articles: [], subarticles: [] });



    
    useEffect(() => {
        const savedAssets = localStorage.getItem('assetsData');
        if (savedAssets) {
            try {
                setAssets(JSON.parse(savedAssets));
            } catch (e) {
                console.error("Ошибка парсинга активов из localStorage:", e);
                setAssets([]);
            }
        }

        
        const savedFields = localStorage.getItem('fieldsData');
        if (savedFields) {
            try {
                const parsedFields = JSON.parse(savedFields);
                if (parsedFields.financeFields) {
                    setFinanceFields(parsedFields.financeFields);
                }
            } catch (e) {
                console.error("Ошибка парсинга полей финансов из localStorage:", e);
            }
        }
    }, []);
    
    useEffect(() => {
        localStorage.setItem("transactionsData", JSON.stringify(transactions));
        updateAssetsInLocalStorage(transactions);
    }, [transactions]);

    
    const updateAssetsInLocalStorage = (updatedTransactions) => {
        const savedAssets = JSON.parse(localStorage.getItem('assetsData')) || [];
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
    };

    const copyToClipboard = (text) => {
        navigator.clipboard
            .writeText(text)
            .then(() => alert("Скопировано!"))
            .catch((err) => console.error("Не удалось скопировать: ", err));
    };

    const handleAddTransaction = (newTransaction) => {
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const handleUpdateTransaction = (updatedTransaction) => {
        const updatedTransactionsList = transactions.map((transaction) =>
            transaction.id === updatedTransaction.id
                ? updatedTransaction
                : transaction
        );
        setTransactions(updatedTransactionsList.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setIsViewEditModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleDeleteTransaction = (transactionId) => {
        const updatedTransactions = transactions.filter((t) => t.id !== transactionId);
        setTransactions(updatedTransactions);
    };

    const handleDuplicateTransaction = (transactionToDuplicate) => {
        const newTransaction = {
            ...transactionToDuplicate,
            id: `DUPLICATE_${Date.now()}`,
            description: `(Копия) ${transactionToDuplicate.description}`,
            date: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const handleTransactionClick = (transaction) => {
        setSelectedTransaction(transaction);
        setIsViewEditModalOpen(true);
    };

    const transactionsWithBalances = useMemo(() => {
        if (!assets.length > 0) {
            return transactions.map(t => ({ ...t, balanceBefore: null, balanceAfter: null }));
        }

        const finalBalances = new Map(assets.map(asset => [asset.accountName, asset.balance]));
        const runningBalances = new Map(finalBalances);

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
            const account = transaction.account;
            const amount = Number(transaction.amount) || 0;

            const balanceAfter = runningBalances.get(account) ?? 0;

            let balanceBefore;
            if (transaction.operation === 'Зачисление') {
                balanceBefore = balanceAfter - amount;
            } else { 
                balanceBefore = balanceAfter + amount;
            }
            
            runningBalances.set(account, balanceBefore);

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
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Добавить
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
                                <th>Баланс после</th> 
                                <th>Сумма операции</th>
                                <th>Контрагент</th>
                                <th>Рекв.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactionsWithBalances.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="transaction-row"
                                onClick={() => handleTransactionClick(transaction)}
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

                                
                                <td>{formatNumberWithSpaces(transaction.balanceBefore)}</td>
                                
                                <td>{transaction.operation}</td>

                                
                                <td>{formatNumberWithSpaces(transaction.balanceAfter)}</td>

                                <td
                                    className={
                                        transaction.operation === "Зачисление"
                                            ? "amount-positive"
                                            : "amount-negative"
                                    }
                                >
                                    {formatNumberWithSpaces(transaction.amount)}
                                </td>
                                <td>{transaction.counterparty}</td>
                                <td>
                                    <div className="copy-button-container">
                                        {transaction.counterpartyRequisites}
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
                    onAdd={handleAddTransaction}
                    onClose={() => setIsAddModalOpen(false)}
                    assets={assets} 
                    financeFields={financeFields}
                    orders={orders}
                    counterparties={counterparties}
                />
            )}

            {isViewEditModalOpen && selectedTransaction && (
                <ViewEditTransactionModal
                    transaction={selectedTransaction}
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                    onDuplicate={handleDuplicateTransaction}
                    onClose={() => {
                        setIsViewEditModalOpen(false);
                        setSelectedTransaction(null);
                    }}
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