import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export default function ContactsTab({ isNew }) {
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
      
      <fieldset className="form-fieldset">
        <div className="grid-2-col">
          {/* Исправлено: telegram.dateTime -> telegramDateTime */}
          <Controller
            name="telegramDateTime"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм дата и время</label>
                <input {...field} placeholder="Дата и время" readOnly={!isNew} />
              </div>
            )}
          />
          
          {/* Исправлено: telegram.id -> telegramId */}
          <Controller
            name="telegramId"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм ID</label>
                <input {...field} placeholder="123456789" readOnly={!isNew} />
              </div>
            )}
          />
          
          {/* Исправлено: telegram.name -> telegramName */}
          <Controller
            name="telegramName"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм имя</label>
                <input {...field} placeholder="Имя в Telegram" readOnly={!isNew} />
              </div>
            )}
          />
          
          {/* Исправлено: telegram.nickname -> telegramNickname */}
          <Controller
            name="telegramNickname"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Телеграм никнейм</label>
                <input {...field} placeholder="@nickname" />
              </div>
            )}
          />
          
          {/* Исправлено: telegram.bindingLink -> telegramBindingLink */}
          <Controller
            name="telegramBindingLink" 
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на привязку</label>
                <input {...field} placeholder="Ссылка..." readOnly={!isNew} />
              </div>
            )}
          />
          
          <Controller
            name="chatLink"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на чат</label>
                <input {...field} placeholder="https://..." readOnly={!isNew} />
              </div>
            )}
          />
        </div>
      </fieldset>
    </div>
  );
}