import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import './ContactsTab.css';

/**
 * Вкладка «Контакты» для модального окна клиента.
 */
export default function ContactsTab({ countries = [], openImage }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="tab-section contacts-tab">
      {/* ---------- ФИО ---------- */}
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

      {/* ---------- Телефон ---------- */}
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

      {/* ---------- Email ---------- */}
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

      {/* ---------- Страна ---------- */}
      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Страна<span className="req">*</span></label>
            <select {...field} className={errors.country ? 'input-error' : ''}>
              <option value="">-- Выберите страну --</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && <p className="error">{errors.country.message}</p>}
          </div>
        )}
      />

      {/* ---------- Город ---------- */}
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

      {/* ---------- Ссылка на чат ---------- */}
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

      {/* ---------- Ссылка на папку ---------- */}
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
            </div>
          </div>
        )}
      />
    </div>
  );
}
