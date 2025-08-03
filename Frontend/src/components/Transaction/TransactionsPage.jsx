import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import AddTransactionModal from "./AddTransactionModal";
import ViewEditTransactionModal from "./ViewEditTransactionModal";
import "../../styles/TransactionsPage.css";

const TransactionsPage = () => {
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
        return [...parsedTransactions].sort(
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    localStorage.setItem("transactionsData", JSON.stringify(transactions));
  }, [transactions]);

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Скопировано!"))
      .catch((err) => console.error("Не удалось скопировать: ", err));
  };

  const handleAddTransaction = (newTransaction) => {
    if (!Array.isArray(newTransaction)) {
      setTransactions((prevTransactions) => {
        const updatedTransactions = [...prevTransactions, newTransaction];
        return updatedTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      });
    } else {
      setTransactions((prevTransactions) => {
        const updatedTransactions = [...prevTransactions, ...newTransaction];
        return updatedTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      });
    }
  };

  const handleUpdateTransaction = (updatedTransaction) => {
    setTransactions((prevTransactions) => {
      const updatedTransactionsList = prevTransactions.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? updatedTransaction
          : transaction
      );
      return updatedTransactionsList.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    });
    setIsViewEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = (transactionId) => {
    setTransactions((prevTransactions) =>
      prevTransactions.filter((t) => t.id !== transactionId)
    );
  };

  const handleDuplicateTransaction = (transactionToDuplicate) => {
    const newTransaction = {
      ...transactionToDuplicate,
      id: `DUPLICATE_${Date.now()}`,
      description: `(Копия) ${transactionToDuplicate.description}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setTransactions((prevTransactions) => {
      const updatedTransactions = [...prevTransactions, newTransaction];
      return updatedTransactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    });
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsViewEditModalOpen(true);
  };

  return (
    <div className="transactions-page">
      <Sidebar />
      <div className="transactions-page-main-container">
        <header className="transactions-header-container">
          <h1 className="transactions-title">Транзакции</h1>
          <div className="add-transaction-wrapper">
            <button
              className="add-transaction-button"
              onClick={() => setIsAddModalOpen(true)}
            >
              ➕ Добавить транзакцию
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
                <th>Валюта счета</th>
                <th>Операция</th>
                <th>Сумма операции</th>
                <th>Контрагент</th>
                <th>Реквизиты контрагента</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
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
                  <td>{transaction.operation}</td>
                  <td
                    className={
                      transaction.operation === "Зачисление"
                        ? "amount-positive"
                        : "amount-negative"
                    }
                  >
                    {transaction.amount.toFixed(2)}
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
        />
      )}
    </div>
  );
};

export default TransactionsPage;