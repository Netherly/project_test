import React, { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

export default function GeneralInfoTab({ fieldsData }) {
  const { control } = useFormContext();

  
  const rawCurrencies = Array.isArray(fieldsData?.executorFields?.currency) ? fieldsData.executorFields.currency : [];

  const currencies = useMemo(() => {
    const codes = rawCurrencies
      .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean);
    return codes.length ? codes : ["uah", "usd", "usdt", "eur", "rub"];
  }, [rawCurrencies]);

  const selectedMainCurrency = useWatch({ control, name: "mainCurrency" });

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
              <option value="" disabled>Выберите валюту</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency.toUpperCase()}
                </option>
              ))}
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
        {currencies.map((currency) => (
          <div
            key={currency}
            className={`currency-row ${selectedMainCurrency === currency ? "selected" : ""}`}
          >
            <span className="currency-label">
              {currency.toUpperCase()}
            </span>
            <Controller
              name={`rates.${currency}`}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  placeholder="0.00"
                  className="currency-input"
                />
              )}
            />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}