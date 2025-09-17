import React from 'react';
import '../../styles/ExecutorCard.css'; 

const ExecutorCard = ({ order, userSettings, onCardClick }) => {
    const handleClick = () => {
        onCardClick(order);
    };
<<<<<<< HEAD
=======

    
    const paymentDue = order.calculatedPaymentDue || 0;

>>>>>>> Alexander
    return (
        <div className="executor-card" onClick={handleClick}>
            <div className="card-header">
                <span className="order-number">{order.orderNumber}</span>
                <span className="order-status-emoji" title={order.orderStatus}>
                    {order.orderStatusEmoji}
                </span>
            </div>
            <div className="card-body">
                <p className="order-date">{order.orderDate}</p>
                <p className="order-description">{order.description}</p>
                <div className="order-details">
                    <p>Клиент: <strong>{order.clientHidden ? 'Скрыт' : order.client}</strong></p>
                    <p>Роль: <strong>{order.performerRole}</strong></p>
                </div>
            </div>
            <div className="card-footer">
                <div className="order-sum">
                    <span>Сумма:</span>
                    <strong>{(order.orderSum || 0).toFixed(2)} {order.orderCurrency}</strong>
                </div>
                <div className="payment-info">
                    <span>Остаток:</span>
                    <strong>{paymentDue.toFixed(2)} {userSettings.currency}</strong>
                </div>
            </div>
        </div>
    );
};

export default ExecutorCard;