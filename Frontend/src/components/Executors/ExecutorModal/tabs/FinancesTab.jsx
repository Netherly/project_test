import React from 'react';

const executorTransactions = [
    {id: 1, date: '2023-10-26 12:30', category: 'Оплата', subcategory: 'Аванс', account: 'Основной', amount: 5000, accountCurrency: 'UAH', operation: 'Зачисление'},
    {id: 2, date: '2023-10-27 15:00', category: 'Оплата', subcategory: 'Бонус', account: 'Основной', amount: 1500, accountCurrency: 'UAH', operation: 'Зачисление'},
];

export default function FinancesTab({isNew, executor}) {

  return (
    <div className="tab-content-row-column">
        <div className="tab-content-title">Журнал операций</div>

        {/* */}
        <div className="finances-log-table">
            
            {/* Заголовок */}
            <div className="finances-log-row header-row">
                <div className="finances-log-content-wrapper">
                    <div className="finances-log-cell">Дата и время</div>
                    <div className="finances-log-cell">Статья</div>
                    <div className="finances-log-cell">Подстатья</div>
                    <div className="finances-log-cell">Сумма операции</div>
                </div>
            </div>
            
            {/* Строки данных */}
            {executorTransactions.map((trx) => (
                <div key={trx.id} className="finances-log-row">
                    <div className="finances-log-content-wrapper">
                        <div className="finances-log-cell">
                            <input type="text" value={trx.date} readOnly />
                        </div>
                        <div className="finances-log-cell">
                            <input type="text" value={trx.category} readOnly />
                        </div>
                        <div className="finances-log-cell">
                            <input type="text" value={trx.subcategory} readOnly />
                        </div>
                        <div className="finances-log-cell">
                            <input 
                                type="text" 
                                value={`${trx.amount.toFixed(2)} ${trx.accountCurrency}`}
                                className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                                readOnly 
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        {/* */}
    </div>
  );
}