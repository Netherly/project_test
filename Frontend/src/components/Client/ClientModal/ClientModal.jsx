// src/components/Client/ClientModal/ClientModal.jsx
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { clientSchema } from '../validationSchema';

import ClientHeader      from './ClientHeader';
import TabsNav           from './TabsNav';
import InfoTab           from './InfoTab';
import ContactsTab       from './ContactsTab';
import FinancesTab       from './FinancesTab';
import AccessesTab       from './AccessesTab';
import ChatPanel         from './ChatPanel';
import ActionsBar        from './ActionsBar';
import AddCompanyModal   from '../AddCompanyForm';
import ImagePreviewModal from '../ImagePreviewModal';

import '../../../styles/ClientModal.css';

export default function ClientModal({
  client,
  companies   = [],
  employees   = [],
  referrers   = [],
  countries   = [],
  currencies  = [],
  onClose,
  onSave,
  onAddCompany,
  onDelete,
  onAddOrder   = () => {},
  onDuplicate  = () => {}
}) {
  const safeClient = client ?? {};
  const isNew = !safeClient.id;    // новый клиент, ещё не сохранён

  const [activeTab,   setActiveTab]   = useState(isNew ? 'info' : 'summary');
  const [showCompany, setShowCompany] = useState(false);
  const [showImage,   setShowImage]   = useState(false);
  const [closing,     setClosing]     = useState(false);
  const [formErrors,  setFormErrors]  = useState(null);

  // пример логов
  const sampleLogs = [
    { timestamp: '2023-03-07T12:36', author: 'Менеджеры', message: 'Отримувач: …' },
    { timestamp: '2023-03-07T12:38', author: 'Менеджеры', message: 'ДУБЛЬ!!!!!!!!!!!' },
    { timestamp: '2023-03-07T12:38', author: 'Менеджеры', message: 'гл talnova' },
    { timestamp: new Date().toISOString(), author: 'Лев', message: 'Не' },
  ];

  /* ---------- useForm ---------- */
  const methods = useForm({
    resolver: yupResolver(clientSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      ...safeClient,
      tags:       safeClient.tags       ?? [],
      accesses:   safeClient.accesses   ?? [],
      share_info: safeClient.share_info ?? false
    }
  });

  const {
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { isDirty }
  } = methods;

  /* ---------- Ошибки по вкладкам ---------- */
  const errorMap = {
    info:     ['name','company_id','category','source','tags'],
    contacts: ['full_name','phone','email','country'],
    finances: ['currency','percent','referrer_id'],
    accesses: ['accesses']
  };
  const groupErrors = err => {
    const grouped = {};
    Object.keys(err).forEach(f => {
      const tab = Object.keys(errorMap).find(t => errorMap[t].includes(f));
      if (tab) (grouped[tab] ??= []).push(f);
    });
    return grouped;
  };

  /* ---------- Сохранение / валидация ---------- */
  const submitHandler = data => {
    onSave(data);
    closeHandler();
  };
  const onInvalid = err => {
    const grouped = groupErrors(err);
    setFormErrors(grouped);
    const firstTab = ['info','contacts','finances','accesses'].find(t => grouped[t]);
    if (firstTab) setActiveTab(firstTab);
  };

  /* ---------- Закрытие / Удаление ---------- */
  const closeHandler = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };
  const deleteHandler = async () => {
    if (!onDelete) return;
    if (window.confirm('Удалить клиента безвозвратно?')) {
      await onDelete(safeClient.id);
      closeHandler();
    }
  };

  return (
    <div className={`client-modal-overlay${closing ? ' closing' : ''}`}>
      <div className="client-modal tri-layout">

        {/* ─── левая панель ─── */}
        <div className="left-panel">
          <FormProvider {...methods}>
            <ClientHeader
              onClose={closeHandler}
              onDelete={onDelete ? deleteHandler : null}
            />
          </FormProvider>
          <TabsNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            errors={formErrors}
            isNew={isNew}
          />
          <FormProvider {...methods}>
            <form
              className="client-modal-body custom-scrollbar"
              onSubmit={handleSubmit(submitHandler, onInvalid)}
            >
              {activeTab === 'info'     && <InfoTab     companies={companies} onAddCompany={() => setShowCompany(true)} />}
              {activeTab === 'contacts' && <ContactsTab countries={countries}  openImage={() => getValues('photo_link') && setShowImage(true)} />}
              {activeTab === 'finances' && <FinancesTab currencies={currencies} referrers={referrers} employees={employees} />}
              {activeTab === 'accesses' && <AccessesTab />}
            </form>
          </FormProvider>
          <div className="form-actions-bottom">
                <button className="cancel-order-btn" type="button" onClick={()=>reset()} disabled={!isDirty}>Отменить</button>
                <button className="save-order-btn" type="submit">Сохранить</button>
              </div>
        </div>

        {/* ─── центр – чат ─── */}
        {isNew ? (
          <div className="chat-panel-wrapper chat-placeholder">
            <p>Сохраните клиента, чтобы открыть чат.</p>
          </div>
        ) : (
          <div className="chat-panel-wrapper">
            <ChatPanel clientId={safeClient.id} initialLogs={sampleLogs} />
          </div>
        )}

        {/* ─── правая панель действий ─── */}
        {isNew ? (
          <div className="menu-placeholder">
            <p>Сохраните клиента, чтобы добавить заказ или дублировать.</p>
          </div>
        ) : (
          <div className="right-side-menu">
            <ActionsBar onAddOrder={onAddOrder} onDuplicate={onDuplicate} />
          </div>
        )}
      </div>

      {/* ─── модалки поверх ─── */}
      {showCompany && (
        <AddCompanyModal
          onCreate={async data => {
            const created = await onAddCompany(data);
            setValue('company_id', created.id);
            setShowCompany(false);
          }}
          onCancel={() => setShowCompany(false)}
        />
      )}
      {showImage && (
        <ImagePreviewModal src={getValues('photo_link')} onClose={() => setShowImage(false)} />
      )}
      {formErrors && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <h3>Заполните обязательные поля:</h3>
            <ul>
              {Object.entries(formErrors).map(([tab, fields]) => (
                <li key={tab}><b>{tab}</b>: {fields.join(', ')}</li>
              ))}
            </ul>
            <button onClick={() => setFormErrors(null)}>Ок</button>
          </div>
        </div>
      )}
    </div>
  );
}
