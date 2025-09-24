import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export default function FinancesTab({ fields }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="tab-section">
      {/* --- Валюта --- */}
      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Валюта<span className="req">*</span></label>
            <select {...field} className={errors.currency ? 'input-error' : ''}>
              <option value="" disabled>Выберите валюту</option>
              {fields?.currency?.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
            {errors.currency && <p className="error-message">{errors.currency.message}</p>}
          </div>
        )}
      />

      {/* --- Ставка в час --- */}
      <Controller
        name="hourlyRate"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Ставка в час</label>
            <input type="number" placeholder="0.00" {...field} />
            {errors.hourlyRate && <p className="error-message">{errors.hourlyRate.message}</p>}
          </div>
        )}
      />

      {/* --- Сумма ввод --- */}
      <Controller
        name="amountInput"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Сумма ввод</label>
            <input type="number" placeholder="0.00" {...field} />
             {errors.amountInput && <p className="error-message">{errors.amountInput.message}</p>}
          </div>
        )}
      />

      {/* --- Сумма макс --- */}
      <Controller
        name="maxAmount"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Сумма макс</label>
            <input type="number" placeholder="0.00" {...field} />
            {errors.maxAmount && <p className="error-message">{errors.maxAmount.message}</p>}
          </div>
        )}
      />
    </div>
  );
}