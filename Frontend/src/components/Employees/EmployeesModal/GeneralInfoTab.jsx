import React, { useMemo, useState, useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useFields } from "../../../context/FieldsContext";

export default function GeneralInfoTab({ fieldsData }) {
  const { control, setValue, formState: { errors } } = useFormContext();
  const { fields, loading: fieldsLoading } = useFields();
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const selectedMainCurrency = useWatch({ control, name: "mainCurrency" });
  const currentCountryId = useWatch({ control, name: "countryId" });
  const currentCountry = useWatch({ control, name: "country" });

  useEffect(() => {
    if (!fields) return;

    const loadedCountries = Array.isArray(fields?.employeeFields?.country) 
      ? fields.employeeFields.country 
      : [];
    setCountries(loadedCountries);

    const loadedCurrencies = Array.isArray(fields?.generalFields?.currency) 
      ? fields.generalFields.currency 
      : [];

    const currencyCodes = loadedCurrencies
      .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean);
    setCurrencies(currencyCodes.length ? currencyCodes : ["uah", "usd", "usdt", "eur", "rub"]);
  }, [fields]);

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
                className={`currency-row ${selectedMainCurrency === code ? "selected" : ""}`}
              >
                <span className="currency-label">
                  {code.toUpperCase()}
                </span>
                <Controller
                  name={`rates.${code}`}
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
            );
          })
        ) : null}
        </div>
      </div>
    </div>
  );
}
