import React from 'react';
import { Controller } from 'react-hook-form';
import CustomSelect from '../../ui/CustomSelect';

const Participants = ({ control }) => {
  const orderClient = [
    { value: "1", label: "Лев" },
    { value: "2", label: "Лев Андреевич" },
    { value: "3", label: "Босс Лев" },
    { value: "4", label: "Шеф Андреевич" },
  ];

  const orderMainClient = [
    { value: "1", label: "Лев" },
    { value: "2", label: "Лев Андреевич" },
    { value: "3", label: "Босс Лев" },
    { value: "4", label: "Шеф Андреевич" },
  ];

  const clientCompany = [
    { value: "1", label: "GSSE" },
    { value: "2", label: "Говно, ведь это не GSSE" },
    { value: "3", label: "Нет ничего лучше GSSE" },
    { value: "4", label: "Точно нет ничего лучше GSSE" },
  ];

  const partnerName = [
    { value: "1", label: "Толик" },
    { value: "2", label: "Лев" },
    { value: "3", label: "Вова" },
    { value: "4", label: "Павлентий" },
  ];

  const clientInfo = {
    country: "Украина",
    category: "Алкаш",
    source: "Друг посоветовал",
    referer: "Дядя Толя",
    refererFirst: "Дядя Толя",
    manager: "Дядя Exzibit",
    isFirstOrder: false
  };

  return (
    <div className='tab-content-container'>

      <div className="tab-content-row">
        <Controller
          name="order_client"
          control={control}
          render={({ field }) => (
            <CustomSelect
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
              label="Клиент"
              options={orderClient}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <h3>Третьи участники</h3>
      </div>

      <div className="tab-content-row">
        <Controller
          name="order_main_client"
          control={control}
          render={({ field }) => (
            <CustomSelect
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
              label="Основной клиент"
              options={orderMainClient}
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <Controller
          name="client_company"
          control={control}
          render={({ field }) => (
            <CustomSelect
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
              label="Компания"
              options={clientCompany}
            />
          )}
        />
      </div>

      {/* Статичные данные */}
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
        <h3>🤝 Партнер</h3>
      </div>

      <div className="tab-content-row">
        <Controller
          name="partner_name"
          control={control}
          render={({ field }) => (
            <CustomSelect
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
              label="Партнер"
              options={partnerName}
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

    </div>
  );
};

export default Participants;
