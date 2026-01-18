import React, { useState, useRef, useEffect } from 'react';
import { Controller,  useFormContext } from 'react-hook-form';
import CustomSelect from '../../ui/CustomSelect';
import AddExecutorModal from '../../Executors/AddExecutorModal'; 
import PerformerCard from '../../ui/PerformerCard';
import ConfirmationModal from '../confirm/ConfirmationModal';
import * as executorService from '../../Executors/executorService';

const Participants = ({ control, clientsData, employeesData,  onOpenAddExecutorModal }) => {
  
  const allPerformers = ["Иван Иванов", "Петр Петров", "Сидор Сидоров", "Анна Кузнецова"];
  const [customPerformer, setCustomPerformer] = useState('');
  const [showPerformerDropdown, setShowPerformerDropdown] = useState(false);
  const performerInputRef = useRef(null);
  const performerDropdownRef = useRef(null);
  const { watch, setValue, getValues } = useFormContext();
  const [selectedClientInfo, setSelectedClientInfo] = useState(null);
  const [customThirdParty, setCustomThirdParty] = useState('');
  const [showThirdPartyDropdown, setShowThirdPartyDropdown] = useState(false);
  const thirdPartyInputRef = useRef(null);
  const thirdPartyDropdownRef = useRef(null);
  const [isExecutorModalOpen, setIsExecutorModalOpen] = useState(false);
  const [performerToDelete, setPerformerToDelete] = useState(null);


  const safeClients = Array.isArray(clientsData) ? clientsData : [];
  const allClientsOptions = safeClients.map(client => ({
    value: client.id,
    label: client.name,
  }));
  
  const partnerOptions = safeClients
    .filter(client => client.group === 1) 
    .map(partner => ({
      value: partner.id,
      label: partner.name,
    }));

 
  const selectedClientId = watch('order_client'); 

  useEffect(() => {
    if (selectedClientId) {
      if (!safeClients.length) return;
      const client = safeClients.find(c => String(c.id) === String(selectedClientId));
      
      if (client) {
        setSelectedClientInfo(client);
        setValue('order_main_client', client.full_name || client.name || '', { shouldDirty: true });
        setValue('client_company', client.name || '', { shouldDirty: true });
        setValue('share_percent', client.percent, { shouldDirty: true });
        setValue('currency_type', client.currency, { shouldDirty: true });
      }
    } else {
      setSelectedClientInfo(null); 
      setValue('order_main_client', '');
      setValue('client_company', '');
      setValue('share_percent', '');
      setValue('currency_type', null);
    }
  }, [selectedClientId, clientsData, setValue]);
  
  const handleConfirmDelete = () => {
        if (!performerToDelete) return; 

        
        executorService.deleteExecutor(performerToDelete.id);

        
        const currentPerformers = getValues('performers') || [];
        const updatedPerformers = currentPerformers.filter(p => p.id !== performerToDelete.id);
        setValue('performers', updatedPerformers, { shouldDirty: true });

        
        setPerformerToDelete(null);
    };
 
  const clientInfo = {
    country: selectedClientInfo?.country || '—',
    
    category: selectedClientInfo?.tags[0]?.name || '—',
    source: selectedClientInfo?.source || '—',
    referer: selectedClientInfo?.referrer_name || '—',
    refererFirst: selectedClientInfo?.referrer_first_name || '—',
    manager: 'Дядя Exzibit',
    isFirstOrder: false 
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        performerDropdownRef.current &&
        !performerDropdownRef.current.contains(event.target) &&
        performerInputRef.current &&
        !performerInputRef.current.contains(event.target)
      ) {
        setShowPerformerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className='tab-content-container'>
      
      <div className="tab-content-row">
        <Controller
          name="order_client"
          control={control}
          render={({ field: { ref, ...rest } }) => (
            <CustomSelect
              {...rest}
              label="Клиент"
              options={allClientsOptions}
              isClearable={true}
            />
          )}
        />
      </div>

       <div className="tab-content-row">
        <div className="tab-content-title">Основной клиент</div>
        <Controller
          name="order_main_client"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              readOnly
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Компания</div>
        <Controller
          name="client_company"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              readOnly
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Добавить участника</div>
        <Controller
          name="third_parties"
          control={control}
          render={({ field: { onChange, value } }) => { 
              
              const selectedParties = Array.isArray(value) ? value : [];

              const availableOptions = allClientsOptions.filter(
                  (opt) =>
                      !selectedParties.some(p => p.value === opt.value) && 
                      opt.label.toLowerCase().includes(customThirdParty.toLowerCase())
              );

              const handleSelect = (option) => {
                  if (option && !selectedParties.some(p => p.value === option.value)) {
                      onChange([...selectedParties, option]); 
                      setCustomThirdParty('');
                      setShowThirdPartyDropdown(false);
                  }
              };
              
              const handleRemove = (optionToRemove) => {
                  onChange(selectedParties.filter((p) => p.value !== optionToRemove.value)); 
              };

              return (
                  <div className="tags-section"> 
                      <div className="tag-input-container" ref={thirdPartyInputRef}>
                          <input
                              type="text"
                              placeholder="Найти или добавить..."
                              className="input-tag"
                              value={customThirdParty}
                              onChange={(e) => {
                                  setCustomThirdParty(e.target.value);
                                  setShowThirdPartyDropdown(true);
                              }}
                              onFocus={() => setShowThirdPartyDropdown(true)}
                              autoComplete="off"
                          />
                          {showThirdPartyDropdown && availableOptions.length > 0 && (
                              <div className="tag-dropdown" ref={thirdPartyDropdownRef}>
                                  {availableOptions.map((opt) => (
                                      <div
                                          key={opt.value}
                                          className="tag-dropdown-item"
                                          onClick={() => handleSelect(opt)}
                                      >
                                          {opt.label}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="tag-chips-container">
                          {selectedParties.map((party, index) => (
                              <span
                                  key={index}
                                  className="tag-chips tag-order-chips"
                                  onClick={() => handleRemove(party)}
                              >
                                  {party.label}
                              </span>
                          ))}
                      </div>
                  </div>
              );
          }}
      />
      </div>

      
      <div className="tab-content-row">
        <div className="tab-content-title">Страна</div>
        <span className='modal-content-span-info'>{clientInfo.country}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Категория</div>
        <span className='modal-content-span-info'>{clientInfo.category}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Источник</div>
        <span className='modal-content-span-info'>{clientInfo.source}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Реферер</div>
        <span className='modal-content-span-info'>{clientInfo.referer}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Реферер первый</div>
        <span className='modal-content-span-info'>{clientInfo.refererFirst}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Менеджер</div>
        <span className='modal-content-span-info'>{clientInfo.manager}</span>
      </div>
      <div className="tab-content-row">
        <div className="tab-content-title">Первый заказ?</div>
        <span className='modal-content-span-info'>{clientInfo.isFirstOrder ? "Да" : "Нет"}</span>
      </div>


      <div className="tab-content-row">
        <Controller
          name="partner_name"
          control={control}
          render={({ field: { ref, ...rest } }) => (
            <CustomSelect
              {...rest}
              label="Партнер"
              options={partnerOptions}
              isClearable={true}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Отключить долю партнера</div>
        <Controller
          name="partner_disable_share"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value || false}
              onChange={e => field.onChange(e.target.checked)}
              {...field} 
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Партнер оплата</div>
        <Controller
          name="partner_payment"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              placeholder="..."
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Партнер план</div>
        <Controller
          name="partner_plan"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              placeholder="..."
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Партнер % план</div>
        <Controller
          name="partner_percent_plan"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              placeholder="..."
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Партнер сумма план</div>
        <Controller
          name="partner_sum_plan"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              placeholder="..."
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Партнер недоплата</div>
        <Controller
          name="partner_underpayment"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              placeholder="..."
              className='tab-content-input modal-content-span-info'
              {...field}
            />
          )}
        />
      </div>
      
           <div className="performers-section">

              
              <div className="tab-content-row">
                  <div className="tab-content-title">Список исполнителей</div>
                  <button
                      type="button"
                      className="add-performer-button"
                      onClick={onOpenAddExecutorModal}
                  >
                      + Добавить исполнителя
                  </button>
              </div>

              
              <Controller
                  name="performers"
                  control={control}
                  render={({ field: { onChange, value: selectedPerformers = [] } }) => {
                      const handleRemovePerformer = (performerIdToRemove) => {
                          onChange(selectedPerformers.filter(p => p.id !== performerIdToRemove));
                      };

                      return (
                          <div className="performer-cards-container">
                              {selectedPerformers.map(performer => (
                                  <PerformerCard
                                      key={performer.id}
                                      performer={performer}
                                      onRemove={() => setPerformerToDelete(performer)} 
                                  />
                              ))}
                          </div>
                      );
                  }}
              />
          </div>
     
            {isExecutorModalOpen && (
                <AddExecutorModal
                    onAdd={handleAddExecutor} 
                    onClose={() => setIsExecutorModalOpen(false)} 
                    employees={employeesData} 
                />
            )}
            {performerToDelete && (
                <ConfirmationModal
                    title="Удалить исполнителя"
                    message={`Вы уверены, что хотите удалить исполнителя "${performerToDelete.fullName}" из заказа? Это действие также полностью удалит запись о его работе в этом заказе из системы.`}
                    confirmText="Да, удалить"
                    cancelText="Отмена"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setPerformerToDelete(null)}
                />
            )}
    </div>
  );
};

export default Participants;
