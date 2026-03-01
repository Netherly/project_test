import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import CreatableSelect from "./CreatableSelect";
import './ContactsTab.css';

export default function ContactsTab({ countries = [], openImage, onAddNewField }) {
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
            <label>Телефон</label>
            <input
              {...field}
              placeholder="+380…"
              className={errors.phone ? 'input-error' : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+]/g, "");
                field.onChange(val);
              }}
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
            <input {...field} placeholder="user@example.com" className={errors.email ? 'input-error' : ''} />
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
            <CreatableSelect
              value={field.value}
              onChange={field.onChange}
              options={countries}
              placeholder="Выберите или введите..."
              error={!!errors.country}
              onAdd={(val) => onAddNewField("generalFields", "country", val)}
            />
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
        name="messenger_name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Имя в мессенджере</label>
            <input {...field} placeholder="Имя в мессенджере" />
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