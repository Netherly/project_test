import React from 'react';
import { Controller, useWatch, useFieldArray } from 'react-hook-form';

const OrderExecution = ({ control }) => {
  const executionTime = useWatch({ control, name: 'executionTime' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const countDays = useWatch({ control, name: 'countDays' });

 const { fields, append, remove } = useFieldArray({
        control,
        name: "work_log"
    });

  const addNewLogRow = () => {
        append({
            executor: '',
            role: '',
            work_date: new Date().toISOString().split('T')[0], 
            hours: '',
            description: ''
        });
    };

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
                <div className='title-with-button'>
                    <div className="tab-content-title">Журнал выполнения</div>
                    <button type="button" className="add-row-btn" onClick={addNewLogRow}>
                        + Добавить запись
                    </button>
                </div>
                <div className="work-log-table">
                    <div className="work-log-header">
                        <div>Исполнитель</div>
                        <div>Роль</div>
                        <div>Дата работы</div>
                        <div>Часы</div>
                        <div>Что было сделано?</div>
                        <div></div>
                    </div>
                    {fields.map((item, index) => (
                        <div key={item.id} className="work-log-row">
                            <Controller name={`work_log.${index}.executor`} control={control} render={({ field }) => <input placeholder="Исполнитель..." {...field} />} />
                            <Controller name={`work_log.${index}.role`} control={control} render={({ field }) => <input placeholder="Роль..." {...field} />} />
                            <Controller name={`work_log.${index}.work_date`} control={control} render={({ field }) => <input type="date" {...field} />} />
                            <Controller name={`work_log.${index}.hours`} control={control} render={({ field }) => <input placeholder="Часы..." {...field} />} />
                            <Controller name={`work_log.${index}.description`} control={control} render={({ field }) => <textarea placeholder="Что было сделано?" {...field}></textarea>} />
                            <button type="button" className="remove-row-btn" onClick={() => remove(index)}>&times;</button>
                        </div>
                    ))}
                </div>
            </div>
    </div>
  );
};

export default OrderExecution;