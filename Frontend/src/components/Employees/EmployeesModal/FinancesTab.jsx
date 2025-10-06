import React, { useState, useEffect } from 'react';


export default function FinancesTab({ isNew, employee }) {
 
  const [transactions, setTransactions] = useState([]);

  
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


  if (isNew) {
    return (
      <div className="tab-section placeholder-tab">
        <p>Финансовая информация (баланс, транзакции) будет доступна после создания сотрудника.</p>
      </div>
    );
  }

  
  return (
    <div className="tab-section">
      <div className="tab-content-title">Журнал операций</div>
      <div className="payment-log-table">
        
        <div className="payment-log-header">
          <div>Дата</div>
          <div>Статья</div>
          <div>Подстатья</div>
          <div>Операция</div>
          <div>Сумма</div>
          <div>Номер заказа</div>
        </div>

        
        {transactions.length > 0 ? (
          transactions.map((trx) => (
            <div key={trx.id} className="payment-log-row">
              <input type="text" value={trx.date || ''} readOnly />
              <input type="text" value={trx.category || ''} readOnly />
              <input type="text" value={trx.subcategory || ''} readOnly />
              <input type="text" value={trx.operation || ''} readOnly />
              <input
                type="text"
                value={`${trx.amount?.toFixed(2) || '0.00'} ${trx.accountCurrency || ''}`}
    
                className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                readOnly
              />
              <input type="text" value={trx.orderNumber || 'N/A'} readOnly />
            </div>
          ))
        ) : (
          <div className="no-transactions" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Выплаты этому сотруднику отсутствуют.
          </div>
        )}
      </div>
    </div>
  );
}