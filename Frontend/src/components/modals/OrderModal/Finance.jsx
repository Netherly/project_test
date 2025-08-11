import React from 'react';
import { Controller } from 'react-hook-form';
import CustomSelect from '../../ui/CustomSelect';

const Finance = ({ control, orderFields }) => {
    

    
    const currencyOptions = (orderFields?.currency || []).map(curr => ({
        value: curr,
        label: curr,
    }));

    
    const maxData = {
        ПартнерСумма: "2323",
        ВыручкаЗаказа: "34234234",
        СуммаИсполнителям: "234234234234",
        вЧас: "111",
        Прибыль: "222222222",
        ПрибыльПроцентВыручки: "345345345",
        ПрибыльПроцентСуммы: "345345345345",
        Чаевые: "345345345345",
        ПрибыльПлюсЧаевые: "345345345345",
        Оплата: "77777",
        ОплатаВалюта: "888888",
        ОплатаАльтернатива: "678666",
        Возврат: "77777",
        ВозвратВалюта: "888888",
        ВозвратАльтернатива: "678666",
    };
    const fieldLabels = {
        ПартнерСумма: "Партнер сумма",
        ВыручкаЗаказа: "Выручка заказа",
        СуммаИсполнителям: "Исполнителям сумма",
        вЧас: "В час",
        Прибыль: "Прибыль",
        ПрибыльПроцентВыручки: "Прибыль % от выручки",
        ПрибыльПроцентСуммы: "Прибыль % от суммы",
        Чаевые: "Чаевые",
        ПрибыльПлюсЧаевые: "Прибыль + чаевые",
        Оплата: "Оплата",
        ОплатаВалюта: "Оплата валюта",
        ОплатаАльтернатива: "Оплата альтернатива",
        Возврат: "Возврат",
        ВозвратВалюта: "Возврат валюта",
        ВозвратАльтернатива: "Возврат альтернатива",
    };

    const handlePercentChange = (value, onChange) => {
        let num = Number(value);
        if (isNaN(num)) num = 0;
        if (num < 0) num = 0;
        if (num > 100) num = 100;
        onChange(num);
    };

    return (
        <div className="tab-content-container">
            <Controller
                name="share_percent"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Доля %</div>
                        <input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            className='tab-content-input'
                            placeholder="..."
                            onChange={e => handlePercentChange(e.target.value, field.onChange)}
                            value={field.value || ''}
                        />
                    </div>
                )}
            />
            <Controller
                name="budget"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Бюджет</div>
                        <input
                            {...field}
                            type="number"
                            className='tab-content-input'
                            placeholder="..."
                        />
                    </div>
                )}
            />

            
            <Controller
                name="currency_type"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <CustomSelect
                        {...field}
                        onChange={e => field.onChange(e.target.value)}
                        value={field.value}
                        label="Валюта"
                        options={currencyOptions}
                    />
                )}
            />

            
            <Controller
                name="currency_rate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Курс валют</div>
                        <input
                            {...field}
                            type="text"
                            className='tab-content-input'
                            placeholder="..."
                        />
                    </div>
                )}
            />
            <Controller
                name="hourly_rate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Ставка в час</div>
                        <input
                            {...field}
                            type="number"
                            className='tab-content-input'
                            placeholder="..."
                        />
                    </div>
                )}
            />
            <Controller
                name="round_hour"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Округление часа</div>
                        <span className='modal-content-span-info-checkbox'>
                            <input
                                type="checkbox"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                            />
                        </span>
                    </div>
                )}
            />
            {Object.entries(maxData).map(([key, value]) => (
                <div className="tab-content-row" key={key}>
                    <div className="tab-content-title">{fieldLabels[key]}</div>
                    <span className='modal-content-span-info'>{value}</span>
                </div>
            ))}
            <div className="tab-content-row">
                <div className="tab-content-title">Журнал оплат</div>
                <span className='modal-content-span-info'>В разработке...</span>
            </div>
        </div>
    );
};

export default Finance;