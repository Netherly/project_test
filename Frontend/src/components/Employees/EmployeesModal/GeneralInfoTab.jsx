import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';


const currencies = ['uah', 'usd', 'usdt', 'eur', 'rub'];

export default function GeneralInfoTab({ employeeFields = { country: [] } }) {
  const { control, watch, formState: { errors } } = useFormContext();

  
  const selectedMainCurrency = watch('mainCurrency');

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
            </select>
          )}
        />
      </div>

      <div className="form-field">
        <label>Страна</label>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <select {...field} className={errors.country ? 'input-error' : ''}>
              <option value="">Выберите страну</option>
              {employeeFields.country.map(countryName => (
                <option key={countryName.trim()} value={countryName.trim()}>
                  {countryName.trim()}
                </option>
              ))}
            </select>
          )}
        />
        {errors.country && <p className="error">{errors.country.message}</p>}
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
              className={errors.fullName ? 'input-error' : ''}
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
              className={errors.login ? 'input-error' : ''}
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
              className={errors.password ? 'input-error' : ''}
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


        <label className="currency-title">Ставка в час</label>
        <div className="currency-table">
          {currencies.map((currency) => (
            <div 
              key={currency} 
              className={`currency-row ${selectedMainCurrency === currency ? 'selected' : ''}`}
            >
              <span className="currency-label">{currency.toUpperCase()}<Controller
                name="mainCurrency"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="radio"
                    value={currency}
                    checked={field.value === currency}
                  />
                )}
              /></span>
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
  );
}