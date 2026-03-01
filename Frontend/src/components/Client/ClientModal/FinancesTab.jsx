import React, { useEffect, useState, useMemo } from 'react';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import './FinancesTab.css';
import { Plus, Minus } from 'lucide-react';
import { fetchClients } from '../../../api/clients'; 
import CreatableSelect from "./CreatableSelect";

const formatNumberWithSpaces = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0.00';
  const fixedNum = Number(num).toFixed(2);
  const parts = fixedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

export default function FinancesTab({ currencies = [], referrers = [], employees = [], onAddNewField }) {
  const [currencyList, setCurrencyList] = useState(currencies);
  const [transactions, setTransactions] = useState([]);
  const [clientsData, setClientsData] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadClients = async () => {
      try {
        const data = await fetchClients();
        if (mounted) setClientsData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Не удалось загрузить клиентов:", e);
      }
    };
    loadClients();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setCurrencyList(Array.isArray(currencies) ? currencies : []);
  }, [currencies]);

  const { control, setValue, clearErrors, getValues, formState: { errors } } = useFormContext();
  const shareInfo = useWatch({ control, name: 'share_info' });

  useEffect(() => {
    if (shareInfo) {
      if (!getValues('percent')) {
        setValue('percent', 100, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      clearErrors('referrer_id');
      setValue('referrer_id', '', { shouldValidate: false, shouldDirty: true });
      setValue('referrer_name', '', { shouldValidate: false, shouldDirty: true });
    }
  }, [shareInfo, setValue, getValues, clearErrors]);

  const referrerRules = useMemo(() => (shareInfo ? { required: 'Реферер обязателен при доле' } : {}), [shareInfo]);

  const combinedReferrers = useMemo(() => {
    const items = [];
    const seen = new Set();
    const addItem = (id, name, label) => {
      if (!id || !name) return;
      const key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ id: key, name, label });
    };

    (employees || []).forEach(e => addItem(e?.id, e?.full_name || e?.fullName || '', e?.full_name || e?.fullName || ''));
    (referrers || []).forEach(r => addItem(r?.id, r?.name || r?.full_name || r?.label || '', r?.name || r?.full_name || r?.label || ''));
    clientsData.forEach(c => addItem(c?.id, c?.name || c?.full_name || '', c?.name || c?.full_name || ''));

    return items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [employees, referrers, clientsData]);

  const referrerById = useMemo(() => new Map(combinedReferrers.map((r) => [String(r.id), r.name])), [combinedReferrers]);

  const handleReferrerChange = (field, nameField) => (event) => {
    const nextId = event.target.value;
    field.onChange(nextId);
    const nextName = referrerById.get(String(nextId)) || '';
    setValue(nameField, nextName, { shouldDirty: true });
  };

  return (
    <div className="tab-section finances-tab">
      <Controller name="referrer_name" control={control} render={({ field }) => <input type="hidden" {...field} />} />
      <Controller name="referrer_first_name" control={control} render={({ field }) => <input type="hidden" {...field} />} />

      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Валюта</label>
            <CreatableSelect
              value={field.value}
              onChange={field.onChange}
              options={currencyList}
              placeholder="Выберите или введите..."
              error={!!errors.currency}
              onAdd={(val) => {
                 setCurrencyList(prev => [...prev, val]);
                 onAddNewField("generalFields", "currency", val);
              }}
            />
            {errors.currency && <p className="error">{errors.currency.message}</p>}
          </div>
        )}
      />

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

      <Controller
        name="hourly_rate"
        control={control}
        render={({ field }) => {
          const { onChange, value, ...restField } = field;
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="form-field">
              <label>В час</label>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} step={0.01} placeholder="0.00" className={errors.hourly_rate ? 'input-error' : ''} />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
              {errors.hourly_rate && <p className="error">{errors.hourly_rate.message}</p>}
            </div>
          );
        }}
      />

      <div className="two-cols">
        <Controller
          name="percent"
          control={control}
          render={({ field }) => {
            const { onChange, value, ...restField } = field;
            const min = 0, max = 100, step = 5, numValue = parseFloat(value) || 0;
            return (
              <div className="form-field">
                <label>% доли</label>
                <div className="custom-number-input">
                  <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} max={max} step={step} className={errors.percent ? 'input-error' : ''} />
                  <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                  <button type="button" className="num-btn plus-btn" onClick={() => onChange(Math.min(max, numValue + step))} disabled={numValue >= max}><Plus/></button>
                </div>
                {errors.percent && <p className="error">{errors.percent.message}</p>}
              </div>
            );
          }}
        />

        <div className="checkbox-container-modal">
          <Controller
            name="share_info"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <label htmlFor="share_info">Есть доля?</label>
                <input type="checkbox" id="share_info" {...field} checked={field.value || false} />
              </div>
            )}
          />
        </div>
      </div>

      <Controller
        name="referrer_id"
        control={control}
        rules={referrerRules}
        render={({ field }) => (
          <div className="form-field">
            <label>Реферер{shareInfo && <span className="req">*</span>}</label>
            <select {...field} onChange={handleReferrerChange(field, 'referrer_name')} className={errors.referrer_id ? 'input-error' : ''}>
              <option value="" disabled hidden></option>
              {combinedReferrers.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {errors.referrer_id && <p className="error">{errors.referrer_id.message}</p>}
          </div>
        )}
      />

      <Controller
        name="referrer_first_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Первый реферер</label>
            <select {...field} onChange={handleReferrerChange(field, 'referrer_first_name')}>
              <option value="" disabled hidden></option>
              {combinedReferrers.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        )}
      />

      <Controller
        name="manager_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Менеджер</label>
            <select {...field}>
              <option value="" disabled hidden></option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name || e.fullName}</option>)}
            </select>
          </div>
        )}
      />
      
      <div className="tab-content-title full-width">Журнал операций</div>
      <div className="finances-log-table full-width">
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

        {transactions.length > 0 ? (
          transactions.map((trx) => (
            <div key={trx.id} className="finances-log-row">
              <div className="finances-log-content-wrapper">
                <div className="finances-log-cell"><input type="text" value={trx.date || ''} readOnly /></div>
                <div className="finances-log-cell"><input type="text" value={trx.category || ''} readOnly /></div>
                <div className="finances-log-cell"><input type="text" value={trx.subcategory || ''} readOnly /></div>
                <div className="finances-log-cell"><input type="text" value={trx.operation || ''} readOnly /></div>
                <div className="finances-log-cell">
                  <input type="text" value={`${formatNumberWithSpaces(trx.amount)} ${trx.accountCurrency || ''}`} className={trx.operation === 'Зачисление' ? 'text-success' : 'text-danger'} readOnly />
                </div>
                <div className="finances-log-cell"><input type="text" value={trx.orderNumber || 'N/A'} readOnly /></div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-transactions">Транзакции по этому клиенту отсутствуют.</div>
        )}
      </div>
    </div>
  );
}