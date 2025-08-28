import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import './ContactsTab.css';

export default function ContactsTab({ clientFields, openImage }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="tab-section contacts-tab">
      <Controller
        name="full_name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>ФИО<span className="req">*</span></label>
            <input {...field} placeholder="ФИО" className={errors.full_name ? 'input-error' : ''} />
            {errors.full_name && <p className="error">{errors.full_name.message}</p>}
          </div>
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Телефон<span className="req">*</span></label>
            <input
              {...field}
              placeholder="+380…"
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
            <label>Почта<span className="req">*</span></label>
            <input
              {...field}
              placeholder="user@example.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
        )}
      />

      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Страна<span className="req">*</span></label>
            <select {...field} className={errors.country ? 'input-error' : ''}>
              <option value="">-- Выберите страну --</option>
              {clientFields?.country?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && <p className="error">{errors.country.message}</p>}
          </div>
        )}
      />

      <Controller
        name="city"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Город</label>
            <input {...field} placeholder="Город" />
          </div>
        )}
      />

      <Controller
        name="chat_link"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Ссылка на чат</label>
            <input {...field} placeholder="https://t.me/…" />
          </div>
        )}
      />

      <Controller
        name="folder_link"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Ссылка на папку</label>
            <input {...field} placeholder="Google Drive / Dropbox…" />
          </div>
        )}
      />

      {/* ---------- Ссылка на фото ---------- */}
      <Controller
        name="photo_link"
        control={control}
        render={({ field }) => (
          <div className="form-field photo-field">
            <label>Ссылка на фото</label>
            <div className="photo-link-wrapper">
              <input {...field} placeholder="URL изображения" />
              <button
                type="button"
                onClick={openImage}
                disabled={!field.value}
              >
                Проверить
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}