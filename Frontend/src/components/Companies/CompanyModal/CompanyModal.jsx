import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { companySchema } from './companySchema'; 
import CompanyHeader from './CompanyHeader'; 
import CompanyTabsNav from './CompanyTabsNav'; 
import ConfirmationModal from '../../modals/confirm/ConfirmationModal';
import ChatPanel from '../../Client/ClientModal/ChatPanel'; 

import SummaryTab from './tabs/SummaryTab';
import CompanyEmployeesTab from './tabs/CompanyEmployeesTab';
import AccessTab from './tabs/AccessTab';
import CompanyFinancesTab from './tabs/CompanyFinancesTab';

import '../../../styles/ExecutorModal.css'; 

export default function CompanyModal({
    company, 
    clients,
    transactions,
    onClose,
    onSave,
    onDelete
}) {
    const safeCompany = company ?? {};
    const isNew = !safeCompany.id;

    const [activeTab, setActiveTab] = useState('summary'); 
    const [closing, setClosing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const formId = 'company-form';
    const formDefaults = useMemo(() => ({
        name: '',
        phone: '',
        email: '',
        tags: [],
        ...safeCompany,
    }), [safeCompany]);

    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const methods = useForm({
        resolver: yupResolver(companySchema),
        mode: 'onChange',
        defaultValues: formDefaults,
    });

    const { handleSubmit, reset, formState: { isDirty, errors } } = methods;

    useEffect(() => {
        reset(formDefaults);
    }, [formDefaults, reset]);

    const companyClients = clients.filter(c => String(c.company_id) === String(safeCompany.id) || c.company === safeCompany.name);
    const firstContactName = companyClients.length > 0 ? (companyClients[0].full_name || companyClients[0].name) : null;

    const submitHandler = (data) => {
        const dataToSave = {
            ...safeCompany, 
            ...data,
        };
        onSave(dataToSave);
    };

    const onInvalid = (err) => {
        const firstErrorField = Object.keys(err)[0];
        if (['name', 'phone', 'email'].includes(firstErrorField)) {
            setActiveTab('summary');
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
        onDelete(safeCompany);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className={`employee-modal-overlay ${isOpen ? 'open' : ''} ${closing ? 'closing' : ''}`} onClick={closeHandler}>
            <div className="employee-modal tri-layout" onClick={(e) => e.stopPropagation()}>
                
                <div className="left-panel">
                    <FormProvider {...methods}>
                        <form
                            id={formId}
                            className="employee-modal-body" 
                            onSubmit={handleSubmit(submitHandler, onInvalid)}
                        >
                            <CompanyHeader
                                isNew={isNew}
                                onClose={closeHandler}
                                onDelete={!isNew && onDelete ? deleteHandler : null}
                                isDirty={isDirty}
                                reset={reset}
                                firstContactName={firstContactName} 
                            />

                            <CompanyTabsNav
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                errors={errors} 
                            />
                            
                            <div className="tab-content-wrapper custom-scrollbar">
                                {activeTab === 'summary' && <SummaryTab company={safeCompany} />}
                                
                                {activeTab === 'employees' && (
                                    <CompanyEmployeesTab 
                                        clients={clients} 
                                        companyName={safeCompany.name} 
                                        companyId={safeCompany.id} 
                                    />
                                )}
                                
                                {activeTab === 'access' && <AccessTab />}
                                {activeTab === 'finances' && <CompanyFinancesTab transactions={transactions} clients={clients} companyName={safeCompany.name} />}
                            </div>
                        </form>
                    </FormProvider>
                    
                    {isDirty && (
                        <div className='form-actions-bottom'>
                            <button className='cancel-order-btn' type="button" onClick={() => reset(formDefaults)}>
                                Отменить
                            </button>
                            <button className='save-order-btn' type="submit" form={formId}>
                                Сохранить
                            </button>
                        </div>
                    )}
                </div>

                {isNew ? (
                    <div className="chat-panel-wrapper chat-placeholder">
                        <p>Сохраните компанию, чтобы открыть чат.</p>
                    </div>
                ) : (
                    <div className="chat-panel-wrapper">
                         <ChatPanel />
                    </div>
                )}

                <div className="right-side-menu">
                    {isNew ? (
                        <div className="menu-placeholder">
                            <p>Сохраните компанию, чтобы ставить задачи</p>
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
                    message={`Вы уверены, что хотите удалить компанию "${safeCompany.name}"?`}
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
