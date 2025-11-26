import React, { useState, useEffect } from 'react';

const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0.00';
  }
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

// Тестовые данные (MOCK)
const mockTransactions = [
  {
    id: 'mock1',
    date: '15-11-2025',
    category: 'Выплата исполнителю',
    subcategory: 'Аванс по заказу',
    operation: 'Зачисление',
    amount: 250,
    accountCurrency: 'USD',
    orderNumber: 'Z-102'
  },
  {
    id: 'mock2',
    date: '14-11-2025',
    category: 'Корректировка',
    subcategory: 'Штраф',
    operation: 'Списание',
    amount: 150,
    accountCurrency: 'USD',
    orderNumber: 'N/A'
  }
];

export default function FinancesTab({ isNew, employee }) {
  // Инициализируем моковыми данными для теста
  const [transactions, setTransactions] = useState(mockTransactions);

  /* Временно отключена логика загрузки для проверки верстки
  useEffect(() => {
    if (isNew || !employee || !employee.fullName) {
      setTransactions([]);
      return;
    }

    const savedTransactionsRaw = localStorage.getItem('transactionsData');
    if (savedTransactionsRaw) {
      try {
        const allTransactions = JSON.parse(savedTransactionsRaw);
        
        const filtered = allTransactions.filter(
          (trx) => 
            trx.counterparty === employee.fullName &&
            trx.category === 'Выплата исполнителю'
        );

        setTransactions(filtered);
      } catch (e) {
        console.error("Ошибка парсинга транзакций из localStorage:", e);
        setTransactions([]);
      }
    }
  }, [employee, isNew]); 
  */

  if (isNew) {
    return (
      <div className="tab-section placeholder-tab">
        <p>Финансовая информация (баланс, транзакции) будет доступна после создания сотрудника.</p>
      </div>
    );
  }

  const getActiveStatusDisplay = () => {
    if (employee?.status !== 'active') {
      return 'Нет';
    }
    
    const firstCardNumber = employee?.requisites?.[0]?.number;
    return firstCardNumber || 'Нет'; 
  };

  const activeStatusDisplay = getActiveStatusDisplay();

  return (
    <div className="tab-section">
      
      <div className="finance-summary-grid">
        <div className="form-field">
          <label>Баланс</label>
          <input
            type="text"
            value={formatNumberWithSpaces(employee?.balance)}
            disabled 
          />
        </div>

        <div className="form-field">
          <label>Средства на руках</label>
          <input
            type="text"
            value={formatNumberWithSpaces(employee?.cashOnHand)}
            disabled
          />
        </div>

        <div className="form-field">
          <label>Актив</label>
          <input
            type="text"
            value={activeStatusDisplay} 
            disabled
          />
        </div>
      </div>

      <div className="tab-content-title">Журнал операций</div>
      <div className="finances-log-table">
        
        <div className="finances-log-row header-row">
          <div className="finances-log-content-wrapper">
            <div className="finances-log-cell">Дата</div>
            <div className="finances-log-cell">Статья</div>
            <div className="finances-log-cell">Подстатья</div>
            <div className="finances-log-cell">Операция</div>
            <div className="finances-log-cell">Сумма</div>
            <div className="finances-log-cell">Номер заказа</div>
          </div>
        </div>

        {transactions.length > 0 ? (
          transactions.map((trx) => (
            <div key={trx.id} className="finances-log-row">
              <div className="finances-log-content-wrapper">
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.date || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.category || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.subcategory || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.operation || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input
                    type="text"
                    value={`${formatNumberWithSpaces(trx.amount)} ${trx.accountCurrency || ''}`}
                    className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                    readOnly
                  />
                </div>

                <div className="finances-log-cell">
                  <input type="text" value={trx.orderNumber || 'N/A'} readOnly />
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="no-transactions">
            Выплаты этому сотруднику отсутствуют.
          </div>
        )}
      </div>
    </div>
  );
}