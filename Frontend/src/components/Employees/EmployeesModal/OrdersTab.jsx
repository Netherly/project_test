import React, { useState, useEffect } from 'react';
import { fetchOrders } from '../../../api/orders';
import './OrdersTab.css';

const toText = (value) => String(value ?? '').trim();
const toLower = (value) => toText(value).toLowerCase();

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getOrderLabel = (order) =>
  toText(order?.numberOrder ?? order?.orderSequence ?? order?.id ?? '');

const getOrderStatus = (order) =>
  toText(order?.stage ?? order?.orderStatus ?? order?.status ?? '');

const extractPerformers = (order) => {
  const performers =
    order?.performers ??
    order?.meta?.performers ??
    order?.meta?.performer ??
    order?.meta?.executor;
  return Array.isArray(performers) ? performers : [];
};

const pickOrderDate = (order) =>
  order?.completedDate ||
  order?.endDate ||
  order?.startDate ||
  order?.orderDate ||
  order?.date ||
  order?.createdAt ||
  '';

const matchesEmployee = (order, employee) => {
  if (!order || !employee) return false;
  const employeeId = toText(employee?.id);
  const orderEmployeeId = toText(order?.employeeId ?? order?.employee?.id);
  if (employeeId && orderEmployeeId && employeeId === orderEmployeeId) return true;
  const employeeName = toLower(employee?.fullName || employee?.full_name);
  const orderEmployeeName = toLower(order?.employee?.full_name || order?.employee?.fullName);
  if (employeeName && orderEmployeeName && employeeName === orderEmployeeName) return true;
  return false;
};

const buildRowsFromOrders = (orders, employee) => {
  const rows = [];
  (Array.isArray(orders) ? orders : []).forEach((order) => {
    const orderMatches = matchesEmployee(order, employee);
    const orderLabel = getOrderLabel(order) || toText(order?.id);
    const orderStatus = getOrderStatus(order) || '-';
  const orderDescription = toText(order?.orderDescription ?? order?.name ?? order?.title ?? '-');

  const performers = extractPerformers(order);
    const performerMatch = performers.find((performer) => {
      const performerEmployeeId = toText(performer?.employeeId ?? performer?.employee?.id);
      if (performerEmployeeId && performerEmployeeId === toText(employee?.id)) return true;
      const performerName = toLower(performer?.performer ?? performer?.name ?? performer?.fullName);
      const employeeName = toLower(employee?.fullName || employee?.full_name);
      return performerName && employeeName && performerName === employeeName;
    });

    if (performerMatch) {
      rows.push({
        orderId: orderLabel,
        workDescription:
          toText(performerMatch?.orderDescription ?? performerMatch?.description) ||
          orderDescription,
        orderStatus,
        workDate: performerMatch?.orderDate ?? pickOrderDate(order),
        hours: toText(performerMatch?.calculatedWorkTime ?? performerMatch?.hours ?? ''),
        logId: performerMatch?.id ?? `${order?.id || orderLabel}-performer`,
      });
      return;
    }

    if (orderMatches) {
      rows.push({
        orderId: orderLabel,
        workDescription: orderDescription,
        orderStatus,
        workDate: pickOrderDate(order),
        hours: toText(order?.executionTime ?? order?.countDays ?? ''),
        logId: order?.id || orderLabel,
      });
    }
  });

  return rows.sort((a, b) => new Date(b.workDate) - new Date(a.workDate));
};

export default function OrdersTab({ isNew, employee }) {
  const [workHistory, setWorkHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      if (isNew || !employee) {
        if (mounted) {
          setWorkHistory([]);
          setLoadError('');
        }
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetchOrders({ page: 1, limit: 1000 });
        const orders = Array.isArray(response?.orders)
          ? response.orders
          : Array.isArray(response)
          ? response
          : [];

        const rows = buildRowsFromOrders(orders, employee);
        if (mounted) setWorkHistory(rows);
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        let fallbackOrders = [];
        try {
          const saved = localStorage.getItem('ordersData');
          fallbackOrders = saved ? JSON.parse(saved) : [];
        } catch (err) {
          fallbackOrders = [];
        }

        const rows = buildRowsFromOrders(fallbackOrders, employee);
        if (mounted) {
          setWorkHistory(rows);
          setLoadError('Не удалось загрузить заказы с сервера.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [employee, isNew]);

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
        {isLoading && <p>Загрузка заказов...</p>}
        {!isLoading && !!loadError && <p>{loadError}</p>}
        {!isLoading && workHistory.length > 0 ? (
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
              {workHistory.map((log) => {
                const statusClass = toText(log.orderStatus)
                  .toLowerCase()
                  .replace(/\s+/g, '-');
                return (
                  <tr key={log.logId}>
                    <td>{log.orderId}</td>
                    <td>{formatDate(log.workDate)}</td>
                    <td>{log.workDescription || '-'}</td>
                    <td>{log.hours || '-'}</td>
                    <td>
                      <span className={`status-badge status-${statusClass || 'unknown'}`}>
                        {log.orderStatus || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          !isLoading && <p>Нет записей о выполненной работе для этого сотрудника.</p>
        )}
      </div>
    </div>
  );
}
