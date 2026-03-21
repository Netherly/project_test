import React, { useMemo } from 'react';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import CreatableSelect from "../../../components/Client/ClientModal/CreatableSelect.jsx";

const GeneralInformation = ({ control, orderFields, onAddNewField }) => {
    const { setValue } = useFormContext();

    const urgencyOptions = [
        { value: "1", label: "Не горит" },
        { value: "2", label: "Умеренно" },
        { value: "3", label: "Жопа уже подгорает" },
        { value: "4", label: "ЛИБО СДАЛ ЛИБО ШТРАФ" },
    ];
    
    const statusOptions = (orderFields?.statuses || [])
        .map((opt) => opt?.value ?? opt?.name ?? "")
        .filter(Boolean);
        
    const closeReasonOptions = (orderFields?.closeReasons || [])
        .map((opt) => opt?.value ?? opt?.name ?? "")
        .filter(Boolean);

    const selectedInterval = useWatch({
        control,
        name: 'interval',
    });

    const intervalOptions = (orderFields?.intervals || [])
        .map(i => i?.intervalValue ?? i?.value ?? "")
        .filter(Boolean);

    const availableOrderTypes = useMemo(() => {
        if (!selectedInterval || !orderFields?.categories) {
            return [];
        }
        return orderFields.categories.filter((category) => {
            const intervalValue =
                category?.categoryInterval ??
                category?.intervalValue ??
                category?.interval ??
                "";
            return intervalValue === selectedInterval;
        }).map(c => c?.categoryValue ?? c?.value ?? "").filter(Boolean);
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
                            onChange={(val) => {
                                field.onChange(val);
                                setValue('orderType', '', { shouldDirty: true });
                            }}
                            options={intervalOptions}
                            placeholder="Выберите или введите..."
                            onAdd={(val) => onAddNewField && onAddNewField("orderFields", "intervals", val, { intervalValue: val })}
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
                            placeholder={selectedInterval ? "Выберите или введите..." : "Сначала выберите интервал"}
                            disabled={!selectedInterval}
                            onAdd={(val) => {
                                if (!selectedInterval) return alert("Сначала выберите интервал!");
                                onAddNewField && onAddNewField("orderFields", "categories", val, { categoryInterval: selectedInterval, categoryValue: val });
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
                            placeholder="Выберите статус..."
                            onAdd={(val) => onAddNewField && onAddNewField("orderFields", "statuses", val)}
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
                            placeholder="Укажите причину..."
                            onAdd={(val) => onAddNewField && onAddNewField("orderFields", "closeReasons", val)}
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