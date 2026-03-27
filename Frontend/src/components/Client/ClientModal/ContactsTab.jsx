import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import './ContactsTab.css';
import CreatableSelect from "./CreatableSelect"; 
import { ExternalLink, Upload } from 'lucide-react';

export default function ContactsTab({ countries = [], openImage, onAddCountry }) {
  const { control, formState: { errors } } = useFormContext();

  const openLink = (url) => {
    if (url && typeof url === 'string') {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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

      {/* ---------- Email ---------- */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Почта</label>
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
            <CreatableSelect
              value={field.value || ""}
              onChange={field.onChange}
              options={countries}
              placeholder="Выберите или введите..."
              error={!!errors.country}
              onAdd={(val) => onAddCountry && onAddCountry(val)}
            />
            {errors.country && <p className="error grid-error">{errors.country.message}</p>}
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
            <div className="input-with-icon-wrapper" style={{ width: '100%', flex: 1 }}>
              <input 
                {...field} 
                placeholder="URL изображения" 
                style={{ flex: 1 }}
              />
              <div className="input-icons-group">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => openLink(field.value)}
                  disabled={!field.value}
                  title="Открыть фото в новой вкладке"
                >
                  <ExternalLink size={18} />
                </button>

                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={(e) => {
                      e.preventDefault();
                  }}
                  title="Загрузить файл (в разработке)"
                >
                  <Upload size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}