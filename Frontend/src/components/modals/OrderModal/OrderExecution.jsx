import React from 'react';
import { useWatch } from 'react-hook-form';

const OrderExecution = ({ control }) => {
  const executionTime = useWatch({ control, name: 'executionTime' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const countDays = useWatch({ control, name: 'countDays' });

  return (
    <div className='tab-content-container'>
      <div className="tab-content-row">
        <div className="tab-content-title">Время выполнения</div>
        <span>{executionTime || '—'}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Дата начала работ</div>
        <span>{startDate || '—'}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Дата завершения работ</div>
        <span>{endDate || '—'}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Дней на выполнение</div>
        <span>{countDays || '—'}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Журнал выполнения</div>
        <span>В разработке...</span>
      </div>
    </div>
  );
};

export default OrderExecution;