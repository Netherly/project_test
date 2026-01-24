import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { executorSchema } from './executorSchema'; 

import ExecutorHeader from './ExecutorHeader';
import TabsNav from './TabsNav'; 
import GeneralInfoTab from './tabs/GeneralInfoTab';
import FinancesTab from './tabs/FinancesTab';
import JournalTab from './tabs/JournalTab';
import DashboardTab from './tabs/DashboardTab';
import ChatPanel from '../../Client/ClientModal/ChatPanel';
import ConfirmationModal from '../../modals/confirm/ConfirmationModal';

import '../../../styles/ExecutorModal.css';

export default function ExecutorModal({
  executor, 
  orders,
  journalEntries,   
  fields,  
  onClose,
  onSave,
  onDelete
}) {
  const safeExecutor = executor ?? {};
  const isNew = !safeExecutor.id;

  const [activeTab, setActiveTab] = useState('general');
  const [closing, setClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const methods = useForm({
        resolver: yupResolver(executorSchema),
        mode: 'onChange',
        defaultValues: {
            orderNumber: '',
            performer: '', 
            dateForPerformer: new Date().toISOString().split('T')[0], 
            hideClient: false,
            roundHours: false,
            currency: fields?.currency?.[0]?.value || '', 
            hourlyRate: '',
            amountInput: '',
            maxAmount: '',
            ...safeExecutor,
           role: safeExecutor.performerRole || (fields?.role && fields.role.length > 0 ? fields.role[0].value : ''),
        },
    });

  const { handleSubmit, reset, formState: { isDirty, errors } } = methods;

  const submitHandler = (data) => {
        console.log("Данные из формы:", data);
        
        const dataToSave = {
            ...safeExecutor, 
            ...data,        
            performerRole: data.role,
            orderSum: parseFloat(data.amountInput) || 0,
            hourlyRate: parseFloat(data.hourlyRate) || 0,
            paymentBalance: parseFloat(data.maxAmount) || 0,
            clientHidden: data.hideClient,
            orderDate: data.dateForPerformer,
        };
        
        onSave(dataToSave);
    };

  const onInvalid = (err) => {
    console.log("Ошибки валидации:", err);
    const firstErrorField = Object.keys(err)[0];
    if (['orderNumber', 'performer', 'role', 'dateForPerformer'].includes(firstErrorField)) {
        setActiveTab('general');
    } else if (['currency', 'hourlyRate', 'amountInput', 'maxAmount'].includes(firstErrorField)) {
        setActiveTab('finances');
    }
  };

   const handleActualClose = () => {
        setClosing(true);
        setTimeout(onClose, 300);
    };

    const closeHandler = () => {
        if (isDirty) {
            setShowCloseConfirm(true);
        } else {
            handleActualClose();
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        handleActualClose();
    };
    
    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    const deleteHandler = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete(safeExecutor);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

  const TABS = [
      { id: 'dashboard', label: 'Дашборд' },
      { id: 'general', label: 'Общее' },
      { id: 'journal', label: 'Журнал' },
      { id: 'finances', label: 'Финансы' },
  ];

  return (
    <div className={`employee-modal-overlay ${isOpen ? 'open' : ''} ${closing ? 'closing' : ''}`} onClick={closeHandler}>
      <div className="employee-modal tri-layout" onClick={(e) => e.stopPropagation()}>
        
        <div className="left-panel">
          <FormProvider {...methods}>
            <form
              className="employee-modal-body custom-scrollbar"
              onSubmit={handleSubmit(submitHandler, onInvalid)}
            >
              <ExecutorHeader
                isNew={isNew}
                onClose={closeHandler}
                onDelete={!isNew && onDelete ? deleteHandler : null}
                isDirty={isDirty}
                reset={reset}
              />

              <TabsNav
                tabs={TABS}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                errors={errors} 
              />
              
              <div className="tab-content-wrapper">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'general'   && <GeneralInfoTab orders={orders} fields={fields} />}
                {activeTab === 'journal'   && <JournalTab isNew={isNew} executor={safeExecutor} journalEntries={journalEntries} />}
                {activeTab === 'finances'  && <FinancesTab isNew={isNew} executor={safeExecutor} />}
              </div>

            </form>
          </FormProvider>
          <div className='form-actions-bottom'>
                              <button className='cancel-order-btn' type="button" onClick={() => reset()} disabled={!isDirty}>
                                  Сбросить
                              </button>
                              <button className='save-order-btn' type="submit" disabled={!isDirty}>
                                  Сохранить
                              </button>
                          </div>
        </div>

        
        {isNew ? (
          <div className="chat-panel-wrapper chat-placeholder">
            <p>Сохраните исполнителя, чтобы открыть чат.</p>
          </div>
        ) : (
          <div className="chat-panel-wrapper">
             <ChatPanel employeeId={safeExecutor.performer} />
          </div>
        )}

        <div className="right-side-menu">
          {isNew ? (
            <div className="menu-placeholder">
              <p>Сохраните исполнителя, чтобы ставить задачи</p>
            </div>
          ) : (
             <button type="button" className="menu-button">Поставить задачу</button>
          )}
        </div>

      </div>
      {showCloseConfirm && (
                <ConfirmationModal
                    title="Сообщение"
                    message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
                    confirmText="Да, закрыть"
                    cancelText="Отмена"
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                />
            )}
            
            {showDeleteConfirm && (
                <ConfirmationModal
                    title="Подтверждение удаления"
                    message={`Вы уверены, что хотите удалить исполнителя "${safeExecutor.performer}" из заказа №${safeExecutor.orderNumber}?`}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    isDelete={true} 
                />
            )}
    </div>
  );
}