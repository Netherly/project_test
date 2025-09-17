import React, { useState, useRef, useEffect } from 'react';
import { Controller, useFieldArray, useWatch, useFormContext } from 'react-hook-form';

const WorkPlan = ({ control }) => {
  // Получаем доступ к методам формы
  const { getValues, setValue } = useFormContext();
  
  // Хук для работы с массивом workList
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'workList',
  });

  // Подписка на поля формы
  const techTags = useWatch({ control, name: 'techTags' }) || [];
  const taskTags = useWatch({ control, name: 'taskTags' }) || [];
  const techSpecifications = useWatch({ control, name: 'techSpecifications' }) || '';

  const [customTechTag, setCustomTechTag] = useState('');
  const [customTaskTag, setCustomTaskTag] = useState('');
  const [showTechTagDropdown, setShowTechTagDropdown] = useState(false);
  const [showTaskTagDropdown, setShowTaskTagDropdown] = useState(false);

  const techTagInputRef = useRef(null);
  const techTagDropdownRef = useRef(null);
  const taskTagInputRef = useRef(null);
  const taskTagDropdownRef = useRef(null);

  const defaultTechTags = ["React", "Node.js", "JavaScript", "Python", "Vue", "TypeScript", "MongoDB", "PostgreSQL"];
  const defaultTaskTags = ["Разработка", "Тестирование", "Дизайн", "Реализация", "Аналитика", "Документация"];
  const descriptionOptions = ["Описание 1", "Описание 2", "Описание 3"];

  // Обработчик клика вне dropdown, чтобы закрывать их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (techTagDropdownRef.current && !techTagDropdownRef.current.contains(event.target) &&
          techTagInputRef.current && !techTagInputRef.current.contains(event.target)) {
        setShowTechTagDropdown(false);
      }
      if (taskTagDropdownRef.current && !taskTagDropdownRef.current.contains(event.target) &&
          taskTagInputRef.current && !taskTagInputRef.current.contains(event.target)) {
        setShowTaskTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация тегов для dropdown по вводимому тексту
  const filteredTechTags = defaultTechTags.filter(tag =>
    !techTags.includes(tag) && tag.toLowerCase().includes(customTechTag.toLowerCase())
  );

  const filteredTaskTags = defaultTaskTags.filter(tag =>
    !taskTags.includes(tag) && tag.toLowerCase().includes(customTaskTag.toLowerCase())
  );

  // Обработчик Enter в textarea ТЗ (добавление всего из workList в textarea)
  const handleAddTechSpecToTextarea = (e, field) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    // Получаем актуальные значения из workList
    const workListValues = getValues('workList') || [];
    // Формируем строки из актуальных specification
    const techSpecs = workListValues.map(row => row.specification || '').join('\n');
    const currentValue = getValues('techSpecifications') || '';
    const newValue = currentValue + (currentValue ? '\n' : '') + techSpecs;
    setValue('techSpecifications', newValue, { shouldDirty: true });
    field.onChange(newValue);
  }
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    const currentValue = getValues('techSpecifications') || '';
    const newValue = currentValue + '\n';
    setValue('techSpecifications', newValue, { shouldDirty: true });
    field.onChange(newValue);
  }
};


  // Автоматический ресайз textarea
  const handleTextareaAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Добавление новой строки работы
  const handleAddWorkRow = () => {
    append({ description: '', amount: '', specification: '', sale: false });
  };

  // Копирование строки работы в буфер
  const handleCopyWorkRow = (index) => {
    const row = fields[index];
    const textToCopy = `Описание: ${row.description}, Сумма: ${row.amount}, ТЗ: ${row.specification}, Продажа: ${row.sale ? "Да" : "Нет"}`;
    navigator.clipboard.writeText(textToCopy).then(() => alert("Данные скопированы в буфер обмена!"));
  };

  return (
    <div className="tab-content-container">

      {/* Описание заказа (textarea) */}
      <div className="tab-content-row">
        <div className="tab-content-title">Описание заказа</div>
        <Controller
          name="orderDescription"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className="workplan-textarea"
              onInput={(e) => {
                field.onChange(e);
                handleTextareaAutoResize(e);
              }}
              onChange={(e) => {
                field.onChange(e);
                handleTextareaAutoResize(e);
              }}
            />
          )}
        />
      </div>

      {/* Технологии (теги) */}
      <div className="tab-content-row">
        <div className="tab-content-title">Технологии</div>
        <Controller
          name="techTags"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="tags-section">
              <div className="tag-input-container" ref={techTagInputRef}>
                <input
                  type="text"
                  placeholder="Добавить тег технологии"
                  className="input-tag"
                  value={customTechTag}
                  onChange={e => {
                    setCustomTechTag(e.target.value);
                    setShowTechTagDropdown(true);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customTechTag.trim()) {
                      e.preventDefault();
                      if (!value.includes(customTechTag.trim())) {
                        onChange([...value, customTechTag.trim()]);
                        setCustomTechTag('');
                        setShowTechTagDropdown(false);
                      }
                    }
                  }}
                  onFocus={() => setShowTechTagDropdown(true)}
                  autoComplete="off"
                />
                {showTechTagDropdown && (filteredTechTags.length > 0 || customTechTag.trim()) && (
                  <div className="tag-dropdown" ref={techTagDropdownRef}>
                    {filteredTechTags.map(tag => (
                      <div 
                        key={tag} 
                        className="tag-dropdown-item" 
                        onClick={() => {
                          if (!value.includes(tag)) {
                            onChange([...value, tag]);
                            setCustomTechTag('');
                            setShowTechTagDropdown(false);
                          }
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                    {customTechTag.trim() && !defaultTechTags.includes(customTechTag) && !value.includes(customTechTag) && (
                      <div 
                        className="tag-dropdown-item tag-dropdown-custom" 
                        onClick={() => {
                          onChange([...value, customTechTag.trim()]);
                          setCustomTechTag('');
                          setShowTechTagDropdown(false);
                        }}
                      >
                        Добавить: "{customTechTag}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="tag-chips-container">
                {value.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="tag-chips tag-order-chips" 
                    onClick={() => onChange(value.filter(t => t !== tag))}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      {/* Тип задач (теги) */}
      <div className="tab-content-row">
        <div className="tab-content-title">Тип задач</div>
        <Controller
          name="taskTags"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="tags-section">
              <div className="tag-input-container" ref={taskTagInputRef}>
                <input
                  type="text"
                  placeholder="Добавить тег задачи"
                  className="input-tag"
                  value={customTaskTag}
                  onChange={e => {
                    setCustomTaskTag(e.target.value);
                    setShowTaskTagDropdown(true);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customTaskTag.trim()) {
                      e.preventDefault();
                      if (!value.includes(customTaskTag.trim())) {
                        onChange([...value, customTaskTag.trim()]);
                        setCustomTaskTag('');
                        setShowTaskTagDropdown(false);
                      }
                    }
                  }}
                  onFocus={() => setShowTaskTagDropdown(true)}
                  autoComplete="off"
                />
                {showTaskTagDropdown && (filteredTaskTags.length > 0 || customTaskTag.trim()) && (
                  <div className="tag-dropdown" ref={taskTagDropdownRef}>
                    {filteredTaskTags.map(tag => (
                      <div 
                        key={tag} 
                        className="tag-dropdown-item" 
                        onClick={() => {
                          if (!value.includes(tag)) {
                            onChange([...value, tag]);
                            setCustomTaskTag('');
                            setShowTaskTagDropdown(false);
                          }
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                    {customTaskTag.trim() && !defaultTaskTags.includes(customTaskTag) && !value.includes(customTaskTag) && (
                      <div 
                        className="tag-dropdown-item tag-dropdown-custom" 
                        onClick={() => {
                          onChange([...value, customTaskTag.trim()]);
                          setCustomTaskTag('');
                          setShowTaskTagDropdown(false);
                        }}
                      >
                        Добавить: "{customTaskTag}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="tag-chips-container">
                {value.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="tag-chips tag-order-chips" 
                    onClick={() => onChange(value.filter(t => t !== tag))}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      {/* Список работ (таблица) */}
      <div className="tab-content-table">
        <div className="tab-content-title">Список работ</div>
        <table className="workplan-table">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Сумма</th>
              <th>ТЗ</th>
              <th>Продажа?</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((row, index) => (
              <tr key={row.id}>
                <td>
                  <Controller
                    control={control}
                    name={`workList.${index}.description`}
                    render={({ field }) => (
                      <>
                        <input
                          {...field}
                          type="text"
                          placeholder="Введите описание"
                          list="description-options"
                          className="input-text"
                        />
                        <datalist id="description-options">
                          {descriptionOptions.map((opt, idx) => (
                            <option key={idx} value={opt} />
                          ))}
                        </datalist>
                      </>
                    )}
                  />
                </td>
                <td>
                  <Controller
                    control={control}
                    name={`workList.${index}.amount`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="..."
                        className="input-number"
                      />
                    )}
                  />
                </td>
                <td>
                  <Controller
                    control={control}
                    name={`workList.${index}.specification`}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="Введите ТЗ"
                        onInput={handleTextareaAutoResize}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTextareaAutoResize(e);
                        }}
                        className="input-textarea"
                      />
                    )}
                  />
                </td>
                <td>
                  <Controller
                    control={control}
                    name={`workList.${index}.sale`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="checkbox"
                        checked={field.value || false}
                        onChange={e => field.onChange(e.target.checked)}
                        className="workplan-checkbox"
                      />
                    )}
                  />
                </td>
                <td>
                  <div className="table-btn-section">
                    <button type="button" onClick={() => handleCopyWorkRow(index)}>📑</button>
                    <button type="button" onClick={() => remove(index)}>❌</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="add-work-row">
          <button type="button" onClick={handleAddWorkRow}>➕</button>
        </div>
      </div>

      {/* ТЗ (textarea) */}
      <div className="tab-content-row">
        <div className="tab-content-title">ТЗ</div>
        <Controller
          name="techSpecifications"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className="workplan-textarea"
              onChange={(e) => {
                field.onChange(e);
                handleTextareaAutoResize(e);
              }}
              onKeyDown={(e) => handleAddTechSpecToTextarea(e, field)}
              onInput={handleTextareaAutoResize}
            />
          )}
        />
      </div>
    </div>
  );
};

export default WorkPlan;