import React from 'react';
import '../../styles/ExecutorCard.css';

const ExecutorCard = ({ order, onCardClick, onOpenOrderModal, formatDate }) => {

    const handleCardClick = () => {
        if (onCardClick) {
            onCardClick(order);
        }
    };

    const handleOpenModalClick = (event) => {
        event.stopPropagation();
        if (onOpenOrderModal) {
            onOpenOrderModal(order.orderId);
        }
    };
    
    const paymentDue = order.calculatedPaymentDue || 0;

    const truncateText = (text, maxLength) => {
        if (!text) return 'Описание отсутствует';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    return (
        <div className="executor-card" 
             onClick={handleCardClick}
             data-tooltip={order.orderStatus}> 

            <div className="card-header">
                <div className="status-and-number">
                    <span className="order-status-emoji" title={order.orderStatus}>
                        {order.orderStatusEmoji || '🔘'}
                    </span>
                    <span className="order-number-link" onClick={handleOpenModalClick}>
                        Заказ № {order.orderId}
                    </span>
                </div>
                <div className="date-and-arrow">
                    <span className="order-date">{formatDate(order.orderDate)}</span>
                </div>
            </div>

            <p className="performer-role">Роль: {order.performerRole || 'Роль не указана'}</p>

            <div className="card-body">
                <p className="order-name">{order.orderName || 'Название заказа отсутствует'}</p>
                <p>Клиент: <strong>{order.clientHidden ? 'Скрыт' : order.order_main_client}</strong></p>
                <p className="order-description">{truncateText(order.orderDescription, 150)}</p>
                <p>Время работы: <strong>{order.calculatedWorkTime || 'Не указано'}</strong></p>
            </div>

            <div className="executor-card-footer">
                <div className="footer-amount">
                    <span>Сумма:</span>
                    <strong>{(order.orderSum || 0).toFixed(2)} {order.orderCurrency}</strong>
                </div>
                <div className="footer-amount">
                    <span>К оплате:</span>
                    <strong>{paymentDue.toFixed(2)} {order.orderCurrency}</strong>
                </div>
            </div>
        </div>
    );
};

export default ExecutorCard;