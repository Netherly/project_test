

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export default function ContactsTab() {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="tab-section">
      <Controller
        name="birthDate"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Дата рождения</label>
            <input type="date" {...field} />
          </div>
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Телефон</label>
            <input
              {...field}
              placeholder="+380..."
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <p className="error">{errors.phone.message}</p>}
          </div>
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Почта</label>
            <input
              {...field}
              type="email"
              placeholder="user@example.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
        )}
      />

      <Controller
        name="passport"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Серия / Номер</label>
            <input {...field} placeholder="Паспортные данные" />
          </div>
        )}
      />

      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>Адрес прописки</label>
            <textarea {...field} placeholder="Полный адрес" rows="3" />
          </div>
        )}
      />

      {/* Блок Telegram */}
      <fieldset className="form-fieldset">
        <div className="grid-2-col">
          <Controller
            name="telegram.botInfo"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм Бот</label>
                <input {...field} placeholder="Информация о боте" />
              </div>
            )}
          />
          <Controller
            name="telegram.dateTime"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм дата и время</label>
                <input {...field} placeholder="Дата и время" />
              </div>
            )}
          />
          <Controller
            name="telegram.id"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм ID</label>
                <input {...field} placeholder="123456789" />
              </div>
            )}
          />
          <Controller
            name="telegram.name"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм имя</label>
                <input {...field} placeholder="Имя в Telegram" />
              </div>
            )}
          />
          <Controller
            name="telegram.nickname"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм никнейм</label>
                <input {...field} placeholder="@nickname" />
              </div>
            )}
          />
        </div>
      </fieldset>
    </div>
  );
}