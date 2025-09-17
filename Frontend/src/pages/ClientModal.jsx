
// src/components/ClientModal.jsx
import React, { useState } from 'react';
import {
  useForm,
  FormProvider,
  Controller,
  useFieldArray
} from 'react-hook-form';
import AddCompanyModal from '../components/Client/AddCompanyForm';
import TagSelector from '../components/Client/TagSelector';
import ImagePreviewModal from '../components/Client/ImagePreviewModal';
import '../styles/ClientModal.css';

/**
 * Модальное окно клиента. Позволяет редактировать общую информацию,
 * контакты, финансы и доступы. Все данные хранятся в React-Hook-Form.
 */
export default function ClientModal({
  client,
  companies = [],
  employees = [],
  referrers = [],
  countries = [],
  currencies = [],
  tagsOptions = [], // оставлено для совместимости
  onClose,
  onSave,
  onAddCompany
}) {
  const safeClient = client || {};
  const [activeTab, setActiveTab] = useState('info');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const fieldLabels = {
  info: 'Общая информация',
  name: 'Клиент',
  company_id: 'Компания',
  category: 'Категория',
  source: 'Источник',
  tags: 'Теги',
  messenger_name: 'Имя в мессенджере',
  intro_description: 'Вводное описание',
  note: 'Примечание',
  // contacts
  full_name: 'ФИО',
  phone: 'Телефон',
  email: 'Почта',
  country: 'Страна',
  city: 'Город',
  chat_link: 'Ссылка на чат',
  photo_link: 'Ссылка на фото',
  folder_link: 'Ссылка на папку',
  // finances
  currency: 'Валюта',
  payment_details: 'Реквизиты для оплаты',
  hourly_rate: 'Ставка / час',
  percent: 'Процент доли',
  share_info: 'Наличие доли',
  referrer_id: 'Реферер',
  referrer_first_id: 'Первый реферер',
  manager_id: 'Менеджер',
  // accesses
  accesses: 'Доступы'
};
const tabLabels = {
  info: 'Общая информация',
  contacts: 'Контакты',
  finances: 'Финансы',
  accesses: 'Доступы'
};
const [isClosing, setIsClosing] = useState(false);
const handleClose = () => {
  setIsClosing(true);
  // ждём анимацию (300 мс), затем вызываем внешний onClose
  setTimeout(() => {
    onClose();
  }, 300);
};
  /* ----------------------------- React‑Hook‑Form --------------------------- */
  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'all',
    shouldUnregister: false,
    defaultValues: {
      /* базовые поля */
      tags: Array.isArray(safeClient.tags) ? safeClient.tags : [],
      name: safeClient.name || '',
      messenger_name: safeClient.messenger_name || '',
      intro_description: safeClient.intro_description || '',
      note: safeClient.note || '',
      category: safeClient.category || '',
      source: safeClient.source || '',
      company_id: safeClient.company_id || '',
      /* контакты */
      full_name: safeClient.full_name || '',
      phone: safeClient.phone || '',
      email: safeClient.email || '',
      country: safeClient.country || '',
      city: safeClient.city || '',
      chat_link: safeClient.chat_link || '',
      photo_link: safeClient.photo_link || '',
      folder_link: safeClient.folder_link || '',
      /* финансы */
      currency: safeClient.currency || '',
      payment_details: safeClient.payment_details || '',
      hourly_rate: safeClient.hourly_rate || '',
      percent: safeClient.percent || '',
      share_info: safeClient.share_info || false,
      referrer_id: safeClient.referrer_id || '',
      referrer_first_id: safeClient.referrer_first_id || '',
      manager_id: safeClient.manager_id || '',
      /* доступы */
      accesses: Array.isArray(safeClient.accesses) ? safeClient.accesses : [],
      access_note: safeClient.access_note || ''
    }
  });
const getTabErrors = (errors) => {
  const errorMap = {
    info: ['name', 'category', 'source', 'tags', 'company_id', 'messenger_name', 'intro_description', 'note'],
    contacts: ['full_name', 'phone', 'email', 'country', 'city', 'chat_link', 'photo_link', 'folder_link'],
    finances: ['currency', 'payment_details', 'hourly_rate', 'percent', 'referrer_id', 'referrer_first_id', 'manager_id'],
    accesses: ['accesses']
  };
const isHidden = (tab) => (activeTab === tab ? {} : { style: { display: 'none' } });
  const tabErrors = {};
  for (const [tab, fields] of Object.entries(errorMap)) {
    for (const field of fields) {
      if (errors[field]) {
        if (!tabErrors[tab]) tabErrors[tab] = [];
        tabErrors[tab].push(field);
      }
    }
  }

  return tabErrors;
};
const onInvalid = (errors) => {
 const grouped = getTabErrors(errors);
 setFormErrors(grouped);

 // Переключаем на первую вкладку, где есть хотя бы одна ошибка
 const tabsOrder = ['info', 'contacts', 'finances', 'accesses'];
 const firstErrorTab = tabsOrder.find(tab => grouped[tab] && grouped[tab].length > 0);
 if (firstErrorTab && firstErrorTab !== activeTab) {
   setActiveTab(firstErrorTab);
}
};

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors, isValid, isDirty }
  } = methods;

  /* ------------------------------- useFieldArray --------------------------- */
  const { fields: accesses, append, remove } = useFieldArray({ control, name: 'accesses' });

  /* --------------------- Статические опции для TagSelector ----------------- */
  const initialTagOptions = [
    { name: 'Improvement', color: '#f1c40f' },
    { name: 'Task', color: '#8e44ad' },
    { name: 'Research', color: '#16a085' },
    { name: 'Refactor', color: '#d35400' },
    { name: 'Documentation', color: '#7f8c8d' },
    { name: 'Testing', color: '#2c3e50' },
    { name: 'Chore', color: '#bdc3c7' },
    { name: 'Enhancement', color: '#e67e22' },
    { name: 'Support', color: '#1abc9c' },
    { name: 'Discussion', color: '#3498db' },
    { name: 'Bug', color: '#c0392b' },
    { name: 'Feature', color: '#27ae60' }
  ];

  /* ------------------------------ Submit handler --------------------------- */
  const onSubmit = data => {
    onSave(data);
    onClose();
  };

  /* --------------------------- Рендер содержимого вкладок ------------------ */
  const renderTabContent = () => {
    switch (activeTab) {
      /* ============================= INFO TAB ============================= */
      case 'info':
        return (
          <div className="tab-section" key="info"> 
        
            {/* Теги */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagSelector
                  tags={Array.isArray(field.value) ? field.value : []}
                  options={initialTagOptions}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Имя клиента */}
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Поле обязательно' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Клиент</label>
                  <input {...field} placeholder="Клиент" className={errors.name ? 'input-error' : ''} />
                  {errors.name && <p className="error">{errors.name.message}</p>}
                </div>
              )}
            />

            {/* Категория и источник */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Категория</label>
                  <input {...field} placeholder="Категория" />
                </div>
              )}
            />
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Источник</label>
                  <input {...field} placeholder="Источник" />
                </div>
              )}
            />

            {/* Описания */}
            <Controller
              name="intro_description"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Вводное описание</label>
                  <textarea {...field} placeholder="Вводное описание" />
                </div>
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Примечание</label>
                  <textarea {...field} placeholder="Примечание" />
                </div>
              )}
            />

            {/* Компания */}
            <Controller
              name="company_id"
              control={control}
              rules={{ required: 'Выберите компанию' }}
              render={({ field: { value, onChange } }) => (
                <div className="form-field">
                  <label>Компания</label>
                  <div className="company-wrapper">
                    <select value={value} onChange={e => onChange(e.target.value)} className={errors.company_id ? 'input-error' : ''}>
                      <option value="">-- Выберите компанию --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCompanyModal(true)}>+</button>
                  </div>
                  {errors.company_id && <p className="error">{errors.company_id.message}</p>}
                </div>
              )}
            />

            {/* Имя в мессенджере */}
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
          </div>
        );

      /* =========================== CONTACTS TAB =========================== */
      case 'contacts':
        return (
          <div className="tab-section" key="contacts"> 
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>ФИО</label>
                  <input {...field} placeholder="ФИО" />
                </div>
              )}
            />
            <Controller
              name="phone"
              control={control}
              rules={{
                required: 'Телефон обязателен',
                pattern: {
                  value: /^\+\d{7,}$/,
                  message: 'Номер должен начинаться с “+” и содержать минимум 7 цифр'
                }
              }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Телефон</label>
                  <input {...field} placeholder="Телефон" className={errors.phone ? 'input-error' : ''} />
                  {errors.phone && <p className="error">{errors.phone.message}</p>}
                </div>
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email обязателен',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат' }
              }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Почта</label>
                  <input {...field} placeholder="Email" className={errors.email ? 'input-error' : ''} />
                  {errors.email && <p className="error">{errors.email.message}</p>}
                </div>
              )}
            />
            <Controller
              name="country"
              control={control}
              rules={{ required: 'Выберите страну' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Страна</label>
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
            <Controller name="city" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Город</label>
                <input {...field} placeholder="Город" />
              </div>
            )} />
            <Controller name="chat_link" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на чат</label>
                <input {...field} placeholder="Ссылка на чат" />
              </div>
            )} />
            <Controller name="folder_link" control={control}           render={({ field }) => (
                <div className="form-field">
                  <label>Ссылка на папку</label>
                  <input {...field} placeholder="Ссылка на папку" />
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
                    <input {...field} placeholder="Ссылка на фото" />
                    <button type="button" onClick={() => field.value && setIsImageOpen(true)} disabled={!field.value}>
                      Проверить изображение
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        );

      /* =========================== FINANCES TAB =========================== */
      case 'finances':
        return (
          <div className="tab-section finances" key="finances">
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Выберите валюту' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Валюта</label>
                  <select {...field} className={errors.currency ? 'input-error' : ''}>
                    <option value="">-- Выберите валюту --</option>
                    {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                  </select>
                  {errors.currency && <p className="error">{errors.currency.message}</p>}
                </div>
              )}
            />
            <Controller
              name="payment_details"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Реквизиты для оплаты</label>
                  <textarea {...field} placeholder="Реквизиты для оплаты" />
                </div>
              )}
            />
            
              <Controller name="hourly_rate" control={control} render={({ field }) => (
                <div className="form-field">
                  <label>Оплата в час</label>
                  <input type="number" {...field} placeholder="В час" />
                </div>
              )} />
              <div className="two-cols">
              <Controller
                name="percent"
                control={control}
                rules={{
                  min: { value: 0,    message: 'Не может быть меньше 0' },
                  max: { value: 100,  message: 'Не может быть больше 100' }
                }}
                render={({ field }) => (
                  <div className="form-field">
                    <label>Процент бюджета %</label>
                    <input
                      type="number"
                      {...field}
                      placeholder="%"
                      min={0}
                      max={100}
                      step={5}       
                      className={errors.percent ? 'input-error' : ''}
                    />
                    {errors.percent && <p className="error">{errors.percent.message}</p>}
                  </div>
                )}
              />

            
              <Controller
  name="share_info"
  control={control}
  render={({ field: { value, onChange, ...rest } }) => (
    <div className="form-field switch-field full-width">
      {/* <span className="switch-label">Есть доля?</span> */}
 <label>Есть доля?</label>
      <label className="switch">
        <input
          type="checkbox"
          checked={value}
          onChange={e => onChange(e.target.checked)}
          {...rest}
        />
        <span className="slider" />
      </label>
    </div>
  )}
/>

            </div>
            <Controller name="referrer_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Реферер</label>
                <select {...field}>
                  <option value="">-- Выберите реферера --</option>
                  {referrers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )} />
            <Controller name="referrer_first_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Реферер первый</label>
                <select {...field}>
                  <option value="">-- Выберите первого реферера --</option>
                  {referrers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )} />
            <Controller name="manager_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Менеджер</label>
                <select {...field}>
                  <option value="">-- Выберите менеджера --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            )} />
          </div>
        );

      /* =========================== ACCESSES TAB =========================== */
      case 'accesses':
        return (
          <div className="tab-section accesses" key="accesses">
            <div className="accesses-table-wrapper">
              <table className="accesses-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Логин</th>
                    <th>Пароль</th>
                    <th>Описание</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {accesses.map((field, idx) => (
                    <tr key={field.id}>
                      <td><input {...register(`accesses.${idx}.name`)} defaultValue={field.name} placeholder="Название" /></td>
                      <td><input {...register(`accesses.${idx}.login`)} defaultValue={field.login} placeholder="Логин" /></td>
                      <td><input {...register(`accesses.${idx}.password`)} defaultValue={field.password} placeholder="Пароль" /></td>
                      <td><input {...register(`accesses.${idx}.description`)} defaultValue={field.description} placeholder="Описание" /></td>
                      <td>
                        <button type="button" className="remove-access-btn" onClick={() => remove(idx)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="add-access-btn" onClick={() => append({ name: '', login: '', password: '', description: '' })}>
                + Добавить доступ
              </button>
            </div>
            {/* <Controller name="access_note" control={control} render={({ field }) => (
              <div className="form-field full-width">
                <label>Примечание к доступам</label>
                <textarea {...field} placeholder="Примечание" />
              </div>
            )} /> */}
          </div>
        );
      default:
        return null;
    }
  };
const isHidden = (tab) => (activeTab === tab ? {} : { style: { display: 'none' } });
  /* ------------------------------ Main render ------------------------------ */
  return (
    <div className="client-modal-overlay">
      <div className="client-modal">
        {/* --------------------------- HEADER & NAV -------------------------- */}
        <div className="modal-header">
          <h2>{safeClient.name || 'Новый клиент'}</h2>
          <button className="close-btn" onClick={handleClose}>Закрыть</button>
          {/* <div className="header-controls">
            <button className="menu-btn">⋮</button>
            {safeClient.photo_link && <img className="avatar" src={safeClient.photo_link} alt="Фото клиента" />}
          </div> */}
        </div>
        <nav className="tabs-nav">
          <ul>
            <li className={activeTab==='info' ? 'active' : ''} onClick={()=>setActiveTab('info')}>Общая информация</li>
            <li className={activeTab==='contacts' ? 'active' : ''} onClick={()=>setActiveTab('contacts')}>Контакты</li>
            <li className={activeTab==='finances' ? 'active' : ''} onClick={()=>setActiveTab('finances')}>Финансы</li>
            <li className={activeTab==='accesses' ? 'active' : ''} onClick={()=>setActiveTab('accesses')}>Доступы</li>
          </ul>
        </nav>

        {/* ------------------------------ BODY ------------------------------ */}
        <FormProvider {...methods}>
         
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="modal-body">         
            {/* <div className="main-content">{renderTabContent()}</div> */}
            <div className="main-content">
   <section className="tab-section" {...isHidden('info')}>
          <div className="tab-section" key="info"> 
        
            {/* Теги */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagSelector
                  tags={Array.isArray(field.value) ? field.value : []}
                  options={initialTagOptions}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Имя клиента */}
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Поле обязательно' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Клиент</label>
                  <input {...field} placeholder="Клиент" className={errors.name ? 'input-error' : ''} />
                  {errors.name && <p className="error">{errors.name.message}</p>}
                </div>
              )}
            />

            {/* Категория и источник */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Категория</label>
                  <input {...field} placeholder="Категория" />
                </div>
              )}
            />
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Источник</label>
                  <input {...field} placeholder="Источник" />
                </div>
              )}
            />

            {/* Описания */}
            <Controller
              name="intro_description"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Вводное описание</label>
                  <textarea {...field} placeholder="Вводное описание" />
                </div>
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Примечание</label>
                  <textarea {...field} placeholder="Примечание" />
                </div>
              )}
            />

            {/* Компания */}
            <Controller
              name="company_id"
              control={control}
              rules={{ required: 'Выберите компанию' }}
              render={({ field: { value, onChange } }) => (
                <div className="form-field">
                  <label>Компания</label>
                  <div className="company-wrapper">
                    <select value={value} onChange={e => onChange(e.target.value)} className={errors.company_id ? 'input-error' : ''}>
                      <option value="">-- Выберите компанию --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCompanyModal(true)}>+</button>
                  </div>
                  {errors.company_id && <p className="error">{errors.company_id.message}</p>}
                </div>
              )}
            />

            {/* Имя в мессенджере */}
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
          </div>
        </section>

      {/*/* =========================== CONTACTS TAB =========================== */}
     <section className="tab-section" {...isHidden('contacts')}>
          <div className="tab-section" key="contacts"> 
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>ФИО</label>
                  <input {...field} placeholder="ФИО" />
                </div>
              )}
            />
            <Controller
              name="phone"
              control={control}
              rules={{
                required: 'Телефон обязателен',
                pattern: {
                  value: /^\+\d{7,}$/,
                  message: 'Номер должен начинаться с “+” и содержать минимум 7 цифр'
                }
              }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Телефон</label>
                  <input {...field} placeholder="Телефон" className={errors.phone ? 'input-error' : ''} />
                  {errors.phone && <p className="error">{errors.phone.message}</p>}
                </div>
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email обязателен',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат' }
              }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Почта</label>
                  <input {...field} placeholder="Email" className={errors.email ? 'input-error' : ''} />
                  {errors.email && <p className="error">{errors.email.message}</p>}
                </div>
              )}
            />
            <Controller
              name="country"
              control={control}
              rules={{ required: 'Выберите страну' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Страна</label>
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
            <Controller name="city" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Город</label>
                <input {...field} placeholder="Город" />
              </div>
            )} />
            <Controller name="chat_link" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Ссылка на чат</label>
                <input {...field} placeholder="Ссылка на чат" />
              </div>
            )} />
            <Controller name="folder_link" control={control}           render={({ field }) => (
                <div className="form-field">
                  <label>Ссылка на папку</label>
                  <input {...field} placeholder="Ссылка на папку" />
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
                    <input {...field} placeholder="Ссылка на фото" />
                    <button type="button" onClick={() => field.value && setIsImageOpen(true)} disabled={!field.value}>
                      Проверить изображение
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        </section>

      {/* =========================== FINANCES TAB =========================== */}
      <section className="tab-section" {...isHidden('finances')}>
          <div className="tab-section finances" key="finances">
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Выберите валюту' }}
              render={({ field }) => (
                <div className="form-field">
                  <label>Валюта</label>
                  <select {...field} className={errors.currency ? 'input-error' : ''}>
                    <option value="">-- Выберите валюту --</option>
                    {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                  </select>
                  {errors.currency && <p className="error">{errors.currency.message}</p>}
                </div>
              )}
            />
            <Controller
              name="payment_details"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <label>Реквизиты для оплаты</label>
                  <textarea {...field} placeholder="Реквизиты для оплаты" />
                </div>
              )}
            />
            
              <Controller name="hourly_rate" control={control} render={({ field }) => (
                <div className="form-field">
                  <label>Оплата в час</label>
                  <input type="number" {...field} placeholder="В час" />
                </div>
              )} />
              <div className="two-cols">
              <Controller
                name="percent"
                control={control}
                rules={{
                  min: { value: 0,    message: 'Не может быть меньше 0' },
                  max: { value: 100,  message: 'Не может быть больше 100' }
                }}
                render={({ field }) => (
                  <div className="form-field">
                    <label>Процент доли %</label>
                    <input
                      type="number"
                      {...field}
                      placeholder="%"
                      min={0}
                      max={100}
                      step={1}        /* при необходимости две цифры после запятой */
                      className={errors.percent ? 'input-error' : ''}
                    />
                    {errors.percent && <p className="error">{errors.percent.message}</p>}
                  </div>
                )}
              />

            
              <Controller
  name="share_info"
  control={control}
  render={({ field: { value, onChange, ...rest } }) => (
    <div className="form-field switch-field full-width">
      {/* <span className="switch-label">Есть доля?</span> */}
 <label>Есть доля?</label>
      <label className="switch">
        <input
          type="checkbox"
          checked={value}
          onChange={e => onChange(e.target.checked)}
          {...rest}
        />
        <span className="slider" />
      </label>
    </div>
  )}
/>

            </div>
            <Controller name="referrer_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Реферер</label>
                <select {...field}>
                  <option value="">-- Выберите реферера --</option>
                  {referrers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )} />
            <Controller name="referrer_first_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Реферер первый</label>
                <select {...field}>
                  <option value="">-- Выберите первого реферера --</option>
                  {referrers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )} />
            <Controller name="manager_id" control={control} render={({ field }) => (
              <div className="form-field">
                <label>Менеджер</label>
                <select {...field}>
                  <option value="">-- Выберите менеджера --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            )} />
          </div>
       </section>

      {/* =========================== ACCESSES TAB =========================== */}
      <section className="tab-section" {...isHidden('accesses')}>
          <div className="tab-section accesses" key="accesses">
            <div className="accesses-table-wrapper">
              <table className="accesses-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Логин</th>
                    <th>Пароль</th>
                    <th>Описание</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {accesses.map((field, idx) => (
                    <tr key={field.id}>
                      <td><input {...register(`accesses.${idx}.name`)} defaultValue={field.name} placeholder="Название" /></td>
                      <td><input {...register(`accesses.${idx}.login`)} defaultValue={field.login} placeholder="Логин" /></td>
                      <td><input {...register(`accesses.${idx}.password`)} defaultValue={field.password} placeholder="Пароль" /></td>
                      <td><input {...register(`accesses.${idx}.description`)} defaultValue={field.description} placeholder="Описание" /></td>
                      <td>
                        <button type="button" className="remove-access-btn" onClick={() => remove(idx)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="add-access-btn" onClick={() => append({ name: '', login: '', password: '', description: '' })}>
                + Добавить доступ
              </button>
            </div>
            {/* <Controller name="access_note" control={control} render={({ field }) => (
              <div className="form-field full-width">
                <label>Примечание к доступам</label>
                <textarea {...field} placeholder="Примечание" />
              </div>
            )} /> */}
          </div>
         </section>
</div>
            <div className="form-actions-bottom">
              <button type="button" onClick={()=>reset()} disabled={!isDirty}>Сбросить</button>
              {/* <button type="submit" disabled={!isValid}>Сохранить</button> */}
              <button type="submit">Сохранить</button>
            </div>
          </form>
        </FormProvider>

        {/* --------------------------- EXTRA MODALS -------------------------- */}
        {isImageOpen && (
          <ImagePreviewModal src={getValues('photo_link')} onClose={()=>setIsImageOpen(false)} />
        )}
        {showCompanyModal && (
          <AddCompanyModal
            onCreate={async data => {
              const created = await onAddCompany(data);
              setValue('company_id', created.id);
              setShowCompanyModal(false);
            }}
            onCancel={()=>setShowCompanyModal(false)}
          />
        )}
        {formErrors && (
          <div className="error-modal-overlay">
            <div className="error-modal">
              <h3>Не все обязательные поля заполнены. Пожалуйста, проверьте выделенные вкладки.</h3>
              <ul>
                {Object.entries(formErrors).map(([tab, fields]) => (
                  <li key={tab}>
                    <strong>{tabLabels[tab] || tab}</strong>: {fields.map(f => fieldLabels[f] || f).join(', ')}
                  </li>
                ))}
              </ul>
              <button onClick={() => setFormErrors(null)}>Хорошо</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

