import React from 'react';
import { useFormContext } from 'react-hook-form';
import '../../../styles/OrderSummary.css';


const getInitials = (name = '') => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
        return words[0][0] + words[1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


const OrderSummary = () => {
    const { watch } = useFormContext();
    const formData = watch();

    
    const {
        id,
        orderDescription = 'Нет описания',
        client_company = 'Клиент не указан', 
        performers = [],
        budget = 0,
        appealDate,
        plannedStartDate,
        plannedFinishDate,
        work_log = [], 
        techTags = [], 
        stage = 'Не определен', 
        tags = [] 
    } = formData;

    
    const totalBudget = parseFloat(budget) || 0;

    const totalExecutorCost = performers.reduce((acc, performer) => {
        const cost = parseFloat(performer.orderSum) || 0; 
        return acc + cost;
    }, 0);

    const profit = totalBudget - totalExecutorCost;
    const profitability = totalBudget > 0 ? (profit / totalBudget) * 100 : 0;
    const profitClass = profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'zero';

    
    const totalMinutes = work_log.reduce((acc, entry) => {
        if (!entry.hours || typeof entry.hours !== 'string') return acc;
        const parts = entry.hours.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return acc + (hours * 60) + minutes;
    }, 0);
    
    const totalHoursSpent = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const formattedTime = `${totalHoursSpent} ч ${remainingMinutes} мин`;

    return (
        <div className="order-summary-tab">
            <div className="summary-grid">
                
                
                <div className="summary-card main-info-card">
                    <div className="summary-card-header">
                        <span role="img" aria-label="info">ℹ️</span>
                        <h3>Основная информация</h3>
                    </div>
                    <div className="summary-card-body">
                        <p><strong>Заказ:</strong> #{id || 'Новый'}</p>
                        <p><strong>Клиент:</strong> {client_company}</p>
                        
                        <div className="stage-info">
                            <strong>Статус:</strong>
                            <span className="stage-badge">{stage}</span>
                        </div>
                        
                        {tags.length > 0 && (
                            <div className="tags-container">
                                {tags.map(tag => <span key={tag} className="status-tag">{tag}</span>)}
                            </div>
                        )}
                    </div>
                </div>

                
                <div className="summary-card finance-card">
                    <div className="summary-card-header">
                        <span role="img" aria-label="money">💰</span>
                        <h3>Финансы</h3>
                    </div>
                    <div className="summary-card-body">
                        <div className="finance-item">
                            <span>Бюджет:</span>
                            <span className="finance-value budget">{formatNumber(totalBudget)} ₴</span>
                        </div>
                        <div className="finance-item">
                            <span>Расходы на исполнителей:</span>
                            <span className="finance-value cost">{formatNumber(totalExecutorCost)} ₴</span>
                        </div>
                        <hr className="finance-divider" />
                        <div className="finance-item total">
                            <span>Прибыль:</span>
                            <span className={`finance-value ${profitClass}`}>
                                {formatNumber(profit)} ₴
                            </span>
                        </div>
                        <div className="profitability-bar-container">
                             <div 
                                 className={`profitability-bar ${profitClass}`}
                                 style={{ width: `${Math.min(Math.abs(profitability), 100)}%` }}
                             ></div>
                        </div>
                        <div className="profitability-text">
                            Рентабельность: {profitability.toFixed(1)}%
                        </div>
                    </div>
                </div>

                
                <div className="summary-card time-tracking-card">
                    <div className="summary-card-header">
                        <span role="img" aria-label="clock">⏱️</span>
                        <h3>Затрачено времени</h3>
                    </div>
                    <div className="summary-card-body">
                        <div className="total-time-display">
                            {formattedTime}
                        </div>
                        <p className="time-tracking-subtitle">
                            Всего по журналу работ
                        </p>
                    </div>
                </div>

               
                <div className="summary-card tech-stack-card">
                    <div className="summary-card-header">
                        <span role="img" aria-label="tools">⚙️</span>
                        <h3>Стек технологий</h3>
                    </div>
                    <div className="summary-card-body">
                        <div className="summary-tech-tags-container">
                            {techTags.length > 0 ? techTags.map(tag => (
                                <span key={tag} className="summary-tech-tag">{tag}</span>
                            )) : (
                                <p className="no-data-placeholder">Технологии не указаны</p>
                            )}
                        </div>
                    </div>
                </div>

                
                <div className="summary-card participants-card">
                    <div className="summary-card-header">
                        <span role="img" aria-label="team">👥</span>
                        <h3>Участники ({performers.length})</h3>
                    </div>
                    <div className="summary-card-body">
                        <ul className="participants-list">
                            {performers.length > 0 ? performers.map((p, index) => (
                                <li key={p.id || index} className="participant-item">
                                    <div className="avatar" style={{ backgroundColor: `#${(Math.abs(p.performer.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0))%16777215).toString(16).padStart(6, '0')}` }}>
                                        {getInitials(p.performer)}
                                    </div>
                                    <div className="participant-info">
                                        <span className="participant-name">{p.performer}</span>
                                        
                                        <span className="participant-role">{p.performerRole}</span>
                                    </div>
                                </li>
                            )) : (
                                <p className="no-data-placeholder">Исполнители не назначены</p>
                            )}
                        </ul>
                    </div>
                </div>

                
                <div className="summary-card dates-card">
                     <div className="summary-card-header">
                        <span role="img" aria-label="calendar">🗓️</span>
                        <h3>Важные даты</h3>
                    </div>
                    <div className="summary-card-body">
                        <div className="date-item">
                            <strong>Дата обращения:</strong>
                            <span>{appealDate || 'Не указана'}</span>
                        </div>
                         <div className="date-item">
                            <strong>План. старт:</strong>
                            <span>{plannedStartDate || 'Не указана'}</span>
                        </div>
                         <div className="date-item">
                            <strong>План. финиш:</strong>
                            <span>{plannedFinishDate || 'Не указана'}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderSummary;