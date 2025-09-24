

import React, { useState, useEffect } from 'react';
import './OrdersTab.css'; 



export default function OrdersTab({ isNew, employee }) {
  const [workHistory, setWorkHistory] = useState([]);
  
  useEffect(() => {
        // Логику выполняем только если это не новый сотрудник и у него есть ID
        if (!isNew && employee?.id) {
            try {
                const allOrdersData = localStorage.getItem('ordersData');
                const allOrders = allOrdersData ? JSON.parse(allOrdersData) : [];

                const employeeWorkLog = [];

                // Проходим по каждому заказу
                allOrders.forEach(order => {
                    // Проверяем, есть ли у заказа журнал работ
                    if (order.work_log && Array.isArray(order.work_log)) {
                        // Проходим по каждой записи в журнале работ
                        order.work_log.forEach(logEntry => {
                            // Ищем совпадение по имени исполнителя (в вашем случае оно в поле role)
                            // Убедитесь, что 'employee.fullName' - это то поле, которое совпадает с 'logEntry.role'
                            if (logEntry.role === employee.fullName) {
                                // Если нашли, добавляем расширенную информацию в наш массив
                                employeeWorkLog.push({
                                    orderId: order.id,
                                    orderDescription: order.orderDescription || 'Без описания',
                                    orderStatus: order.stage,
                                    workDate: logEntry.work_date,
                                    hours: logEntry.hours,
                                    workDescription: logEntry.description,
                                    logId: logEntry.original_id, // Уникальный ключ для записи
                                });
                            }
                        });
                    }
                });
                
                // Сортируем записи по дате от новых к старым
                employeeWorkLog.sort((a, b) => new Date(b.workDate) - new Date(a.workDate));
                
                setWorkHistory(employeeWorkLog);

            } catch (error) {
                console.error("Ошибка при загрузке или обработке истории заказов:", error);
                setWorkHistory([]); // В случае ошибки устанавливаем пустой массив
            }
        }
    }, [employee, isNew]); // Эффект будет перезапускаться, если изменится сотрудник

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
                {workHistory.length > 0 ? (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID Заказа</th>
                                <th>Дата Работы</th>
                                <th>Что было сделано</th>
                                <th>Затрачено часов</th>
                                <th>Статус Заказа</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workHistory.map(log => (
                                <tr key={log.logId}>
                                    <td>{log.orderId}</td>
                                    <td>{log.workDate}</td>
                                    <td>{log.workDescription}</td>
                                    <td>{log.hours}</td>
                                    <td>
                                        <span className={`status-badge status-${log.orderStatus.toLowerCase().replace(' ', '-')}`}>
                                            {log.orderStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Нет записей о выполненной работе для этого сотрудника.</p>
                )}
            </div>
        </div>
    );
}