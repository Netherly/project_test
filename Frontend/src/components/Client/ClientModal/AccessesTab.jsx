import React, { useState, useCallback } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { X, Plus, GripVertical, Move, Check } from 'lucide-react';
import './AccessesTab.css';


import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const SortableAccessRow = ({ 
  item, 
  index, 
  control, 
  fieldArrayName, 
  handleTextareaAutoResize, 
  remove,
  isSortMode 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: !isSortMode 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`requisites-row ${isDragging ? 'dragging' : ''}`}
    >
      
      <div className={`requisites-cell drag-cell ${isSortMode ? 'visible' : ''}`} {...attributes} {...listeners}>
        <GripVertical size={18} className="drag-icon" />
      </div>

      
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
  );
};


export default function AccessesTab() {
  const { control } = useFormContext();
  const fieldArrayName = 'accesses';
  const [isSortMode, setIsSortMode] = useState(false);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: fieldArrayName,
  });

  const handleTextareaAutoResize = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  return (
    <div className="tab-section accesses-tab-wrapper">
      <div className="employee-requisites-table"> 
        
        <div className="requisites-row header-row">
          <div className={`requisites-cell drag-cell ${isSortMode ? 'visible' : ''}`}></div>

          <div className="header-content-wrapper"> 
            <div className="requisites-cell">Название</div>
            <div className="requisites-cell">Логин</div>
            <div className="requisites-cell">Пароль</div>
            <div className="requisites-cell">Описание</div>
          </div>
          
          
          <div className="requisites-cell action-cell header-action">
            {fields.length > 1 && (
              <button 
                type="button" 
                className={`icon-sort-btn ${isSortMode ? 'active' : ''}`}
                onClick={() => setIsSortMode(!isSortMode)}
                title={isSortMode ? "Завершить сортировку" : "Сортировать"}
              >
                {isSortMode ? <Check size={16} /> : <Move size={16} />}
              </button>
            )}
          </div>
        </div>

        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields} strategy={verticalListSortingStrategy}>
            {fields.map((item, index) => (
              <SortableAccessRow
                key={item.id}
                item={item}
                index={index}
                control={control}
                fieldArrayName={fieldArrayName}
                handleTextareaAutoResize={handleTextareaAutoResize}
                remove={remove}
                isSortMode={isSortMode}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      
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