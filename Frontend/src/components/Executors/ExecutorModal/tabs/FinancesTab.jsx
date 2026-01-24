import React, { useMemo } from 'react';

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

const formatAmount = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
};

export default function FinancesTab({ isNew, executor, transactions = [] }) {
    const orderId = toText(executor?.orderId);
    const orderNumber = toText(executor?.orderNumber);
    const performerName = toLower(executor?.performer);

    const orderTransactions = useMemo(() => {
        const list = Array.isArray(transactions) ? transactions : [];
        return list.filter((trx) => {
            const trxOrderId = toText(trx?.orderId);
            const trxOrderNumber = toText(trx?.orderNumber);
            const trxCounterparty = toLower(trx?.counterparty);
            const orderMatch =
                (orderId && trxOrderId === orderId) ||
                (orderNumber && trxOrderNumber === orderNumber);
            if (!orderMatch) return false;
            if (performerName && trxCounterparty && trxCounterparty !== performerName) return false;
            return true;
        });
    }, [transactions, orderId, orderNumber, performerName]);

    const hasPayments = orderTransactions.length > 0;

    if (isNew) {
        return (
            <div className="tab-content-row-column">
                <div className="placeholder-tab">
                    <p>Финансовые данные будут доступны после сохранения исполнителя.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content-row-column">
            <div className="tab-content-title">Журнал операций</div>
            <div className="finances-log-table">
                <div className="finances-log-row header-row">
                    <div className="finances-log-content-wrapper">
                        <div className="finances-log-cell">Оплаты по заказу</div>
                        <div className="finances-log-cell">{hasPayments ? 'Да' : 'Нет'}</div>
                    </div>
                </div>

                <div className="finances-log-row header-row">
                    <div className="finances-log-content-wrapper">
                        <div className="finances-log-cell">Дата и время</div>
                        <div className="finances-log-cell">Статья</div>
                        <div className="finances-log-cell">Подстатья</div>
                        <div className="finances-log-cell">Сумма операции</div>
                    </div>
                </div>

                {orderTransactions.length > 0 ? (
                    orderTransactions.map((trx) => (
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
                                    <input
                                        type="text"
                                        value={`${formatAmount(trx.amount)} ${trx.accountCurrency || ''}`}
                                        className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-transactions">Оплаты по заказу отсутствуют.</div>
                )}
            </div>
        </div>
    );
}
