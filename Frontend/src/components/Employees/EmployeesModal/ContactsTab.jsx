import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { httpPost } from '../../../api/http';

export default function ContactsTab({ isNew }) {
  const { control, setValue, formState: { errors } } = useFormContext();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState('');

  const formatDateTime = (value) => {
    const text = String(value || '').trim();
    if (!text) return '';
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) return text;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    setLinkError('');
    try {
      const data = await httpPost('/telegram/link/create');
      if (!data?.link) {
        throw new Error('Ссылка не получена');
      }
      setValue('telegramBindingLink', data.link, { shouldDirty: true });
    } catch (err) {
      console.error('Ошибка генерации Telegram-ссылки:', err);
      setLinkError(err?.message || 'Не удалось создать ссылку для Telegram');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const openLink = (value) => {
    const link = String(value || '').trim();
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

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
                <input
                  name={field.name}
                  ref={field.ref}
                  value={formatDateTime(field.value)}
                  onChange={() => {}}
                  placeholder="Дата и время"
                  readOnly
                />
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
                <div className="input-with-action">
                  <input {...field} placeholder="Ссылка..." readOnly />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleGenerateLink}
                    disabled={isGeneratingLink}
                  >
                    {isGeneratingLink ? 'Генерация...' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openLink(field.value)}
                    disabled={!field.value}
                  >
                    Открыть
                  </button>
                </div>
                {linkError && <p className="error">{linkError}</p>}
              </div>
            )}
          />
          
          <Controller
            name="chatLink"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на чат</label>
                <div className="input-with-action">
                  <input {...field} placeholder="https://..." readOnly />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openLink(field.value)}
                    disabled={!field.value}
                  >
                    Открыть
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      </fieldset>
    </div>
  );
}
