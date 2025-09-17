import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import CustomSelect from '../../ui/CustomSelect';

const Finance = ({ control, orderFields, transactions = [] }) => {
    const { watch } = useFormContext();
    const currency = watch('currency_type');


    const totalIncome = transactions
      .filter(t => t.operation === 'Зачисление')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.operation === 'Списание')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
   
    
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
            <Controller
                name="discount"
                control={control}
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Скидка</div>
                        <input {...field} type="number" className='tab-content-input' placeholder="..." />
                    </div>
                )}
            />

            <Controller
                name="upsell"
                control={control}
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Апсейл</div>
                        <input {...field} type="number" className='tab-content-input' placeholder="..." />
                    </div>
                )}
            />

            <Controller
                name="expenses"
                control={control}
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Расходы</div>
                        <input {...field} type="number" className='tab-content-input' placeholder="..." />
                    </div>
                )}
            />

            <Controller
                name="tips"
                control={control}
                render={({ field }) => (
                    <div className="tab-content-row">
                        <div className="tab-content-title">Чаевые</div>
                        <input {...field} type="number" className='tab-content-input' placeholder="..." />
                    </div>
                )}
            />
            {Object.entries(maxData).map(([key, value]) => (
                <div className="tab-content-row" key={key}>
                    <div className="tab-content-title">{fieldLabels[key]}</div>
                    <span className='modal-content-span-info'>{value}</span>
                </div>
            ))}

            
            
            <Controller
                name="payment_details"
                control={control}
                render={({ field }) => (
                    <div className="tab-content-row-column">
                        <div className="tab-content-title">Реквизиты для оплаты</div>
                        <textarea {...field} className='workplan-textarea' placeholder="Введите реквизиты..."></textarea>
                    </div>
                )}
            />

            <div className="tab-content-row-column">
                <div className="tab-content-title">Журнал операций</div>
                <div className="payment-log-table">
                    <div className="payment-log-header">
                        <div>Дата и время</div>
                        <div>Статья</div>
                        <div>Подстатья</div>
                        <div>Счет</div>
                        <div>Сумма операции</div>
                        <div style={{ width: '40px' }}></div> 
                    </div>
                    
                    
                    {transactions.length > 0 ? (
                        transactions.map((trx) => (
                            <div key={trx.id} className="payment-log-row">
                                <input type="text" value={trx.date} readOnly />
                                <input type="text" value={trx.category} readOnly />
                                <input type="text" value={trx.subcategory} readOnly />
                                <input type="text" value={trx.account} readOnly />
                                <input 
                                    type="text" 
                                    value={`${trx.amount.toFixed(2)} ${trx.accountCurrency}`}
                                    className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                                    readOnly 
                                />
                                <div style={{ width: '40px' }}></div>
                            </div>
                        ))
                    ) : (
                        <div className="no-transactions" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            Операции по этому заказу отсутствуют.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Finance;