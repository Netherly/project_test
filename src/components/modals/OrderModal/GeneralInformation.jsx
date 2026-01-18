import React, { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';


const GeneralInformation = ({ control, orderFields }) => {
    
    const urgencyOptions = [
        { value: "1", label: "Не горит" },
        { value: "2", label: "Умеренно" },
        { value: "3", label: "Жопа уже подгорает" },
        { value: "4", label: "ЛИБО СДАЛ ЛИБО ШТРАФ" },
    ];
    const statusOptions = [
        { value: "1", label: "Обсуждение" },
        { value: "2", label: "Составление ТЗ" },
        { value: "3", label: "Разработка" },
        { value: "4", label: "Завершен" },
    ];
    const closeReasonOptions = [
        { value: "1", label: "Завершен" },
        { value: "2", label: "Кинули" },
        { value: "3", label: "Заказчик умер" },
        { value: "4", label: "Закончились деньги" },
    ];

    
    const selectedInterval = useWatch({
        control,
        name: 'interval',
    });

   
    const availableOrderTypes = useMemo(() => {
        if (!selectedInterval || !orderFields?.categories) {
            return [];
        }
        return orderFields.categories.filter(
            (category) => category.categoryInterval === selectedInterval
        );
    }, [selectedInterval, orderFields]);


    return (
        <div className='tab-content-container'>
            <div className="tab-content-row">
                <div className="tab-content-title">Заказ из старой срм?</div>
                <Controller
                    name="isOldOrder"
                    control={control}
                    render={({ field }) => (
                        <input 
                            type="checkbox"
                            className='custom-content-checkbox'
                            checked={field.value}
                            {...field}
                        />
                    )}
                />
            </div>


            <div className="tab-content-row">
                <div className="tab-content-title">Срочность</div>
                <Controller
                    name="urgency"
                    control={control}
                    render={({ field }) => (
                        <select className='custom-content-input' {...field}>
                            <option value="">Выбрать</option>
                            {urgencyOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}
                />
            </div>

            
            <div className="tab-content-row">
                <div className="tab-content-title">Дата обращения</div>
                <Controller
                    name="appealDate"
                    control={control}
                    render={({ field }) => (
                        <input type="date" className='tab-content-input' {...field} />
                    )}
                />
            </div>
            <div className="tab-content-row">
                <div className="tab-content-title">Дата предложения КП</div>
                <Controller
                    name="proposalDate"
                    control={control}
                    render={({ field }) => (
                        <input type="date" className='tab-content-input' {...field} />
                    )}
                />
            </div>
            <div className="tab-content-row">
                <div className="tab-content-title">Дата оформления заказа</div>
                <Controller
                    name="orderDate"
                    control={control}
                    render={({ field }) => (
                        <input type="date" className='tab-content-input' {...field} />
                    )}
                />
            </div>

            
            <div className="tab-content-row">
                <div className="tab-content-title">Интервал</div>
                <Controller
                    name="interval"
                    control={control}
                    render={({ field }) => (
                        <select className='custom-content-input' {...field}>
                            <option value="">Выбрать интервал</option>
                            {orderFields?.intervals?.map((interval, index) => (
                                <option key={index} value={interval.intervalValue}>
                                    {interval.intervalValue}
                                </option>
                            ))}
                        </select>
                    )}
                />
            </div>

           
            <div className="tab-content-row">
                <div className="tab-content-title">Тип заказа</div>
                <Controller
                    name="orderType"
                    control={control}
                    render={({ field }) => (
                        <select
                            className='custom-content-input'
                            {...field}
                            
                            disabled={!selectedInterval || availableOrderTypes.length === 0}
                        >
                            <option value="">
                                {!selectedInterval
                                    ? "Сначала выберите интервал"
                                    : "Выберите тип заказа"}
                            </option>
                            {availableOrderTypes.map((type, index) => (
                                <option key={index} value={type.categoryValue}>
                                    {type.categoryValue}
                                </option>
                            ))}
                        </select>
                    )}
                />
            </div>
            
            
            <div className="tab-content-row">
                <div className="tab-content-title">Статус заказа</div>
                <Controller
                    name="orderStatus"
                    control={control}
                    render={({ field }) => (
                        <select className='custom-content-input' {...field}>
                            <option value="">Выбрать</option>
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}
                />
            </div>
            <div className="tab-content-row">
                <div className="tab-content-title">Причина закрытия</div>
                <Controller
                    name="closeReason"
                    control={control}
                    render={({ field }) => (
                        <select className='custom-content-input' {...field}>
                            <option value="">Выбрать</option>
                            {closeReasonOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    )}
                />
            </div>
            <div className="tab-content-row">
                <div className="tab-content-title">Плановая дата старта</div>
                <Controller
                    name="plannedStartDate"
                    control={control}
                    render={({ field }) => (
                        <input type="date" className='tab-content-input' {...field} />
                    )}
                />
            </div>
            <div className="tab-content-row">
                <div className="tab-content-title">Плановая дата завершения</div>
                <Controller
                    name="plannedFinishDate"
                    control={control}
                    render={({ field }) => (
                        <input type="date" className='tab-content-input' {...field} />
                    )}
                />
            </div>
        </div>
    );
};

export default GeneralInformation;