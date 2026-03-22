import React, { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Plus, Minus } from 'lucide-react';
import { useFields } from "../../../context/FieldsContext"; 

export default function GeneralInfoTab({ fieldsData }) {
  const { control } = useFormContext();
  const { fields } = useFields();
  const [currencies, setCurrencies] = useState([]);
  
  const mainCurrencyValue = useWatch({ control, name: "mainCurrency" });

  useEffect(() => {
    if (!fields) return;

    const loadedCurrencies = Array.isArray(fields?.generalFields?.currency) 
      ? fields.generalFields.currency 
      : [];

    const currencyCodes = loadedCurrencies
      .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean);
      
    setCurrencies(currencyCodes.length ? currencyCodes : ["uah", "usd", "usdt", "eur", "rub"]);
  }, [fields, fieldsData]);

  return (
    <div className="tab-section">

      <Controller
        name="photoLink"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Ссылка на фото</label>
            <input {...field} placeholder="https://..." />
          </div>
        )}
      />
      
      <div className="form-field">
        <label>Основная валюта</label>
        <Controller
          name="mainCurrency"
          control={control}
          render={({ field }) => (
            <select {...field}>
              <option value="" disabled hidden>Не выбрано</option>
              {Array.isArray(currencies) && currencies.length > 0 ? (
                currencies.map((currency) => {
                  const currencyCode = typeof currency === 'string' ? currency : String(currency || '');
                  const code = currencyCode.trim().toLowerCase();
                  return code ? (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ) : null;
                })
              ) : null}
            </select>
          )}
        />
      </div>

      <div className="checkbox-container-modal">
        <Controller
          name="autoConfirmJournal"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <div className="form-field-checkbox">
              <label htmlFor="autoConfirmJournal">
                Автоматически подтверждать журнал
              </label>
              <input 
                type="checkbox" 
                id="autoConfirmJournal" 
                {...field} 
                checked={field.value || false} 
              />
            </div>
          )}
        />

        <Controller
          name="workTimeControl"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <div className="form-field-checkbox">
              <label htmlFor="workTimeControl">
                Контроль рабочего времени
              </label>
              <input 
                type="checkbox" 
                id="workTimeControl" 
                {...field} 
                checked={field.value || false}
              />
            </div>
          )}
        />
      </div>

      <div className="currency-field">
        <label className="currency-title">Ставка в час</label>
        <div className="currency-table">
        {Array.isArray(currencies) && currencies.length > 0 ? (
          currencies.map((currency) => {
            const currencyCode = typeof currency === 'string' ? currency : String(currency || '');
            const code = currencyCode.trim().toLowerCase();
            if (!code) return null;
            return (
              <div
                key={code}
                // ИСПРАВЛЕНО: используем mainCurrencyValue вместо несуществующей selectedMainCurrency
                className={`currency-row ${mainCurrencyValue === code ? "selected" : ""}`}
              >
                <span className="currency-label">
                  {code.toUpperCase()}
                </span>
                <Controller
                  name={`rates.${code}`}
                  control={control}
                  defaultValue=""
                  render={({ field: { onChange, value, ...restField } }) => {
                    const min = 0, step = 10, numValue = parseFloat(value) || 0;
                    return (
                      <div className="custom-number-input" style={{ width: '100%' }}>
                        <input
                          {...restField}
                          value={value || ''} 
                          onChange={onChange} 
                          type="number"
                          placeholder="0.00"
                          className="currency-input"
                          min={min}
                        />
                        <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                        <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
                      </div>
                    );
                  }}
                />
              </div>
            );
          })
        ) : null}
        </div>
      </div>
    </div>
  );
}
