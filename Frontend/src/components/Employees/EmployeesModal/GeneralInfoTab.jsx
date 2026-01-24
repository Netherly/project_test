// Frontend/src/pages/EmployeesModal/tabs/GeneralInfoTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FieldsAPI, withDefaults } from "../../../api/fields";

export default function GeneralInfoTab({ employeeFields: propEmployeeFields = { country: [] } }) {
  const { control, setValue, formState: { errors } } = useFormContext();

  const [countries, setCountries] = useState(
    Array.isArray(propEmployeeFields?.country) ? propEmployeeFields.country : []
  );
  const [currencies, setCurrencies] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState("");

  const selectedMainCurrency = useWatch({ control, name: "mainCurrency" });
  const currentCountryId = useWatch({ control, name: "countryId" });
  const currentCountry = useWatch({ control, name: "country" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingFields(true);
      setFieldsError("");
      try {
        const [employeeGroup, executorGroup] = await Promise.all([
          FieldsAPI.getEmployee(),
          FieldsAPI.getExecutor(),
        ]);

        const safe = withDefaults({
          employeeFields: employeeGroup,
          executorFields: executorGroup,
        });

        const loadedCountries = Array.isArray(safe.employeeFields?.country) ? safe.employeeFields.country : [];
        const loadedCurrencies = Array.isArray(safe.executorFields?.currency) ? safe.executorFields.currency : [];

        if (!mounted) return;

        setCountries(loadedCountries);

        const currencyCodes = loadedCurrencies
          .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
          .map((s) => String(s || "").trim().toLowerCase())
          .filter(Boolean);

        setCurrencies(currencyCodes.length ? currencyCodes : ["uah", "usd", "usdt", "eur", "rub"]);
      } catch (e) {
        if (!mounted) return;
        setFieldsError("Не удалось загрузить справочники. Используются дефолтные значения.");
        setCurrencies((prev) => (prev.length ? prev : ["uah", "usd", "usdt", "eur", "rub"]));
      } finally {
        if (mounted) setLoadingFields(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const countryOptions = useMemo(() => {
    return (Array.isArray(countries) ? countries : [])
      .map((item) => {
        if (typeof item === "string") {
          const name = item.trim();
          return name ? { value: name, label: name } : null;
        }
        const label = String(item?.name ?? item?.title ?? item?.value ?? item?.iso3 ?? item?.iso2 ?? "").trim();
        const value = String(item?.id ?? label).trim();
        return label ? { value, label } : null;
      })
      .filter(Boolean);
  }, [countries]);

  useEffect(() => {
    if (!countryOptions.length) return;
    const hasCurrent = countryOptions.some((opt) => opt.value === currentCountryId);
    if (!hasCurrent && currentCountry) {
      const match = countryOptions.find((opt) => opt.label === currentCountry);
      if (match) setValue("countryId", match.value, { shouldDirty: false });
    }
  }, [countryOptions, currentCountry, currentCountryId, setValue]);

  return (
    <div className="tab-section">
      {loadingFields && (
        <div className="info" style={{ marginBottom: 12 }}>
          Загружаются справочники…
        </div>
      )}
      {!!fieldsError && !loadingFields && (
        <div className="warning" style={{ marginBottom: 12 }}>
          {fieldsError}
        </div>
      )}

      <div className="form-field">
        <label>Статус</label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select {...field}>
              <option value="active">Работает</option>
              <option value="inactive">Не работает</option>
              <option value="pending">Оформляется</option>
            </select>
          )}
        />
      </div>

      <div className="form-field">
        <label>Страна</label>
        <Controller
          name="countryId"
          control={control}
          render={({ field }) => (
            <select {...field} className={errors.countryId ? "input-error" : ""}>
              <option value="">Выберите страну</option>
              {countryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.countryId && <p className="error">{errors.countryId.message}</p>}
      </div>

      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Сотрудник ФИО</label>
            <input
              {...field}
              placeholder="Введите ФИО"
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && <p className="error">{errors.fullName.message}</p>}
          </div>
        )}
      />

      <Controller
        name="login"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Логин</label>
            <input
              {...field}
              placeholder="Введите логин"
              className={errors.login ? "input-error" : ""}
            />
            {errors.login && <p className="error">{errors.login.message}</p>}
          </div>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Пароль</label>
            <input
              {...field}
              type="password"
              placeholder="Введите пароль"
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <p className="error">{errors.password.message}</p>}
          </div>
        )}
      />

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
              <option value="">Выберите валюту</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency.toUpperCase()}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div className="checkbox-container-modal" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        
        <Controller
          name="autoConfirmJournal"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <div className="form-field-checkbox">
             
              <label htmlFor="autoConfirmJournal" style={{ margin: 0, cursor: 'pointer' }}>
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
            <div className="form-field-checkbox" style={{ display: 'flex', alignItems: 'center'}}>
              
              <label htmlFor="workTimeControl" style={{ margin: 0, cursor: 'pointer' }}>
                Контроль рабочего времени
              </label>

             
              <input 
                type="checkbox" 
                id="workTimeControl" 
                {...field} 
                checked={field.value || false}
                style={{gap: '15px'}} 
              />
            </div>
          )}
        />
      </div>

      <div className="currency-field">
        <label className="currency-title" style={{ marginTop: 12 }}>Ставка в час</label>
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
