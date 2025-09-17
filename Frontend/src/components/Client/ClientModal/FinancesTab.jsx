import React, { useEffect, useMemo } from 'react';
import {
  Controller,
  useWatch,
  useFormContext
} from 'react-hook-form';
import './FinancesTab.css';

export default function FinancesTab({ clientFields, referrers = [], employees = [] }) {
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
      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Валюта<span className="req">*</span></label>
            <div className="select-plus">
              <select {...field} className={errors.currency ? 'input-error' : ''}>
                <option value="">-- выбрать --</option>
                {clientFields?.currency?.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
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
            <textarea {...field} placeholder="IBAN, PayPal, Crypto…" />
          </div>
        )}
      />

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

      <div className="two-cols">
        <Controller
          name="percent"
          control={control}
          render={({ field }) => (
            <div className="form-field">
              <label>% доли<span className="req">*</span></label>
              <input
                type="number"
                {...field}
                min={0}
                max={100}
                step={1}
                className={errors.percent ? 'input-error' : ''}
              />
              {errors.percent && <p className="error">{errors.percent.message}</p>}
            </div>
          )}
        />

        <Controller
          name="share_info"
          control={control}
          render={({ field }) => (
            <div className="form-field switch-field">
              <label>Есть доля?</label>
              <label className="switch">
                <input
                  type="checkbox"
                  {...field}
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          )}
        />
      </div>

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