import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import './RequisitesTab.css'; 
import { X } from 'lucide-react';

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
      <div className="requisites-cards-container">
        {fields.map((item, index) => (
          <div key={item.id} className="card-entry">
            <div className="input-group">
              <Controller
                name={`${fieldArrayName}[${index}].bank`}
                control={control}
                defaultValue={item.bank || ''}
                render={({ field }) => (
                  <input {...field} placeholder="Банк" />
                )}
              />
              <Controller
                name={`${fieldArrayName}[${index}].card`}
                control={control}
                defaultValue={item.card || ''}
                render={({ field }) => (
                  <input {...field} placeholder="Номер карты / Кошелек" />
                )}
              />
              <Controller
                name={`${fieldArrayName}[${index}].owner`}
                control={control}
                defaultValue={item.owner || ''}
                render={({ field }) => (
                  <input {...field} placeholder="Владелец (Ф.И.О)" />
                )}
              />
            </div>
            <button type="button" className="remove-btn" onClick={() => remove(index)}>
              <X />
            </button>
          </div>
        ))}
      </div>
      <button 
        type="button" 
        className="add-btn" 
        onClick={() => append({ bank: '', card: '', owner: '' })}>
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