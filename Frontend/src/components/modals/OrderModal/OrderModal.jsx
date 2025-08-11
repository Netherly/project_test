import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import GeneralInformation from './GeneralInformation';
import WorkPlan from './WorkPlan';
import Participants from './Participants';
import Finance from './Finance';
import OrderExecution from './OrderExecution';
import CompletingOrder from './CompletingOrder';
import ConfirmationModal from '../confirm/ConfirmationModal';
import { stageColors, getStageColor } from '../../Orders/stageColors';

import '../../../styles/OrderModal.css';

const stages = [
  "Лид", "Изучаем ТЗ", "Обсуждаем с клиентом", "Клиент думает",
  "Ожидаем предоплату", "Взяли в работу", "Ведется разработка",
  "На уточнении у клиента", "Тестируем", "Тестирует клиент",
  "На доработке", "Ожидаем оплату", "Успешно завершен", "Закрыт",
  "Неудачно завершён", "Удаленные"
];

const defaultTags = ["Срочный", "В приоритете", "На паузе", "Клиент VIP"];

const tabs = ["Общая информация", "План работ", "Участники", "Финансы", "Выполнение заказа", "Завершение заказа"];

function OrderModal({ order, onClose, onUpdateOrder }) {
const methods = useForm({
  defaultValues: {
    stage: order.stage || '',
    tags: order.tags || [],
    //GeneralInformation
    urgency: order.urgency || "",
    appealDate: order.appealDate || "",
    proposalDate: order.proposalDate || "",
    orderDate: order.orderDate || "",
    interval: order.interval || "",
    orderType: order.orderType || "",
    orderStatus: order.orderStatus || "",
    closeReason: order.closeReason || "",
    plannedStartDate: order.plannedStartDate || "",
    plannedFinishDate: order.plannedFinishDate || "",
    //WorkPlan
    orderDescription: order.orderDescription || "",   
    techTags: order.techTags || [],     
    taskTags: order.taskTags || [],                        
    workList: order.workList && order.workList.length > 0 
      ? order.workList 
      : [                                                   
          // по умолчанию можно хотя бы одну пустую строку, если массив пуст
          { description: "", amount: "", specification: "", sale: false }
        ],
    techSpecifications: order.techSpecifications || "", 
    // Participants
    order_client: order.order_client || "",
    order_main_client: order.order_main_client || "",
    client_company: order.client_company || "",
    partner_name: order.partner_name || "",
    partner_disable_share: order.partner_disable_share || false,
    partner_payment: order.partner_payment || "",
    partner_plan: order.partner_plan || "",
    partner_percent_plan: order.partner_percent_plan || "",
    partner_sum_plan: order.partner_sum_plan || "",
    partner_underpayment: order.partner_underpayment || "",
    // Finance
    share_percent: order.share_percent || "",
    budget: order.budget || "",
    currency_type: order.currency_type || "",
    currency_rate: order.currency_rate || "",
    hourly_rate: order.hourly_rate || "",
    round_hour: order.round_hour || false,
    //OrderExecution
    executionTime: order.executionTime || "",
    startDate: order.startDate || "",
    endDate: order.endDate || "",
    countDays: order.countDays || "",
    //CompletingOrder
    completedDate: order.completedDate || "",
    completingTime: order.completingTime || "",
    completingLink: order.completingLink || "",
    orderImpressions: order.orderImpressions || "",
  }
});

const {
  control,
  handleSubmit,
  watch,
  reset,
  formState: { isDirty }
} = methods;

  const [customTag, setCustomTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('Общая информация');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [orderFields, setOrderFields] = useState({ intervals: [], categories: [], currency: [] });

  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const stageDropdownRef = useRef(null);

  const watchedStage = watch('stage');
  const watchedTags = watch('tags');
  const watchedUrgency = watch('urgency');
  const watchedPlannedFinishDate = watch('plannedFinishDate');
  const watchedTechTags = watch('techTags');

  const calculateDaysFromOrder = () => {
    if (!order.date) return 0;
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
      console.log('Удаляем заказ', order.id);
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
    onUpdateOrder({
      ...order,
      ...data,
    });
    onClose();
  };

  const resetChanges = () => {
    reset({
      stage: order.stage || '',
      tags: order.tags || [],
      urgency: order.urgency || "",
      plannedFinishDate: order.plannedFinishDate || "",
      techTags: order.techTags || [],
      //GeneralInformation
      appealDate: order.appealDate || "",
      proposalDate: order.proposalDate || "",
      orderDate: order.orderDate || "",
      interval: order.interval || "",
      orderType: order.orderType || "",
      orderStatus: order.orderStatus || "",
      closeReason: order.closeReason || "",
      plannedStartDate: order.plannedStartDate || "",

      // Добавляем поля для WorkPlan:
      orderDescription: order.orderDescription || "",        // описание заказа (textarea)
      taskTags: order.taskTags || [],                        // теги задач
      workList: order.workList && order.workList.length > 0 
        ? order.workList 
        : [                                                   
            // по умолчанию можно хотя бы одну пустую строку, если массив пуст
            { description: "", amount: "", specification: "", sale: false }
          ],
      techSpecifications: order.techSpecifications || "",   // итоговое ТЗ (textarea)

      // Participants
      order_client: order.order_client || "",
      order_main_client: order.order_main_client || "",
      client_company: order.client_company || "",
      partner_name: order.partner_name || "",
      partner_disable_share: order.partner_disable_share || false,
      partner_payment: order.partner_payment || "",
      partner_plan: order.partner_plan || "",
      partner_percent_plan: order.partner_percent_plan || "",
      partner_sum_plan: order.partner_sum_plan || "",
      partner_underpayment: order.partner_underpayment || "",
      // Finance
      share_percent: order.share_percent || "",
      budget: order.budget || "",
      currency_type: order.currency_type || "",
      currency_rate: order.currency_rate || "",
      hourly_rate: order.hourly_rate || "",
      round_hour: order.round_hour || false,
      //OrderExecution
      executionTime: order.executionTime || "",
      startDate: order.startDate || "",
      endDate: order.endDate || "",
      countDays: order.countDays || "",
      //CompletingOrder
      completedDate: order.completedDate || "",
      completingTime: order.completingTime || "",
      completingLink: order.completingLink || "",
      orderImpressions: order.orderImpressions || "",
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

  const progress = ((stages.indexOf(watchedStage) + 1) / stages.length) * 100;
  const currentStageColor = getStageColor(watchedStage);
  const multiColorSegments = createMultiColorProgress();
  const daysFromOrder = calculateDaysFromOrder();

  return (
    <div className="order-modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>{'<'}</button>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="order-modal-form">
            <div className="modal-header">
              <h2 className="modal-order-title">
                {order.name ? order.name : order.numberOrder ? `Заказ № ${order.numberOrder}` : `Заявка #${order.id}`}
              </h2>
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
            </div>

            <div className="tags-section">
              <Controller
                control={control}
                name="tags"
                render={({ field: { onChange } }) => (
                  <>
                    <div className="tag-input-container" ref={tagInputRef}>
                      <input
                        type="text"
                        placeholder="Добавить тег или выбрать"
                        className="input-tag"
                        value={customTag}
                        onChange={handleTagInputChange}
                        onKeyDown={(e) => handleCustomTagAdd(e, onChange)}
                        onFocus={handleTagInputFocus}
                        autoComplete="off"
                      />
                      {showTagDropdown && (filteredTags.length > 0 || customTag.trim()) && (
                        <div className="tag-dropdown" ref={tagDropdownRef}>
                          {filteredTags.map(tag => (
                            <div
                              key={tag}
                              className="tag-dropdown-item"
                              onClick={() => handleTagSelect(tag, onChange)}
                            >
                              {tag}
                            </div>
                          ))}
                          {customTag.trim() && !defaultTags.includes(customTag) && !watchedTags.includes(customTag) && (
                            <div
                              className="tag-dropdown-item tag-dropdown-custom"
                              onClick={() => handleTagSelect(customTag.trim(), onChange)}
                            >
                              Добавить: "{customTag}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="tag-chips-container">
                      {watchedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="tag-chips tag-order-chips"
                          onClick={() => handleTagRemove(tag, onChange)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
                    {daysFromOrder > 0 && (
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

            <div className="tab-content">
              {activeTab === "Общая информация" && (
                <GeneralInformation
                  order={order}
                  control={control}
                  orderFields={orderFields}
                />
              )}
              {activeTab === "План работ" && (
                <WorkPlan
                  order={order}
                  control={control}
                />
              )}
              {activeTab === "Участники" && <Participants order={order} control={control}/>}
              {activeTab === "Финансы" && <Finance order={order} control={control} orderFields={orderFields} />}
              {activeTab === "Выполнение заказа" && <OrderExecution order={order} control={control} />}
              {activeTab === "Завершение заказа" && <CompletingOrder order={order} control={control} />}
            </div>

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
          </form>
        </FormProvider>
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
    </div>
  );
}

export default OrderModal;