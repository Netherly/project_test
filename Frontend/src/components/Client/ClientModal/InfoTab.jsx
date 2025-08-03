import React, { useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import TagSelector from '../TagSelector';
import TextareaWithCounter from '../TextareaWithCounter';
import './InfoTab.css';

export default function InfoTab({
  companies = [],
  categoriesInit = [],
  sourcesInit = [],
  onAddCompany
}) {
  const [categories, setCategories] = useState(categoriesInit);
  const [sources, setSources] = useState(sourcesInit);
  const {
    control,
    formState: { errors },
    watch
  } = useFormContext();

  const addOption = (setter, label) => {
    const val = prompt(`Новое значение для "${label}"`);
    if (val && val.trim()) setter(prev => [...prev, val.trim()]);
  };

  // Для подсветки ошибок при превышении лимита можно следить за значениями
  const introVal = watch('intro_description') || '';
  const noteVal  = watch('note') || '';

  return (
    <div className="tab-section info-tab">
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <TagSelector
            tags={Array.isArray(field.value) ? field.value : []}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Клиент<span className="req">*</span></label>
            <input
              {...field}
              placeholder="Клиент"
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Категория<span className="req">*</span></label>
            <div className="select-plus">
              <select
                {...field}
                className={errors.category ? 'input-error' : ''}
              >
                <option value="">-- выбрать --</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addOption(setCategories, 'Категория')}
              >+</button>
            </div>
            {errors.category && <p className="error">{errors.category.message}</p>}
          </div>
        )}
      />

      <Controller
        name="source"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Источник<span className="req">*</span></label>
            <div className="select-plus">
              <select
                {...field}
                className={errors.source ? 'input-error' : ''}
              >
                <option value="">-- выбрать --</option>
                {sources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addOption(setSources, 'Источник')}
              >+</button>
            </div>
            {errors.source && <p className="error">{errors.source.message}</p>}
          </div>
        )}
      />

      <Controller
        name="intro_description"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>Вводное описание<span className="req">*</span></label>
            <TextareaWithCounter
              value={field.value || ''}
              onChange={field.onChange}
              maxLength={500}
              placeholder="Вводное описание"
              className={errors.intro_description ? 'input-error' : ''}
              warningThreshold={0.8}
            />
            {errors.intro_description && (
              <p className="error">{errors.intro_description.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>Примечание<span className="req">*</span></label>
            <TextareaWithCounter
              value={field.value || ''}
              onChange={field.onChange}
              maxLength={300}
              placeholder="Примечание"
              className={errors.note ? 'input-error' : ''}
              warningThreshold={0.8}
            />
            {errors.note && (
              <p className="error">{errors.note.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="company_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Компания<span className="req">*</span></label>
            <div className="select-plus">
              <select
                {...field}
                className={errors.company_id ? 'input-error' : ''}
              >
                <option value="">-- выбрать --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAddCompany}
              >+</button>
            </div>
            {errors.company_id && (
              <p className="error">{errors.company_id.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="messenger_name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Имя в мессенджере</label>
            <input
              {...field}
              placeholder="Имя в мессенджере"
            />
          </div>
        )}
      />
    </div>
  );
}
