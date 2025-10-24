import React, { useEffect, useState, useMemo } from 'react';
import {
  Controller,
  useWatch,
  useFormContext
} from 'react-hook-form';
import './FinancesTab.css';
import {Plus, Minus } from 'lucide-react';

export default function FinancesTab({ currencies = [], referrers = [], employees = [] }) {
  const [currencyList, setCurrencyList] = useState(currencies);
  const addCurrency = () => {
    const val = prompt('Новая валюта (пример: CHF):');
    if (val && val.trim() && !currencyList.includes(val.trim())) {
      setCurrencyList(prev => [...prev, val.trim()]);
    }
  };

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
    }
  }, [shareInfo, setValue, clearErrors]);

  const referrerRules = useMemo(
    () => (shareInfo ? { required: 'Реферер обязателен при доле' } : {}),
    [shareInfo]
  );

  return (
    <div className="tab-section finances-tab">
      {/* Валюта */}
      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Валюта</label>
            <div className="select-plus">
              <select {...field} className={errors.currency ? 'input-error' : ''}>
                <option value="">-- выбрать --</option>
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
            <textarea {...field} placeholder="IBAN, PayPal, Crypto…" className='workplan-textarea' />
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
            <input type="number" {...field} min={0} step={0.01} placeholder="0.00" />
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
                  
                 
                  <button
                    type="button"
                    className="num-btn minus-btn"
                    onClick={handleDecrement}
                    disabled={numValue <= min} 
                  >
                    <Minus/>
                  </button>
                  
                  
                  <input
                    type="number"
                    {...restField} 
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    className={errors.percent ? 'input-error' : ''}
                  />
                  
                 
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
            <div className="form-field-checkbox">
              <label>Есть доля?</label>
                <input
                  type="checkbox"
                  {...field}
                  onChange={e => field.onChange(e.target.checked)}
                  className='form-checkbox'
                />
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
            <select {...field} className={errors.referrer_id ? 'input-error' : ''}>
              <option value="">-- выбрать --</option>
              {referrers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
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
            <select {...field}>
              <option value="">-- выбрать --</option>
              {referrers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
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
              <option value="">-- выбрать --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>
        )}
      />
    </div>
  );
}
