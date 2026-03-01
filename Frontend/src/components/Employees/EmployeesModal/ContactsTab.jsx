import React, { useState, useMemo, useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { httpPost, httpPut } from '../../../api/http';
import { Plus, ExternalLink, Copy, LogOut, Link2Off } from 'lucide-react';

export default function ContactsTab({ isNew, employeeId, fieldsData }) {
  const { control, setValue, formState: { errors } } = useFormContext();
  
  
  const countries = Array.isArray(fieldsData?.employeeFields?.country) ? fieldsData.employeeFields.country : [];

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

  const currentCountry = useWatch({ control, name: "country" });
  const currentCountryId = useWatch({ control, name: "countryId" });

  useEffect(() => {
    if (!countryOptions.length || !currentCountry) return;
    const hasCurrentId = countryOptions.some((opt) => opt.value === currentCountryId);
    if (!hasCurrentId) {
      const match = countryOptions.find((opt) => opt.label === currentCountry);
      if (match) setValue("countryId", match.value, { shouldDirty: false });
    }
  }, [countryOptions, currentCountry, currentCountryId, setValue]);
 

  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copyState, setCopyState] = useState('');
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState('');
  const [unlinkState, setUnlinkState] = useState('');

  const telegramId = useWatch({ control, name: 'telegramId' });
  const telegramNickname = useWatch({ control, name: 'telegramNickname' });
  const telegramName = useWatch({ control, name: 'telegramName' });
  const telegramDateTime = useWatch({ control, name: 'telegramDateTime' });
  const chatLinkValue = useWatch({ control, name: 'chatLink' });
  const isTelegramLinked = [telegramId, telegramNickname, telegramName, telegramDateTime, chatLinkValue]
    .some((val) => String(val || '').trim());

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
    if (!employeeId) {
      setLinkError('Сначала сохраните сотрудника');
      return;
    }
    setIsGeneratingLink(true);
    setLinkError('');
    try {
      const data = await httpPost(`/employees/${employeeId}/telegram-link`);
      const link = data?.data?.link || data?.link;
      if (!link) {
        throw new Error('Ссылка не получена');
      }
      setValue('telegramBindingLink', link, { shouldDirty: true });
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

  const copyLink = async (value) => {
    const link = String(value || '').trim();
    if (!link) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setCopyState('Скопировано');
      } else {
        setCopyState('Не удалось скопировать');
      }
    } catch (e) {
      console.error('Copy failed:', e);
      setCopyState('Не удалось скопировать');
    } finally {
      setTimeout(() => setCopyState(''), 2000);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!employeeId) {
      setUnlinkError('Сначала сохраните сотрудника');
      return;
    }
    if (!isTelegramLinked) {
      setUnlinkError('Телеграм не привязан');
      return;
    }
    setIsUnlinking(true);
    setUnlinkError('');
    setUnlinkState('');
    try {
      await httpPut(`/employees/${employeeId}`, {
        telegramUserId: null,
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
        telegramVerified: false,
        chatLink: null,
        photoLink: null,
        telegram: {
          dateTime: null,
          id: null,
          name: null,
          nickname: null,
          bindingLink: null,
        },
      });

      setValue('telegramDateTime', '', { shouldDirty: true });
      setValue('telegramId', '', { shouldDirty: true });
      setValue('telegramName', '', { shouldDirty: true });
      setValue('telegramNickname', '', { shouldDirty: true });
      setValue('telegramBindingLink', '', { shouldDirty: true });
      setValue('chatLink', '', { shouldDirty: true });
      setValue('photoLink', '', { shouldDirty: true });

      setUnlinkState('Телеграм отвязан');
      setTimeout(() => setUnlinkState(''), 2000);
    } catch (err) {
      console.error('Ошибка отвязки Telegram:', err);
      setUnlinkError(err?.message || 'Не удалось отвязать Telegram');
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="tab-section">
      
      
      
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
          
         <Controller
            name="telegramBindingLink" 
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на привязку</label>
                <div className="input-with-icon-wrapper">
                  <input 
                    {...field} 
                    placeholder="Ссылка..." 
                    readOnly 
                  />
                  <div className="input-icons-group">
                    {/* Кнопка Создать */}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink || field.value} // Блокируем если уже есть ссылка
                      title="Создать ссылку"
                    >
                      <Plus size={18} />
                    </button>

                    {/* Кнопка Открыть */}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => openLink(field.value)}
                      disabled={!field.value}
                      title="Открыть ссылку"
                    >
                      <ExternalLink size={18} />
                    </button>

                    {/* Кнопка Скопировать */}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => copyLink(field.value)}
                      disabled={!field.value}
                      title="Скопировать"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                {copyState && <p className="hint">{copyState}</p>}
                {linkError && <p className="error">{linkError}</p>}
              </div>
            )}
          />
          
          {/* НОВОЕ ПОЛЕ: Ссылка на чат */}
          <Controller
            name="chatLink"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на чат</label>
                <div className="input-with-icon-wrapper">
                  <input 
                    {...field} 
                    placeholder="https://..." 
                    readOnly 
                  />
                  <div className="input-icons-group">
                    {/* Кнопка Открыть */}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => openLink(field.value)}
                      disabled={!field.value}
                      title="Открыть чат"
                    >
                      <ExternalLink size={18} />
                    </button>

                    {/* Кнопка Выйти (Отвязать) */}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={handleUnlinkTelegram}
                      disabled={!isTelegramLinked || isUnlinking}
                      title="Отвязать Telegram"
                    >
                      <Link2Off size={18} color="#ff6b6b" /> {/* Красная иконка для опасного действия */}
                    </button>
                  </div>
                </div>
                {unlinkState && <p className="hint">{unlinkState}</p>}
                {unlinkError && <p className="error">{unlinkError}</p>}
              </div>
            )}
          />
        </div>
      </fieldset>
    </div>
  );
}