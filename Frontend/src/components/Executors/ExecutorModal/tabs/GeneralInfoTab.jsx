import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export default function GeneralInfoTab({ orders, fields }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="tab-section">
      {/* --- Номер заказа --- */}
      <Controller
        name="orderNumber"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Номер заказа<span className="req">*</span></label>
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

      {/* --- Исполнитель --- */}
      <Controller
        name="performer"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Исполнитель<span className="req">*</span></label>
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
            <label>Роль в заказе<span className="req">*</span></label>
            <select {...field} className={errors.role ? 'input-error' : ''}>
              <option value="" disabled>Выберите роль</option>
              {fields?.role?.map((role, index) => (
                <option key={index} value={role}>{role}</option>
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

      {/* --- Чекбоксы --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Controller
            name="hideClient"
            control={control}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <input type="checkbox" id="hideClient" {...field} checked={field.value} />
                <label htmlFor="hideClient">Скрыть клиента</label>
              </div>
            )}
          />

          <Controller
            name="roundHours"
            control={control}
            render={({ field }) => (
              <div className="form-field-checkbox">
                <input type="checkbox" id="roundHours" {...field} checked={field.value} />
                <label htmlFor="roundHours">Округление часа</label>
              </div>
            )}
          />
      </div>
    </div>
  );
}