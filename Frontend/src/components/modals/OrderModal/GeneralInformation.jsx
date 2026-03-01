import React, { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import CreatableSelect from "../../Client/ClientModal/CreatableSelect"; 

const GeneralInformation = ({ control, orderFields, onAddNewField }) => {
    
    const urgencyOptions = [
        { value: "1", label: "Не горит" },
        { value: "2", label: "Умеренно" },
        { value: "3", label: "Жопа уже подгорает" },
        { value: "4", label: "ЛИБО СДАЛ ЛИБО ШТРАФ" },
    ];
    
    const statusOptions = (orderFields?.statuses || [])
        .filter(opt => !opt.isDeleted)
        .map((opt) => opt?.value ?? opt?.name ?? "")
        .filter(Boolean);
        
    const closeReasonOptions = (orderFields?.closeReasons || [])
        .filter(opt => !opt.isDeleted)
        .map((opt) => opt?.value ?? opt?.name ?? "")
        .filter(Boolean);

    const intervalOptions = (orderFields?.intervals || [])
        .filter(opt => !opt.isDeleted)
        .map((opt) => opt?.intervalValue ?? opt?.value ?? "")
        .filter(Boolean);

    const selectedInterval = useWatch({
        control,
        name: 'interval',
    });

    const availableOrderTypes = useMemo(() => {
        if (!selectedInterval || !orderFields?.categories) {
            return [];
        }
        return orderFields.categories
            .filter(c => !c.isDeleted)
            .filter((category) => {
                const intervalValue =
                    category?.categoryInterval ??
                    category?.intervalValue ??
                    category?.interval ??
                    "";
                return intervalValue === selectedInterval;
            })
            .map(c => c.categoryValue ?? c.value ?? "")
            .filter(Boolean);
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
                            <option value="" disabled hidden>Не выбрано</option>
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
                        <CreatableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={intervalOptions}
                            placeholder="Выберите или введите интервал..."
                            onAdd={(val) => onAddNewField("orderFields", "intervals", val)}
                        />
                    )}
                />
            </div>

            
            <div className="tab-content-row">
                <div className="tab-content-title">Тип заказа</div>
                <Controller
                    name="orderType"
                    control={control}
                    render={({ field }) => (
                        <CreatableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={availableOrderTypes}
                            disabled={!selectedInterval}
                            placeholder="Выберите или введите тип..."
                            onAdd={(val) => {
                                if (!selectedInterval) return alert("Сначала выберите интервал!");
                                onAddNewField("orderFields", "categories", val, { categoryInterval: selectedInterval });
                            }}
                        />
                    )}
                />
            </div>
            
            <div className="tab-content-row">
                <div className="tab-content-title">Статус заказа</div>
                <Controller
                    name="orderStatus"
                    control={control}
                    render={({ field }) => (
                        <CreatableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={statusOptions}
                            placeholder="Выберите или введите статус..."
                            onAdd={(val) => onAddNewField("orderFields", "statuses", val)}
                        />
                    )}
                />
            </div>

            <div className="tab-content-row">
                <div className="tab-content-title">Причина закрытия</div>
                <Controller
                    name="closeReason"
                    control={control}
                    render={({ field }) => (
                         <CreatableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={closeReasonOptions}
                            placeholder="Выберите или введите причину..."
                            onAdd={(val) => onAddNewField("orderFields", "closeReasons", val)}
                        />
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