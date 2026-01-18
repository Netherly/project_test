import React from 'react';
import { useForm } from 'react-hook-form';
import './AddCompanyForm.css';

export default function AddCompanyModal({ onCreate, onCancel }) {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = data => {
    onCreate(data); // ожидаем возвращение { id, name, site, address }
    reset();
  };

  return (
    <div className="company-modal-overlay">
      <div className="company-modal">
        <h2>Создать компанию</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-section">
            <label>Название</label>
            <input
              {...register('name', { required: true })}
              placeholder="Название компании"
            />
          </div>
          <div className="form-section">
            <label>Сайт</label>
            <input {...register('site')} placeholder="Сайт компании" />
          </div>
          <div className="form-section">
            <label>Адрес</label>
            <input {...register('address')} placeholder="Адрес компании" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel}>Отмена</button>
            <button type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  );
}
