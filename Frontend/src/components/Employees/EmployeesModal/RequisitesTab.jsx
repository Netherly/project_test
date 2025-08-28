

import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';

const CURRENCIES = ['UAH', 'RUB', 'USDT', 'USD'];


const CurrencySection = ({ currency }) => {
  const { control } = useFormContext();
  const fieldArrayName = `requisites.${currency}`;

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldArrayName
  });

  return (
    <div className="currency-section">
      <h4>{currency}</h4>
      {fields.map((item, index) => (
        <div key={item.id} className="card-entry">
          <Controller
            name={`${fieldArrayName}[${index}].bank`}
            control={control}
            defaultValue={item.bank || ''}
            render={({ field }) => (
              <input {...field} placeholder={index === 0 ? 'Банк (основной)' : `Банк ${index + 1}`} />
            )}
          />
          <Controller
            name={`${fieldArrayName}[${index}].card`}
            control={control}
            defaultValue={item.card || ''}
            render={({ field }) => (
              <input {...field} placeholder={index === 0 ? 'Карта (основная)' : `Карта ${index + 1}`} />
            )}
          />
          <button type="button" className="remove-btn" onClick={() => remove(index)}>
            -
          </button>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={() => append({ bank: '', card: '' })}>
        + Добавить карту
      </button>
    </div>
  );
};


export default function RequisitesTab() {
  return (
    <div className="tab-section">
      <fieldset className="form-fieldset">
        <div className="finances-grid">
          {CURRENCIES.map(currency => (
            <CurrencySection key={currency} currency={currency} />
          ))}
        </div>
      </fieldset>
    </div>
  );
}