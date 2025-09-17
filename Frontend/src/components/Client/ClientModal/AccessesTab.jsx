import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import './AccessesTab.css';

export default function AccessesTab() {
  const { register, control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name: 'accesses', control });

  const [editIndex, setEditIndex] = useState(null);
  const [modalText, setModalText] = useState('');

  const openDescriptionModal = (idx) => {
    const currentValue = getValues(`accesses.${idx}.description`) || '';
    setEditIndex(idx);
    setModalText(currentValue);
  };

  const handleInputChange = (e, idx) => {
    const value = e.target.value;
    setValue(`accesses.${idx}.description`, value);
    if (value.length > 100 && editIndex === null) {
      setModalText(value);
      setEditIndex(idx);
    }
  };

  const saveDescription = () => {
    setValue(`accesses.${editIndex}.description`, modalText);
    setEditIndex(null);
  };

  return (
    <div className="tab-section accesses-tab-list">
      <div className="accesses-header">
        <span>Название</span>
        <span>Логин</span>
        <span>Пароль</span>
        <span>Описание</span>
        <span>Действия</span>
      </div>

      {fields.map((field, idx) => (
        <div key={field.id} className="access-line">
          <input
            {...register(`accesses.${idx}.name`)}
            defaultValue={field.name}
            placeholder="Название"
          />
          <input
            {...register(`accesses.${idx}.login`)}
            defaultValue={field.login}
            placeholder="Логин"
          />
          <input
            {...register(`accesses.${idx}.password`)}
            defaultValue={field.password}
            placeholder="Пароль"
          />
          <input
            type="text"
            className="input-like"
            placeholder="Описание"
            value={getValues(`accesses.${idx}.description`) || ''}
            onClick={() => openDescriptionModal(idx)}
            onChange={(e) => handleInputChange(e, idx)}
            readOnly
          />
          <button
            type="button"
            className="remove-btn"
            onClick={() => remove(idx)}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        className="add-btn"
        onClick={() =>
          append({ name: '', login: '', password: '', description: '' })
        }
      >
        + Добавить строку
      </button>

      {editIndex !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Редактировать описание</h3>
            <textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              rows={10}
              placeholder="Дополнительные инструкции, ссылки, особенности входа…"
            />
            <div className="modal-actions">
              <button onClick={saveDescription}>Сохранить</button>
              <button onClick={() => setEditIndex(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
