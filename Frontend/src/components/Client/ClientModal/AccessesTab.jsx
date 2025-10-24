import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { X, Plus } from 'lucide-react';

 

import './AccessesTab.css'; 

export default function AccessesTab() {
  const { control } = useFormContext();
  const fieldArrayName = 'accesses';

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldArrayName,
  });

  
  const handleTextareaAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="tab-section accesses-tab-wrapper">
      <div className="employee-requisites-table"> 
        
        
        <div className="requisites-row header-row">
          <div className="requisites-cell">Название</div>
          <div className="requisites-cell">Логин</div>
          <div className="requisites-cell">Пароль</div>
          <div className="requisites-cell">Описание</div>
          <div className="requisites-cell action-cell"></div>
        </div>

        
        {fields.map((item, index) => (
          <div key={item.id} className="requisites-row">
            
            {/* --- Название --- */}
            <div className="requisites-cell">
              <Controller
                name={`${fieldArrayName}[${index}].name`}
                control={control}
                defaultValue={item.name || ''}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Название"
                    className="assets-workplan-textarea" 
                    onInput={handleTextareaAutoResize}
                    rows={1}
                  />
                )}
              />
            </div>

            {/* --- Логин --- */}
            <div className="requisites-cell">
              <Controller
                name={`${fieldArrayName}[${index}].login`}
                control={control}
                defaultValue={item.login || ''}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Логин"
                    className="assets-workplan-textarea"
                    onInput={handleTextareaAutoResize}
                    rows={1}
                  />
                )}
              />
            </div>

            {/* --- Пароль --- */}
            <div className="requisites-cell">
              <Controller
                name={`${fieldArrayName}[${index}].password`}
                control={control}
                defaultValue={item.password || ''}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Пароль"
                    className="assets-workplan-textarea"
                    onInput={handleTextareaAutoResize}
                    rows={1}
                  />
                )}
              />
            </div>

            {/* --- Описание --- */}
            <div className="requisites-cell">
              <Controller
                name={`${fieldArrayName}[${index}].description`}
                control={control}
                defaultValue={item.description || ''}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Описание"
                    className="assets-workplan-textarea"
                    onInput={handleTextareaAutoResize}
                    rows={1}
                  />
                )}
              />
            </div>

            {/* --- Кнопка Удалить --- */}
            <div className="requisites-cell action-cell">
              <button
                type="button"
                className="requisites-remove-btn" 
                onClick={() => remove(index)}
                title="Удалить доступ"
              >
                <X size={18} color='red' />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* === Кнопка Добавить === */}
      <button
        type="button"
        className="add-requisites-btn" 
        onClick={() =>
          append({ name: '', login: '', password: '', description: '' })
        }
      >
        <Plus size={16} /> Добавить
      </button>
    </div>
  );
}