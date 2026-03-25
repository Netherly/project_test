import React, { useEffect, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import AutoResizeTextarea from '../../../modals/OrderModal/AutoResizeTextarea';
import CreatableSelect from "../../../Client/ClientModal/CreatableSelect"; 
import { Minus, Plus } from 'lucide-react';

const OrderDetailField = ({ label, value }) => (
  <div className="form-field read-only-field">
    <label>{label}</label>
    {label.includes('Описание') || label.includes('ТЗ') ? (
       <AutoResizeTextarea 
          value={value || ''} 
          readOnly={true} 
          placeholder="Нет данных"
          className="read-only-textarea"
       />
    ) : (
      <div className="read-only-value">{value || 'Нет данных'}</div>
    )}
  </div>
);

export default function GeneralInfoTab({ orders, fields, employees, roleOptions, currencyOptions, onAddNewField }) {
  const { control, setValue, formState: { errors } } = useFormContext();

  const watchedOrderId = useWatch({
    control,
    name: 'orderId',
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (watchedOrderId) {
      const foundOrder = orders.find(order => String(order.id) === String(watchedOrderId));
      setSelectedOrder(foundOrder || null);
    } else {
      setSelectedOrder(null);
    }
  }, [watchedOrderId, orders]);

  useEffect(() => {
    if (!selectedOrder) return;
    const label = selectedOrder.orderSequence ?? selectedOrder.numberOrder ?? selectedOrder.id;
    setValue('orderNumber', String(label), { shouldDirty: false });
  }, [selectedOrder, setValue]);

  const fallbackRoles = fields?.role?.map(r => r.value || r) || [];
  const fallbackCurrencies = fields?.currency?.map(c => c.value || c) || [];

  return (
    <div className="general-tab-section">

      {selectedOrder && (
        <div className="executor-order-details-block">
          <OrderDetailField label="Статус заказа" value={selectedOrder.stage} />
          <OrderDetailField label="Клиент" value={selectedOrder.clientName || selectedOrder.orderMainClient || selectedOrder.name} />
          <OrderDetailField label="Описание заказа" value={selectedOrder.orderDescription} />
          <OrderDetailField label="ТЗ заказа" value={selectedOrder.techSpecifications} />
        </div>
      )}

      <Controller
        name="orderId"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Номер заказа</label>
            <select
              {...field}
              value={field.value || ""}
              onChange={(e) => field.onChange(String(e.target.value))}
              className={errors.orderId ? 'input-error' : ''}
            >
              <option value="" disabled hidden>Не выбрано</option>
              {(orders || []).map((order) => {
                const label = order.orderSequence ?? order.numberOrder ?? order.id;
                return (
                  <option key={order.id} value={String(order.id)}>
                    Заказ №{label}
                  </option>
                );
              })}
            </select>
            {errors.orderId && <p className="error-message">{errors.orderId.message}</p>}
          </div>
        )}
      />

      <Controller
        name="performer"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Исполнитель</label>
            <select {...field} className={errors.performer ? 'input-error' : ''}>
              <option value="" disabled hidden>Не выбрано</option>
              {(employees || fields?.employees || []).map((employee) => (
                <option key={employee.id} value={employee.fullName || employee.full_name}>{employee.fullName || employee.full_name}</option>
              ))}
            </select>
            {errors.performer && <p className="error-message">{errors.performer.message}</p>}
          </div>
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Роль</label>
            <CreatableSelect
              value={field.value || ""}
              onChange={field.onChange}
              options={roleOptions || fallbackRoles}
              placeholder="Выберите или введите роль..."
              error={!!errors.role}
              onAdd={(val) => onAddNewField && onAddNewField("executorFields", "role", val)}
            />
            {errors.role && <p className="error-message">{errors.role.message}</p>}
          </div>
        )}
      />

      <Controller
        name="dateForPerformer"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Дата для исполнителя</label>
            <input type="date" {...field} />
          </div>
        )}
      />

      <Controller
          name="currency"
          control={control}
          render={({ field }) => (
              <div className="form-field">
                  <label>Валюта</label>
                  <CreatableSelect
                    value={field.value || ""}
                    onChange={field.onChange}
                    options={currencyOptions || fallbackCurrencies}
                    placeholder="Выберите или введите валюту..."
                    error={!!errors.currency}
                    onAdd={(val) => onAddNewField && onAddNewField("generalFields", "currency", val)}
                  />
                  {errors.currency && <p className="error-message">{errors.currency.message}</p>}
              </div>
          )}
      />

      <Controller
        name="hourlyRate"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="form-field">
              <label>Ставка в час</label>
              <div className="custom-number-input">
                <input 
                  type="number" 
                  {...restField} 
                  value={value || ''} 
                  onChange={onChange} 
                  min={min} 
                  placeholder="0.00" 
                  className={errors.hourlyRate ? 'input-error' : ''} 
                />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
              {errors.hourlyRate && <p className="error-message">{errors.hourlyRate.message}</p>}
            </div>
          );
        }}
      />

      <Controller
        name="amountInput"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="form-field">
              <label>Сумма ввод</label>
              <div className="custom-number-input">
                <input 
                  type="number" 
                  {...restField} 
                  value={value || ''} 
                  onChange={onChange} 
                  min={min} 
                  placeholder="0.00" 
                  className={errors.amountInput ? 'input-error' : ''} 
                />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
               {errors.amountInput && <p className="error-message">{errors.amountInput.message}</p>}
            </div>
          );
        }}
      />

      <Controller
        name="minAmount"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="form-field">
              <label>Минимальная сумма</label>
              <div className="custom-number-input">
                <input 
                  type="number" 
                  {...restField} 
                  value={value || ''} 
                  onChange={onChange} 
                  min={min} 
                  placeholder="0.00" 
                  className={errors.minAmount ? 'input-error' : ''} 
                />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
              {errors.minAmount && <p className="error-message">{errors.minAmount.message}</p>}
            </div>
          );
        }}
      />

      <Controller
        name="maxAmount"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="form-field">
              <label>Сумма макс</label>
              <div className="custom-number-input">
                <input 
                  type="number" 
                  {...restField} 
                  value={value || ''} 
                  onChange={onChange} 
                  min={min} 
                  placeholder="0.00" 
                  className={errors.maxAmount ? 'input-error' : ''} 
                />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
              {errors.maxAmount && <p className="error-message">{errors.maxAmount.message}</p>}
            </div>
          );
        }}
      />

      <div className="checkbox-container-modal" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Controller
            name="hideClient"
            control={control}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <label htmlFor="hideClient">Скрыть клиента</label>
                <input type="checkbox" id="hideClient" {...field} checked={field.value} />
              </div>
            )}
          />

          <Controller
            name="roundHours"
            control={control}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <label htmlFor="roundHours">Округление часа</label>
                <input type="checkbox" id="roundHours" {...field} checked={field.value} />
              </div>
            )}
          />

          <Controller
            name="isReset"
            control={control}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <label htmlFor="isReset">Обнуление</label>
                <input type="checkbox" id="isReset" {...field} checked={field.value} />
              </div>
            )}
          />
      </div>
    </div>
  );
}