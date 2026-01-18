import React from 'react';
import { useWatch } from 'react-hook-form';

const OrderExecution = ({ control }) => {
  const executionTime = useWatch({ control, name: 'executionTime' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const countDays = useWatch({ control, name: 'countDays' });
  
  const workLog = useWatch({ control, name: 'work_log' }) || [];

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

      <div className="tab-content-row-column">
        <div className="tab-content-title">Журнал выполнения</div>
        
        
        <div className="finances-log-table execution-log-table">
           
            <div className="finances-log-row header-row">
                <div className="finances-log-content-wrapper">
                    <div className="finances-log-cell">Исполнитель</div>
                    <div className="finances-log-cell">Email</div>
                    <div className="finances-log-cell">Дата работы</div>
                    <div className="finances-log-cell">Часы</div>
                    <div className="finances-log-cell">Что было сделано?</div>
                </div>
            </div>

            
            {workLog.length > 0 ? (
                workLog.map((item, index) => (
                    <div key={index} className="finances-log-row">
                        <div className="finances-log-content-wrapper">
                           
                            <div className="finances-log-cell">
                                <input type="text" value={item.role} readOnly />
                            </div>
                            
                            <div className="finances-log-cell">
                                <input type="text" value={item.executor} readOnly />
                            </div>
                            <div className="finances-log-cell">
                                <input type="text" value={item.work_date} readOnly />
                            </div>
                            <div className="finances-log-cell">
                                <input type="text" value={item.hours} readOnly />
                            </div>
                            <div className="finances-log-cell">
                                <input type="text" value={item.description} title={item.description} readOnly />
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="no-transactions" style={{ textAlign: 'center', padding: '20px', color: 'var(--container-text-color)', opacity: 0.7 }}>
                    Записи в журнале выполнения отсутствуют.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderExecution;