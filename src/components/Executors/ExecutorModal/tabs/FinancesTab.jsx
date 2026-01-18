import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const executorTransactions = [
    {id: 1, date: '2023-10-26 12:30', category: 'Оплата', subcategory: 'Аванс', account: 'Основной', amount: 5000, accountCurrency: 'UAH', operation: 'Зачисление'},
    {id: 2, date: '2023-10-27 15:00', category: 'Оплата', subcategory: 'Бонус', account: 'Основной', amount: 1500, accountCurrency: 'UAH', operation: 'Зачисление'},
];

export default function FinancesTab({isNew, executor}) {

  return (
    <div className="tab-content-row-column">
        <div className="tab-content-title">Журнал операций</div>
        <div className="executor-payment-log-table">
            <div className="executor-payment-log-header">
                <div>Дата и время</div>
                <div>Статья</div>
                <div>Подстатья</div>
                <div>Сумма операции</div>
            </div>
            
            {executorTransactions.map((trx) => (
                <div key={trx.id} className="executor-payment-log-row">
                    <input type="text" value={trx.date} readOnly />
                    <input type="text" value={trx.category} readOnly />
                    <input type="text" value={trx.subcategory} readOnly />
                    <input 
                        type="text" 
                        value={`${trx.amount.toFixed(2)} ${trx.accountCurrency}`}
                        className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                        readOnly 
                    />
                </div>
            ))}
        </div>
    </div>
  );
}