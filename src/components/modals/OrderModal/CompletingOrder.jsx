import React from 'react';
import { Controller, useWatch } from 'react-hook-form';

const CompletingOrder = ({ control }) => {
  const completingTime = useWatch({ control, name: 'completingTime' });
  const completingLink = useWatch({ control, name: 'completingLink' });

  return (
    <div className='tab-content-container'>

      <Controller
        name="completedDate"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Дата завершения заказа</div>
            <input
              type="date"
              className='tab-content-input'
              {...field}
            />
          </div>
        )}
      />

      <div className="tab-content-row">
        <div className="tab-content-title">Длительность заказа</div>
        <span className='modal-content-span-info'>{completingTime || "—"}</span>
      </div>

      <Controller
        name="orderImpressions"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Впечатления о заказе</div>
            <textarea
              className='workplan-table textarea'
              {...field}
            ></textarea>
          </div>
        )}
      />

      <div className="tab-content-row">
        <div className="tab-content-title">Ссылка на форму для отзыва</div>
        {completingLink ? (
          <a
            href={completingLink}
            className='modal-content-span-info'
            target="_blank"
            rel="noopener noreferrer"
          >
            Перейти
          </a>
        ) : (
          <span className='modal-content-span-info'>—</span>
        )}
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Журнал выполнения</div>
        <span className='modal-content-span-info'>В разработке...</span>
      </div>

    </div>
  );
};

export default CompletingOrder;