import React, { useEffect, useState, useMemo } from 'react';
import {
  Controller,
  useWatch,
  useFormContext
} from 'react-hook-form';
import './FinancesTab.css';
import { Plus, Minus } from 'lucide-react';

// <--- ДОБАВЛЕНО: Утилита форматирования
const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0.00';
  }
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

// <--- ДОБАВЛЕНО: Тестовые данные для клиента
const mockTransactions = [
  {
    id: 'mock1',
    date: '15-11-2025',
    category: 'Оплата клиента',
    subcategory: 'Оплата заказа Z-102',
    operation: 'Зачисление', // <-- Будет зеленым
    amount: 50000,
    accountCurrency: 'EUR',
    orderNumber: 'Z-102'
  },
  {
    id: 'mock2',
    date: '14-11-2025',
    category: 'Возврат',
    subcategory: 'Возврат по заказу Z-100',
    operation: 'Списание', // <-- Будет красным
    amount: 2500,
    accountCurrency: 'EUR',
    orderNumber: 'Z-100'
  }
];

export default function FinancesTab({ currencies = [], referrers = [], employees = [] }) {
  const [currencyList, setCurrencyList] = useState(currencies);
  
  // <--- ДОБАВЛЕНО: Состояние для таблицы транзакций
  const [transactions, setTransactions] = useState(mockTransactions);

  // TODO: Позже здесь будет логика загрузки реальных транзакций для клиента
  // useEffect(() => {
  //   // const clientId = getValues('id'); // или получить id из пропсов
  //   // if (clientId) {
  //   //   // ...логика загрузки транзакций по clientId...
  //   //   // setTransactions(loadedTransactions);
  //   // }
  // }, []);


  const addCurrency = () => {
    const val = prompt('Новая валюта (пример: CHF):');
    if (val && val.trim() && !currencyList.includes(val.trim())) {
      setCurrencyList(prev => [...prev, val.trim()]);
    }
  };

  useEffect(() => {
    setCurrencyList(Array.isArray(currencies) ? currencies : []);
  }, [currencies]);

  const {
    control,
    setValue,
    clearErrors,
    formState: { errors }
  } = useFormContext();

  const shareInfo = useWatch({ control, name: 'share_info' });

  useEffect(() => {
    if (shareInfo) {
      setValue('percent', 80, { shouldValidate: true, shouldDirty: true });
    } else {
      clearErrors('referrer_id');
      setValue('referrer_id', '', { shouldValidate: false, shouldDirty: true });
      setValue('referrer_name', '', { shouldValidate: false, shouldDirty: true });
    }
  }, [shareInfo, setValue, clearErrors]);

  const referrerRules = useMemo(
    () => (shareInfo ? { required: 'Реферер обязателен при доле' } : {}),
    [shareInfo]
  );

  const referrerById = useMemo(
    () => new Map((referrers || []).map((r) => [String(r.id), r.name])),
    [referrers]
  );

  const handleReferrerChange = (field, nameField) => (event) => {
    const nextId = event.target.value;
    field.onChange(nextId);
    const nextName = referrerById.get(String(nextId)) || '';
    setValue(nameField, nextName, { shouldDirty: true });
  };

  return (
    <div className="tab-section finances-tab">
      <Controller
        name="referrer_name"
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />
      <Controller
        name="referrer_first_name"
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

      {/* Валюта */}
      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Валюта</label>
            <div className="select-plus">
              <select {...field} className={errors.currency ? 'input-error' : ''}>
                <option value="" disabled>-- выбрать --</option>
                {currencyList.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
            {errors.currency && <p className="error">{errors.currency.message}</p>}
          </div>
        )}
      />

      {/* Реквизиты для оплаты */}
      <Controller
        name="payment_details"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>Реквизиты для оплаты</label>
            <textarea {...field} placeholder="IBAN, PayPal, Crypto…" className='textarea-input' />
          </div>
        )}
      />

      {/* Ставка в час */}
      <Controller
        name="hourly_rate"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>В час</label>
            <input type="number" {...field} value={field.value || ''} min={0} step={0.01} placeholder="0.00" />
          </div>
        )}
      />

      {/* Процент + Чекбокс */}
      <div className="two-cols">
        <Controller
          name="percent"
          control={control}
          render={({ field }) => {
            const { onChange, value, ...restField } = field;
            const min = 0;
            const max = 100;
            const step = 5;
            const numValue = parseFloat(value) || 0;

            const handleDecrement = () => {
              const newValue = Math.max(min, numValue - step);
              onChange(newValue); 
            };
            
            const handleIncrement = () => {
              const newValue = Math.min(max, numValue + step);
              onChange(newValue); 
            };

            return (
              <div className="form-field">
                <label>% доли</label>
                <div className="custom-number-input">
                  <input
                    type="number"
                    {...restField} 
                    value={value || ''}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    className={errors.percent ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="num-btn minus-btn"
                    onClick={handleDecrement}
                    disabled={numValue <= min} 
                  >
                    <Minus/>
                  </button>
                  <button
                    type="button"
                    className="num-btn plus-btn"
                    onClick={handleIncrement}
                    disabled={numValue >= max} 
                  >
                    <Plus/>
                  </button>
                </div>
                {errors.percent && <p className="error">{errors.percent.message}</p>}
              </div>
            );
          }}
        />

        <Controller
          name="share_info"
          control={control}
          render={({ field }) => (
            <div className="form-field">
              <label>Есть доля?</label>
              <div
                className="fake-input-toggle" 
                onClick={() => field.onChange(!field.value)} 
                tabIndex={0} 
                role="switch" 
                aria-checked={field.value} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    field.onChange(!field.value);
                  }
                }}
              >
                {field.value ? 'Да' : 'Нет'} 
              </div>
            </div>
          )}
        />
      </div>

      {/* Реферер */}
      <Controller
        name="referrer_id"
        control={control}
        rules={referrerRules}
        render={({ field }) => (
          <div className="form-field">
            <label>Реферер{shareInfo && <span className="req">*</span>}</label>
            <select
              {...field}
              onChange={handleReferrerChange(field, 'referrer_name')}
              className={errors.referrer_id ? 'input-error' : ''}
            >
              <option value="" disabled>-- выбрать --</option>
              {referrers.map(r => (
                <option key={r.id} value={r.id}>{r.label || r.name}</option>
              ))}
            </select>
            {errors.referrer_id && <p className="error">{errors.referrer_id.message}</p>}
          </div>
        )}
      />

      {/* Первый реферер */}
      <Controller
        name="referrer_first_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Первый реферер</label>
            <select {...field} onChange={handleReferrerChange(field, 'referrer_first_name')}>
              <option value="" disabled>-- выбрать --</option>
              {referrers.map(r => (
                <option key={r.id} value={r.id}>{r.label || r.name}</option>
              ))}
            </select>
          </div>
        )}
      />

      {/* Менеджер */}
      <Controller
        name="manager_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Менеджер</label>
            <select {...field}>
              <option value="" disabled>-- выбрать --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>
        )}
      />
      
      
      
      
      <div className="tab-content-title full-width">Журнал операций</div>
      
      <div className="finances-log-table full-width">
        
        {/* Заголовок таблицы */}
        <div className="finances-log-row header-row">
          <div className="finances-log-content-wrapper">
            <div className="finances-log-cell">Дата</div>
            <div className="finances-log-cell">Статья</div>
            <div className="finances-log-cell">Подстатья</div>
            <div className="finances-log-cell">Операция</div>
            <div className="finances-log-cell">Сумма</div>
            <div className="finances-log-cell">Номер заказа</div>
          </div>
        </div>

        {/* Строки таблицы */}
        {transactions.length > 0 ? (
          transactions.map((trx) => (
            <div key={trx.id} className="finances-log-row">
              <div className="finances-log-content-wrapper">
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.date || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.category || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.subcategory || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input type="text" value={trx.operation || ''} readOnly />
                </div>
                
                <div className="finances-log-cell">
                  <input
                    type="text"
                    value={`${formatNumberWithSpaces(trx.amount)} ${trx.accountCurrency || ''}`}
                    className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'}
                    readOnly
                  />
                </div>

                <div className="finances-log-cell">
                  <input type="text" value={trx.orderNumber || 'N/A'} readOnly />
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="no-transactions">
            Транзакции по этому клиенту отсутствуют.
          </div>
        )}
      </div>

    </div>
  );
}