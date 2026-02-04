import React, { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

export default function GeneralInfoTab({ fieldsData }) {
  const { control, setValue, formState: { errors } } = useFormContext();

  const countries = Array.isArray(fieldsData?.employeeFields?.country) ? fieldsData.employeeFields.country : [];
  const rawCurrencies = Array.isArray(fieldsData?.executorFields?.currency) ? fieldsData.executorFields.currency : [];

  const currencies = useMemo(() => {
    const codes = rawCurrencies
      .map((c) => (typeof c === "string" ? c : c?.code || c?.value || c?.name))
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean);
    return codes.length ? codes : ["uah", "usd", "usdt", "eur", "rub"];
  }, [rawCurrencies]);

  const countryOptions = useMemo(() => {
    return countries
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

  const selectedMainCurrency = useWatch({ control, name: "mainCurrency" });
  
  const currentCountry = useWatch({ control, name: "country" });
  const currentCountryId = useWatch({ control, name: "countryId" });

  React.useEffect(() => {
    if (!countryOptions.length || !currentCountry) return;
    const hasCurrentId = countryOptions.some((opt) => opt.value === currentCountryId);
    if (!hasCurrentId) {
      const match = countryOptions.find((opt) => opt.label === currentCountry);
      if (match) setValue("countryId", match.value, { shouldDirty: false });
    }
  }, [countryOptions, currentCountry, currentCountryId, setValue]);

  return (
    <div className="tab-section">
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
              <option value="" disabled>Выберите страну</option>
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