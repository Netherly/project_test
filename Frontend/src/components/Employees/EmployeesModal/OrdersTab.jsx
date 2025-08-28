// src/components/EmployeeModal/OrdersTab.js

import React from 'react';
import './OrdersTab.css'; 


const sampleOrders = [
  { id: 'ORD-001', date: '2024-08-20', service: 'Разработка сайта', amount: '1500 USD', status: 'Выполнен' },
  { id: 'ORD-002', date: '2024-08-22', service: 'Дизайн логотипа', amount: '300 USD', status: 'Выполнен' },
  { id: 'ORD-003', date: '2024-08-25', service: 'SEO-оптимизация', amount: '500 USD', status: 'В работе' },
];

export default function OrdersTab({ isNew }) {

  if (isNew) {
    return (
      <div className="tab-section placeholder-tab">
        <p>История заказов будет доступна после создания сотрудника.</p>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div className="orders-history">
        <h3>История выполнения заказов</h3>
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID Заказа</th>
              <th>Дата</th>
              <th>Услуга</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {sampleOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>{order.service}</td>
                <td>{order.amount}</td>
                <td>
                  <span className={`status-badge status-${order.status === 'Выполнен' ? 'completed' : 'in-progress'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}