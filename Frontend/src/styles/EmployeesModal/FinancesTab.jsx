// src/components/EmployeeModal/FinancesTab.js

import React from 'react';

export default function FinancesTab({ isNew }) {
  const message = isNew
    ? "Финансовая информация (баланс, транзакции) будет доступна после создания сотрудника."
    : "Здесь будет отображаться информация о балансе ЗП и история транзакций.";

  return (
    <div className="tab-section placeholder-tab">
      <p>{message}</p>
    </div>
  );
}