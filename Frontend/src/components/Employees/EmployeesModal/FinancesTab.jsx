import React, { useMemo } from 'react';

const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0.00';
  }
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

const toText = (value) => String(value ?? '').trim();
const toLower = (value) => toText(value).toLowerCase();

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const matchesEmployee = (trx, employee) => {
  if (!trx || !employee) return false;
  const employeeId = toText(employee?.id);
  const transactionEmployeeId = toText(trx.employeeId) || toText(trx.employee?.id);
  
  if (employeeId && transactionEmployeeId && employeeId === transactionEmployeeId) return true;

  const employeeName = toLower(employee?.fullName || employee?.full_name);
  const employeeLogin = toLower(employee?.login);
  const counterparty = toLower(trx.counterparty);
  
  if (employeeName && counterparty === employeeName) return true;
  if (employeeLogin && counterparty === employeeLogin) return true;
  
  return false;
};

export default function FinancesTab({ isNew, employee, transactions = [], assets = [] }) {
  
  const filteredTransactions = useMemo(() => {
    if (isNew || !employee) return [];
    
    return transactions
      .filter((trx) => matchesEmployee(trx, employee))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, employee, isNew]);

  const hasAssignedAsset = useMemo(() => {
    if (isNew || !employee) return false;
    
    const employeeId = toText(employee?.id);
    const employeeName = toLower(employee?.fullName || employee?.full_name || employee?.login);

    return assets.some((asset) => {
      const assetEmployeeId = toText(asset?.employeeId ?? asset?.employee?.id);
      if (employeeId && assetEmployeeId && employeeId === assetEmployeeId) return true;
      const assetEmployeeName = toLower(asset?.employeeName ?? asset?.employee);
      if (employeeName && assetEmployeeName && employeeName === assetEmployeeName) return true;
      return false;
    });
  }, [assets, employee, isNew]);

  if (isNew) {
    return (
      <div className="tab-section placeholder-tab">
        <p>Финансовая информация (баланс, транзакции) будет доступна после создания сотрудника.</p>
      </div>
    );
  }

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
            value={hasAssignedAsset ? 'Да' : 'Нет'} 
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

        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((trx) => (
            <div key={trx.id} className="finances-log-row">
              <div className="finances-log-content-wrapper">
                
                <div className="finances-log-cell">
                  <input type="text" value={formatDateTime(trx.date)} readOnly />
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