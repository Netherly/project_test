import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import OrderSummary from './OrderSummary';
import GeneralInformation from './GeneralInformation';
import WorkPlan from './WorkPlan';
import Participants from './Participants';
import Finance from './Finance';
import OrderExecution from './OrderExecution';
import CompletingOrder from './CompletingOrder';
import ConfirmationModal from '../confirm/ConfirmationModal';
import ChatPanel from '../../Client/ClientModal/ChatPanel';
import AddLogEntryForm from '../../Journal/AddLogEntryForm';
import * as executorService from '../../Executors/executorService';
import AddExecutorModal from '../../Executors/AddExecutorModal';
import AddTransactionModal from '../../Transaction/AddTransactionModal';
import { useTransactions } from '../../../context/TransactionsContext';
import { addLogEntry, getEmployees, getOrders } from '../../Journal/journalApi'
import { stageColors, getStageColor } from '../../Orders/stageColors';
import { sampleClients } from '../../../data/sampleClients'; 
import '../../../styles/OrderModal.css';

const stages = [
  "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
  "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
  "На уточнении у клиента", "Тестируем", "Тестирует клиент",
  "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
  "Неудачно завершён", "Удаленные"
];

const defaultTags = ["Срочный", "В приоритете", "На паузе", "Клиент VIP"];

const tabs = ["Сводка","Основное", "Планы", "Участники", "Финансы", "Выполнение", "Завершение"];


const newOrderDefaults = {
    stage: 'Лид',
    tags: [],
    isOldOrder: false,
    urgency: "",
    appealDate: new Date().toISOString().split('T')[0], 
    proposalDate: "",
    orderDate: "",
    interval: "",
    orderType: "",
    orderStatus: "",
    closeReason: "",
    plannedStartDate: "",
    plannedFinishDate: "",
    project: "",
    orderDescription: "",   
    techTags: [],     
    taskTags: [],                                         
    workList: [{ description: "", amount: "", specification: "", sale: false }],
    techSpecifications: "",
    additionalConditions: "",
    notes: "", 
    order_client: "",
    order_main_client: "",
    client_company: "",
    partner_name: "",
    third_parties: [],
    partner_disable_share: false,
    partner_payment: "",
    partner_plan: "",
    partner_percent_plan: "",
    partner_sum_plan: "",
    partner_underpayment: "",
    performers: [],
    share_percent: "",
    budget: "",
    currency_type: "",
    currency_rate: "",
    hourly_rate: "",
    round_hour: false,
    discount: "",
    upsell: "",
    expenses: "",
    tips: "",
    payment_details: "",
    payment_log: [{ date: '', item: '', sub_item: '', account: '', amount: '' }],
    executionTime: "",
    startDate: "",
    endDate: "",
    countDays: "",
    completedDate: "",
    completingTime: "",
    completingLink: "",
    orderImpressions: "",
};


function OrderModal({ order = null, mode = 'edit', onClose, onUpdateOrder, onCreateOrder, onDeleteOrder, journalEntries }) {
  const methods = useForm({
    defaultValues: mode === 'create' ? newOrderDefaults : {
      stage: order?.stage || '',
      tags: order?.tags || [],
      isOldOrder: order?.isOldOrder || false,
      urgency: order?.urgency || "",
      appealDate: order?.appealDate || "",
      proposalDate: order?.proposalDate || "",
      orderDate: order?.orderDate || "",
      interval: order?.interval || "",
      orderType: order?.orderType || "",
      orderStatus: order?.orderStatus || "",
      closeReason: order?.closeReason || "",
      plannedStartDate: order?.plannedStartDate || "",
      plannedFinishDate: order?.plannedFinishDate || "",
      project: order?.project || "",
      orderDescription: order?.orderDescription || "",   
      techTags: order?.techTags || [],     
      taskTags: order?.taskTags || [],                                         
      workList: order?.workList && order.workList.length > 0 
        ? order.workList 
        : [{ description: "", amount: "", specification: "", sale: false }],
      techSpecifications: order?.techSpecifications || "",
      additionalConditions: order?.additionalConditions || "",
      notes: order?.notes || "", 
      order_client: order?.order_client || "",
      order_main_client: order?.order_main_client || "",
      client_company: order?.client_company || "",
      partner_name: order?.partner_name || "",
      third_parties: order?.third_parties || "",
      partner_disable_share: order?.partner_disable_share || false,
      partner_payment: order?.partner_payment || "",
      partner_plan: order?.partner_plan || "",
      partner_percent_plan: order?.partner_percent_plan || "",
      partner_sum_plan: order?.partner_sum_plan || "",
      partner_underpayment: order?.partner_underpayment || "",
      performers: order?.performers || [],
      share_percent: order?.share_percent || "",
      budget: order?.budget || "",
      currency_type: order?.currency_type || "",
      currency_rate: order?.currency_rate || "",
      hourly_rate: order?.hourly_rate || "",
      round_hour: order?.round_hour || false,
      discount: order?.discount || "",
      upsell: order?.upsell || "",
      expenses: order?.expenses || "",
      tips: order?.tips || "",
      payment_details: order?.payment_details || "",
      payment_log: order?.payment_log && order.payment_log.length > 0
        ? order.payment_log
        : [{ date: '', item: '', sub_item: '', account: '', amount: '' }],
      executionTime: order?.executionTime || "",
      startDate: order?.startDate || "",
      endDate: order?.endDate || "",
      countDays: order?.countDays || "",
      completedDate: order?.completedDate || "",
      completingTime: order?.completingTime || "",
      completingLink: order?.completingLink || "",
      orderImpressions: order?.orderImpressions || "",
    }
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,  
    getValues,
    formState: { isDirty },
  } = methods;

  const {
        isAddModalOpen,
        openAddTransactionModal,
        closeAddTransactionModal,
        addTransaction,
        assets,
        financeFields,
        initialDataForModal,
        orders,
        counterparties,
    } = useTransactions();

  const [customTag, setCustomTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('Сводка');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [orderFields, setOrderFields] = useState({ intervals: [], categories: [], currency: [] });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddExecutorModalOpen, setIsAddExecutorModalOpen] = useState(false);
  const [executorFormFields, setExecutorFormFields] = useState({ employees: [], role: [], currency: [] });
  const [employees, setEmployees] = useState([]);
   useEffect(() => {
        setEmployees(getEmployees());
    }, []);

  useEffect(() => {
    
    if (!order || !order.id || !journalEntries) {
        console.log("Ждем загрузки данных заказа или журнала...", { order, journalEntries });
        return; 
    }

    console.log(`--- Начинаем фильтрацию для заказа ID: ${order.id} ---`);
    console.log("Всего записей в журнале:", journalEntries.length);

    
    const relevantEntries = journalEntries.filter(entry => {
        const orderIdStr = String(order.id);
        const entryOrderNumStr = String(entry.orderNumber).trim(); 

       
        if (entry.id === 1756485911484) { 
             console.log(`Сравнение: ID заказа "${orderIdStr}" === OrderNumber записи "${entryOrderNumStr}" -> ${orderIdStr === entryOrderNumStr}`);
        }

        return orderIdStr === entryOrderNumStr;
    });

    console.log(`Найдено релевантных записей: ${relevantEntries.length}`, relevantEntries);

    
    const formattedWorkLog = relevantEntries.map(entry => ({
        executor: entry.email,
        role: entry.executorRole,
        work_date: entry.workDate,
        hours: entry.hours,
        description: entry.workDone,
        original_id: entry.id
    }));
    
    console.log("Отформатированный work_log для формы:", formattedWorkLog);

    
    const currentFormValues = getValues(); 
    reset({
        ...currentFormValues, 
        work_log: formattedWorkLog
    });
    
    console.log("--- Форма обновлена ---");

}, [order, journalEntries, reset, getValues]); 

  

    const handleClientPayment = () => {
        const defaults = {
            operation: 'Зачисление',
            category: 'Оплата от клиента',
            subcategory: 'Предоплата', 
            counterparty: order.clientName, 
            amount: order.totalPrice, 
            description: `Оплата по заказу #${order.id}`,
        };
        openAddTransactionModal(defaults);
    };

    const handlePartnerPayout = () => {
        const defaults = {
            operation: 'Списание',
            category: 'Выплата партнеру',
            counterparty: order.partnerName,
            amount: order.partnerFee, 
            description: `Выплата партнеру по заказу #${order.id}`,
        };
        openAddTransactionModal(defaults);
    };

    const handleExecutorPayout = () => {
        const defaults = {
            operation: 'Списание',
            category: 'Выплата исполнителю',
            counterparty: order.executorName,
            amount: order.executorFee,
            description: `Выплата исполнителю по заказу #${order.id}`,
        };
        openAddTransactionModal(defaults);
    };


  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const stageDropdownRef = useRef(null);

  const watchedStage = watch('stage');
  const watchedTags = watch('tags');

   const handleAddLogEntry = (logData) => {
        const newEntry = {
            ...logData
        };
        addLogEntry(newEntry); 
        setIsLogModalOpen(false); 
       
    };

  const calculateDaysFromOrder = () => {
    if (mode === 'create' || !order?.date) return 0;
    const orderDate = new Date(order.date.split('.').reverse().join('-'));
    const currentDate = new Date();
    const diffTime = currentDate - orderDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const createMultiColorProgress = () => {
    const currentStageIndex = stages.indexOf(watchedStage);
    const segments = [];
    for (let i = 0; i <= currentStageIndex; i++) {
      const stageColor = getStageColor(stages[i]);
      const segmentWidth = (1 / stages.length) * 100;
      segments.push({
        color: stageColor,
        width: segmentWidth,
        left: i * segmentWidth
      });
    }
    return segments;
  };

  const filteredTags = defaultTags.filter(tag =>
    !watchedTags.includes(tag) &&
    tag.toLowerCase().includes(customTag.toLowerCase())
  );
  
  const handleTagSelect = (tag, onChange) => {
    if (tag && !watchedTags.includes(tag)) {
      onChange([...watchedTags, tag]);
      setCustomTag('');
      setShowTagDropdown(false);
    }
  };

  const handleCustomTagAdd = (e, onChange) => {
    if (e.key === 'Enter' && customTag.trim() && !watchedTags.includes(customTag.trim())) {
      onChange([...watchedTags, customTag.trim()]);
      setCustomTag('');
      setShowTagDropdown(false);
      e.preventDefault();
    }
  };

  const handleTagInputChange = (e) => {
    setCustomTag(e.target.value);
    setShowTagDropdown(true);
  };

  const handleTagInputFocus = () => {
    setShowTagDropdown(true);
  };

  const handleTagRemove = (tagToRemove, onChange) => {
    onChange(watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleStageSelect = (stage, onChange) => {
    onChange(stage);
    setShowStageDropdown(false);
  };

  const handleActionSelect = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
    setShowActionsMenu(false);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'duplicate') {
      console.log('Дублируем заказ', order.id);
    } else if (confirmAction === 'delete') {
       if (onDeleteOrder) {
          onDeleteOrder(order.id);
      }
      onClose();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const getConfirmModalProps = () => {
    if (confirmAction === 'duplicate') {
      return {
        title: 'Дублировать заказ',
        message: `Вы уверены, что хотите дублировать заказ #${order.id}?`,
        confirmText: 'Дублировать',
        cancelText: 'Отмена'
      };
    } else if (confirmAction === 'delete') {
      return {
        title: 'Удалить заказ',
        message: `Вы уверены, что хотите удалить заказ #${order.id}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      };
    }
    return {};
  };

  const onSubmit = (data) => {
    if (mode === 'create') {
      onCreateOrder(data);
    } else {
      onUpdateOrder({
        ...order,
        ...data,
      });
    }
    onClose();
  };
  
  const resetChanges = () => {
    reset(mode === 'create' ? newOrderDefaults : {
        stage: order?.stage || '',
        tags: order?.tags || [],
        isOldOrder: order?.isOldOrder || false,
        urgency: order?.urgency || "",
        appealDate: order?.appealDate || "",
        proposalDate: order?.proposalDate || "",
        orderDate: order?.orderDate || "",
        interval: order?.interval || "",
        orderType: order?.orderType || "",
        orderStatus: order?.orderStatus || "",
        closeReason: order?.closeReason || "",
        plannedStartDate: order?.plannedStartDate || "",
        plannedFinishDate: order?.plannedFinishDate || "",
        project: order?.project || "",
        orderDescription: order?.orderDescription || "",   
        techTags: order?.techTags || [],     
        taskTags: order?.taskTags || [],                                         
        workList: order?.workList && order.workList.length > 0 
            ? order.workList 
            : [{ description: "", amount: "", specification: "", sale: false }],
        techSpecifications: order?.techSpecifications || "",
        additionalConditions: order?.additionalConditions || "",
        notes: order?.notes || "", 
        order_client: order?.order_client || "",
        order_main_client: order?.order_main_client || "",
        client_company: order?.client_company || "",
        partner_name: order?.partner_name || "",
        third_parties: order?.third_parties || "",
        partner_disable_share: order?.partner_disable_share || false,
        partner_payment: order?.partner_payment || "",
        partner_plan: order?.partner_plan || "",
        partner_percent_plan: order?.partner_percent_plan || "",
        partner_sum_plan: order?.partner_sum_plan || "",
        partner_underpayment: order?.partner_underpayment || "",
        performers: order?.performers || [],
        share_percent: order?.share_percent || "",
        budget: order?.budget || "",
        currency_type: order?.currency_type || "",
        currency_rate: order?.currency_rate || "",
        hourly_rate: order?.hourly_rate || "",
        round_hour: order?.round_hour || false,
        discount: order?.discount || "",
        upsell: order?.upsell || "",
        expenses: order?.expenses || "",
        tips: order?.tips || "",
        payment_details: order?.payment_details || "",
        payment_log: order?.payment_log && order.payment_log.length > 0
            ? order.payment_log
            : [{ date: '', item: '', sub_item: '', account: '', amount: '' }],
        executionTime: order?.executionTime || "",
        startDate: order?.startDate || "",
        endDate: order?.endDate || "",
        countDays: order?.countDays || "",
        completedDate: order?.completedDate || "",
        completingTime: order?.completingTime || "",
        completingLink: order?.completingLink || "",
        orderImpressions: order?.orderImpressions || "",
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target) &&
          tagInputRef.current && !tagInputRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target)) {
        setShowStageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
      const savedFields = localStorage.getItem('fieldsData');
      if (savedFields) {
          try {
              const parsedFields = JSON.parse(savedFields);
              if (parsedFields.orderFields) {
                  setOrderFields(parsedFields.orderFields);
              }
          } catch (e) {
              console.error("Ошибка парсинга полей заказа из localStorage:", e);
          }
      }
  }, []);

  const [orderTransactions, setOrderTransactions] = useState([]);

  
  useEffect(() => {
    if (order && order.id) {
      const savedTransactionsRaw = localStorage.getItem('transactionsData');
      if (savedTransactionsRaw) {
        try {
          const allTransactions = JSON.parse(savedTransactionsRaw);
          
          const filtered = allTransactions.filter(
            (trx) => trx.orderId === order.id
          );
          setOrderTransactions(filtered);
        } catch (e) {
          console.error("Ошибка парсинга транзакций из localStorage:", e);
          setOrderTransactions([]);
        }
      }
    }
  }, [order]);

  useEffect(() => {
        
        const employeesFromStorage = JSON.parse(localStorage.getItem('employees')) || [];
        const activeEmployees = employeesFromStorage.filter(emp => emp.status === 'active');

        
        const savedFields = localStorage.getItem('fieldsData');
        let executorFieldsData = { role: [], currency: [] };
        if (savedFields) {
            const parsed = JSON.parse(savedFields);
            if (parsed.executorFields) {
                executorFieldsData = parsed.executorFields;
            }
        }

        setExecutorFormFields({
            employees: activeEmployees,
            role: executorFieldsData.role,
            currency: executorFieldsData.currency,
        });
    }, []);


    
    const handleAddExecutor = (executorDataFromModal) => {
        
        const employeeDetails = executorFormFields.employees.find(
            emp => emp.fullName === executorDataFromModal.performer
        );

        if (employeeDetails) {
            const newExecutorForOrder = {
                ...executorDataFromModal,
                login: employeeDetails.login,
                fullName: employeeDetails.fullName,
            };

            
            const currentPerformers = getValues('performers') || [];
            setValue('performers', [...currentPerformers, newExecutorForOrder], { shouldDirty: true });

            
            executorService.addExecutor(newExecutorForOrder);
        }
        
        setIsAddExecutorModalOpen(false); 
    };

  const multiColorSegments = createMultiColorProgress();
  const daysFromOrder = calculateDaysFromOrder();

  return (
    <div className="order-modal-overlay">
      <div className="order-modal-content">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="order-modal-form">
            <div className="order-modal-header-section">
              <div className='header-top-row'>
                 <button className="close-button" onClick={onClose}>{'<'}</button>
                 <div className="modal-header">
              <h2 className="modal-order-title">
                {mode === 'create'
                  ? 'Создание нового заказа'
                  : (order?.name || (order?.numberOrder ? `Заказ № ${order.numberOrder}` : `Заявка #${order?.id}`))
                }
              </h2>
              {isDirty && (
                  <div className="action-buttons">
                  <button
                      type="button"
                      className="cancel-order-btn"
                      onClick={resetChanges}
                  >
                      Отменить
                  </button>
                  <button type="submit" className="save-order-btn">Сохранить</button>
                  </div>
              )}
              {mode === 'edit' && (
                <div className="order-actions-menu">
                  <button
                    type="button"
                    className="order-actions-btn"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                  >
                    ⋮
                  </button>
                  {showActionsMenu && (
                    <div className="order-actions-dropdown">
                      <button
                        type="button"
                        className="order-action-item"
                        onClick={() => handleActionSelect('duplicate')}
                      >
                        Дублировать заказ
                      </button>
                      <button
                        type="button"
                        className="order-action-item"
                        onClick={() => handleActionSelect('delete')}
                      >
                        Удалить заказ
                      </button>
                    </div>
                  )}
                </div>
              )}
               </div>
              </div>
                <div className="tags-section-header">
                  <Controller
                    control={control}
                    name="tags"
                    render={({ field: { onChange } }) => (
                      <>
                        <div className="tag-input-container-header" ref={tagInputRef}>
                          <input
                            type="text"
                            placeholder="Добавить тег"
                            className="input-tag"
                            value={customTag}
                            onChange={handleTagInputChange}
                            onKeyDown={(e) => handleCustomTagAdd(e, onChange)}
                            onFocus={handleTagInputFocus}
                            autoComplete="off"
                          />
                          {showTagDropdown && (filteredTags.length > 0 || customTag.trim()) && (
                            <div className="tag-dropdown-header" ref={tagDropdownRef}>
                              {filteredTags.map(tag => (
                                <div
                                  key={tag}
                                  className="tag-dropdown-item-header"
                                  onClick={() => handleTagSelect(tag, onChange)}
                                >
                                  {tag}
                                </div>
                              ))}
                              {customTag.trim() && !defaultTags.includes(customTag) && !watchedTags.includes(customTag) && (
                                <div
                                  className="tag-dropdown-item tag-dropdown-custom-header"
                                  onClick={() => handleTagSelect(customTag.trim(), onChange)}
                                >
                                  Добавить: "{customTag}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {watchedTags.map((tag, index) => (
                          <span
                            key={index}
                            className="tag-chips tag-order-chips-header"
                            onClick={() => handleTagRemove(tag, onChange)}
                          >
                            {tag}
                          </span>
                        ))}
                      </>
                    )}
                  />
                </div>
                <div className="developing-stages-container">
                  <Controller
                      control={control}
                      name="stage"
                      render={({ field: { value, onChange } }) => (
                      <div className="stage-select-container">
                          <div className="custom-stage-select" ref={stageDropdownRef}>
                              <div
                                  className="stage-select-trigger"
                                  onClick={() => setShowStageDropdown(!showStageDropdown)}
                                  style={{ color: getStageColor(value) }}
                              >
                                  {value}
                              </div>
                              {showStageDropdown && (
                                  <div className="stage-dropdown">
                                  {stages.map(stage => (
                                      <div
                                      key={stage}
                                      className="stage-dropdown-item"
                                      onClick={() => handleStageSelect(stage, onChange)}
                                      style={{ color: getStageColor(stage) }}
                                      >
                                      {stage}
                                      </div>
                                  ))}
                                  </div>
                              )}
                          </div>
                          {mode === 'edit' && daysFromOrder > 0 && (
                              <span className="days-counter">
                                  {daysFromOrder} {daysFromOrder === 1 ? 'день' : daysFromOrder < 5 ? 'дня' : 'дней'}
                              </span>
                          )}
                      </div>
                      )}
                  />
                  <div className="progress-bar">
                      {multiColorSegments.map((segment, index) => (
                          <div
                              key={index}
                              className="progress-segment"
                              style={{
                                  width: `${segment.width}%`,
                                  backgroundColor: segment.color,
                                  left: `${segment.left}%`,
                                  position: 'absolute',
                                  height: '100%',
                                  borderRadius: index === 0 ? '4px 0 0 4px' : index === multiColorSegments.length - 1 ? '0 4px 4px 0' : '0'
                              }}
                          ></div>
                      ))}
                  </div>
                </div>
                 <div className="tabs-container">
                <div className="tabs">
                    {tabs.map(tab => (
                        <button
                        key={tab}
                        type="button"
                        className={`tab-menu-btn${activeTab === tab ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        >
                        {tab}
                        </button>
                    ))}
                </div>
                 </div>
            </div>
            


            <div className='order-modal-body-section'>
                  <div className="tab-content">
                    {activeTab === "Сводка" && <OrderSummary />}
                    {activeTab === "Основное" && (
                      <GeneralInformation
                        control={control}
                        orderFields={orderFields}
                        mode={mode}
                      />
                    )}
                    {activeTab === "Планы" && (
                      <WorkPlan
                        control={control}
                        mode={mode}
                      />
                    )}
                    {activeTab === "Участники" && <Participants control={control} mode={mode} clientsData={sampleClients} employeesData={executorFormFields.employees} onOpenAddExecutorModal={() => setIsAddExecutorModalOpen(true)} />}
                    {activeTab === "Финансы" && <Finance control={control} orderFields={orderFields} mode={mode} transactions={orderTransactions}  />}
                    {activeTab === "Выполнение" && <OrderExecution control={control} mode={mode} />}
                    {activeTab === "Завершение" && <CompletingOrder control={control} mode={mode} />}
                  </div>
            </div>
          </form>
        </FormProvider>
      </div>
      <div className="order-chat-panel-wrapper">
          {mode === 'create' ? (
            <div className="chat-placeholder">
              <p>Сохраните заказ, чтобы начать общение в чате.</p>
            </div>
          ) : (
            <ChatPanel orderId={order?.id} />
          )}
      </div>
      <div className="right-side-menu">
          {mode === 'create' ? (
              <div className="menu-placeholder">
                  <p>Сохраните заказ чтобы пользоваться функциональным меню.</p>
              </div>
          ) : (
              <>
                  <button type="button" className="menu-button" onClick={() => setIsAddExecutorModalOpen(true)}>Прикрепить исполнителя</button>
                  <button type="button" className="menu-button" onClick={() => setIsLogModalOpen(true)}>Запись в журнал</button>
                  <button type="button" className="menu-button">Поставить задачу</button>
                  <div className="menu-separator" />
                  <button type="button" className="menu-button">Сгенерировать счет</button>
                  <button type="button" className="menu-button" onClick={handleClientPayment}>Оплата клиента</button>
                  <button type="button" className="menu-button" onClick={handlePartnerPayout}>Выплата партнеру</button>
                  <button type="button" className="menu-button" onClick={handleExecutorPayout}>Выплата исполнителю</button>
                  <div className="menu-separator" />
                  <button type="button" className="menu-button">Ссылка на отзыв</button>
                  <button type="button" className="menu-button">Ссылка на отзыв 2</button>
                  <div className="menu-separator" />
                  <button type="button" className="menu-button">Дублировать заказ</button>
              </>
          )}
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          {...getConfirmModalProps()}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      )}
      {isLogModalOpen && (
        <AddLogEntryForm
            onAdd={handleAddLogEntry}
            onClose={() => setIsLogModalOpen(false)}
            orders={orders}
            employees={employees}
        />
      )}
      
      {isAddExecutorModalOpen && (
                <AddExecutorModal
                    onAdd={handleAddExecutor}
                    onClose={() => setIsAddExecutorModalOpen(false)}
                    fields={executorFormFields}
                    orders={orders} 
                />
            )}
      {isAddModalOpen && (
                <AddTransactionModal
                    onAdd={addTransaction}
                    onClose={closeAddTransactionModal}
                    assets={assets}
                    financeFields={financeFields}
                    initialData={initialDataForModal}
                    orders={orders} 
                    counterparties={counterparties} 
                />
            )}
    </div>
  );
}

export default OrderModal;