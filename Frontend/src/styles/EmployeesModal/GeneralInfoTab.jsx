

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';


export default function GeneralInfoTab({ employeeFields = { country: [] } }) {
  const { control, formState: { errors } } = useFormContext();

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
            <label>Сотрудник ФИО<span className="req">*</span></label>
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
            <label>Логин<span className="req">*</span></label>
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
        name="chatLink"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Ссылка на чат</label>
            <input {...field} placeholder="https://..." />
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

      <Controller
        name="folderLink"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Папка</label>
            <input {...field} placeholder="Ссылка на папку" />
          </div>
        )}
      />
    </div>
  );
}