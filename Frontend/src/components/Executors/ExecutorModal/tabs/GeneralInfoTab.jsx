import React, { useEffect, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

const OrderDetailField = ({ label, value }) => (
  <div className="form-field read-only-field">
    <label>{label}</label>
    {label.includes('Описание') || label.includes('ТЗ') ? (
       <textarea onInput={(e) => {
                field.onChange(e);
                handleTextareaAutoResize(e);
              }}
              onChange={(e) => {
                field.onChange(e);
                handleTextareaAutoResize(e);
              }} value={value || 'Нет данных'} readOnly rows={3}></textarea>
    ) : (
      <div className="read-only-value">{value || 'Нет данных'}</div>
    )}
  </div>
);

export default function GeneralInfoTab({ orders, fields }) {
  const { control, formState: { errors } } = useFormContext();


   const handleTextareaAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const watchedOrderId = useWatch({
    control,
    name: 'orderNumber',
  });

  
  const [selectedOrder, setSelectedOrder] = useState(null);

  
  useEffect(() => {
    if (watchedOrderId) {
      
      const foundOrder = orders.find(order => order.id === Number(watchedOrderId));
      setSelectedOrder(foundOrder || null);
    } else {
      setSelectedOrder(null); 
    }
  }, [watchedOrderId, orders]); 

  return (
    <div className="general-tab-section">
      
      <Controller
        name="orderNumber"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Номер заказа</label>
            <select {...field} className={errors.orderNumber ? 'input-error' : ''}>
              <option value="">Выберите заказ</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>Заказ №{order.id}</option>
              ))}
            </select>
            {errors.orderNumber && <p className="error-message">{errors.orderNumber.message}</p>}
          </div>
        )}
      />

      {selectedOrder && (
        <div className="executor-order-details-block">
          <OrderDetailField label="Статус заказа" value={selectedOrder.stage} />
          <OrderDetailField label="Клиент" value={selectedOrder.order_main_client} />
          <OrderDetailField label="Описание заказа" value={selectedOrder.orderDescription} />
          <OrderDetailField label="ТЗ заказа" value={selectedOrder.techSpecifications} />
        </div>
      )}

      {/* --- Исполнитель --- */}
      <Controller
        name="performer"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Исполнитель</label>
            <select {...field} className={errors.performer ? 'input-error' : ''}>
              <option value="" disabled>Выберите сотрудника</option>
              {fields?.employees?.map((employee) => (
                <option key={employee.id} value={employee.fullName}>{employee.fullName}</option>
              ))}
            </select>
            {errors.performer && <p className="error-message">{errors.performer.message}</p>}
          </div>
        )}
      />

      {/* --- Роль в заказе --- */}
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Роль</label>
            <select {...field} className={errors.role ? 'input-error' : ''}>
              <option value="" disabled>Выберите роль</option>
              {fields?.role?.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            {errors.role && <p className="error-message">{errors.role.message}</p>}
          </div>
        )}
      />

      {/* --- Дата для исполнителя --- */}
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
            {/* --- Валюта --- */}
            <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                    <div className="form-field">
                        <label>Валюта</label>
                        <select {...field} className={errors.currency ? 'input-error' : ''}>
                            <option value="" disabled>Выберите валюту</option>
                            
                      
                            {fields?.currency?.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option> 
                        
                            ))}

                        </select>
                        {errors.currency && <p className="error-message">{errors.currency.message}</p>}
                    </div>
                )}
            />
      
            {/* --- Ставка в час --- */}
            <Controller
              name="hourlyRate"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Ставка в час</label>
                  <input type="number" placeholder="0.00" {...field} />
                  {errors.hourlyRate && <p className="error-message">{errors.hourlyRate.message}</p>}
                </div>
              )}
            />
      
            {/* --- Сумма ввод --- */}
            <Controller
              name="amountInput"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Сумма ввод</label>
                  <input type="number" placeholder="0.00" {...field} />
                   {errors.amountInput && <p className="error-message">{errors.amountInput.message}</p>}
                </div>
              )}
            />
      
            {/* --- Сумма макс --- */}
            <Controller
              name="maxAmount"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <label>Сумма макс</label>
                  <input type="number" placeholder="0.00" {...field} />
                  {errors.maxAmount && <p className="error-message">{errors.maxAmount.message}</p>}
                </div>
              )}
            />
            {/* --- Чекбоксы --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
      </div>
    </div>
  );
}