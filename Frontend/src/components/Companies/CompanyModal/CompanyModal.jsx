// /components/Companies/CompanyModal/CompanyModal.jsx

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { companySchema } from './companySchema'; 
import CompanyHeader from './CompanyHeader'; // <-- Новый хедер
import CompanyTabsNav from './CompanyTabsNav'; // <-- Новая навигация
import ConfirmationModal from '../../modals/confirm/ConfirmationModal';
import ChatPanel from '../../Client/ClientModal/ChatPanel'; 

// Стили
import '../../../styles/ExecutorModal.css'; // <-- Используем стили от модала исполнителя

// --- Утилита форматирования (нужна для вкладки "Финансы") ---
const formatNumberWithSpaces = (num) => {
    if (num === null || num === undefined || isNaN(Number(num))) {
        return '0.00';
    }
    const fixedNum = Number(num).toFixed(2);
    const parts = fixedNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
};

// --- Компоненты вкладок (оставляем как в прошлый раз) ---

const SummaryTab = ({ company }) => (
    <div className="tab-section">
        <p>Сводка по компании {company?.name || ''} (в разработке)</p>
        {/* TODO: Добавить сюда основные поля формы (name, phone, email...) */}
    </div>
);

const CompanyEmployeesTab = ({ clients, companyName }) => {
    const companyClients = companyName 
        ? clients.filter(c => c.company === companyName) 
        : [];
    return (
        <div className="tab-section">
            <div className="tab-content-title">Сотрудники ({companyClients.length})</div>
            {/* ... (код вкладки) ... */}
        </div>
    );
};

const AccessTab = () => (
    <div className="tab-section placeholder-tab">
        <p>Доступы (в разработке)</p>
    </div>
);

const CompanyFinancesTab = ({ transactions, clients, companyName }) => {
    const companyClientIds = companyName
        ? clients.filter(c => c.company === companyName).map(c => c.id)
        : [];
    const companyTransactions = transactions.filter(t => 
        companyClientIds.includes(t.clientId)
    );

    return (
        <div className="tab-section">
            <div className="tab-content-title">Журнал операций</div>
            
            {/* Используем ту же таблицу, что и раньше */}
            <div className="finances-log-table">
                {/* ... (код таблицы) ... */}
            </div>
        </div>
    );
};


// --- ОСНОВНОЙ КОМПОНЕНТ МОДАЛА ---

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

    const [activeTab, setActiveTab] = useState('summary'); // <-- Вкладка по умолчанию
    const [closing, setClosing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const methods = useForm({
        resolver: yupResolver(companySchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            tags: [], // Добавлено для хедера
            ...safeCompany,
        },
    });

    const { handleSubmit, reset, formState: { isDirty, errors } } = methods;

    const submitHandler = (data) => {
        console.log("Данные из формы:", data);
        const dataToSave = {
            ...safeCompany, 
            ...data,
        };
        onSave(dataToSave);
    };

    const onInvalid = (err) => {
        console.log("Ошибки валидации:", err);
        const firstErrorField = Object.keys(err)[0];
        if (['name', 'phone', 'email'].includes(firstErrorField)) {
            setActiveTab('summary');
        }
    };

    // ... (Обработчики закрытия и удаления) ...
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
                            className="employee-modal-body" 
                            onSubmit={handleSubmit(submitHandler, onInvalid)}
                        >
                            <CompanyHeader
                                isNew={isNew}
                                onClose={closeHandler}
                                onDelete={!isNew && onDelete ? deleteHandler : null}
                                isDirty={isDirty}
                                reset={reset}
                            />

                            <CompanyTabsNav
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                errors={errors} 
                            />
                            
                            <div className="tab-content-wrapper">
                                {activeTab === 'summary' && <SummaryTab company={safeCompany} />}
                                {activeTab === 'employees' && <CompanyEmployeesTab clients={clients} companyName={safeCompany.name} />}
                                {activeTab === 'access' && <AccessTab />}
                                {activeTab === 'finances' && <CompanyFinancesTab transactions={transactions} clients={clients} companyName={safeCompany.name} />}
                            </div>
                        </form>
                    </FormProvider>
                    
                   
                    <div className='form-actions-bottom'>
                        <button className='cancel-order-btn' type="button" onClick={() => reset()} disabled={!isDirty}>
                            Сбросить
                        </button>
                        <button className='save-order-btn' type="submit" onClick={handleSubmit(submitHandler, onInvalid)} disabled={!isDirty}>
                            Сохранить
                        </button>
                    </div>
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