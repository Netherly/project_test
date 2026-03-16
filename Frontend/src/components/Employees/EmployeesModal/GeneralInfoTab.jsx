import React, { useMemo, useState, useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import CreatableSelect from "../../Client/ClientModal/CreatableSelect"; 
import { Plus, Minus } from 'lucide-react';

export default function GeneralInfoTab({ fieldsData, onAddNewField }) {
  const { control, setValue, formState: { errors } } = useFormContext();
  const [currencies, setCurrencies] = useState([]);
  const selectedMainCurrency = useWatch({ control, name: "mainCurrency" });

  useEffect(() => {
    if (!fieldsData) return;

    const loadedCurrencies = Array.isArray(fieldsData?.generalFields?.currency) 
      ? fieldsData.generalFields.currency 
      : [];

    const currencyCodes = loadedCurrencies
      .filter(i => !i.isDeleted)
      .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean);
      
    setCurrencies(currencyCodes.length ? currencyCodes : ["uah", "usd", "usdt", "eur", "rub"]);
  }, [fieldsData]); 

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
            <CreatableSelect
              value={field.value}
              onChange={(val) => field.onChange(val.toLowerCase())} 
              options={currencies.map(c => c.toUpperCase())} 
              placeholder="Выберите или введите..."
              onAdd={(val) => {
                const lowerVal = val.toLowerCase();
                setCurrencies(prev => [...prev, lowerVal]);
                if (onAddNewField) onAddNewField("generalFields", "currency", lowerVal);
              }}
            />
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
            const code = currency.trim().toLowerCase();
            if (!code) return null;
            return (
              <div
                key={code}
                // ИСПРАВЛЕНО: заменил mainCurrencyValue на selectedMainCurrency
                className={`currency-row ${selectedMainCurrency === code ? "selected" : ""}`}
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