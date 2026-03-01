import React, { useMemo, useCallback, useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import './RequisitesTab.css';
import { X, Plus, GripVertical, Move, Check } from 'lucide-react';
import CreatableSelect from "../../Client/ClientModal/CreatableSelect"; 

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

const SortableRequisiteRow = ({ 
  item, 
  index, 
  control, 
  fieldArrayName, 
  currencyOptions, 
  onAddNewField, 
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
          name={`${fieldArrayName}.${index}.currency`}
          control={control}
          defaultValue={item.currency ?? currencyOptions[0] ?? 'UAH'}
          render={({ field }) => (
            <CreatableSelect
              value={field.value}
              onChange={field.onChange}
              options={currencyOptions}
              placeholder="Валюта"
              onAdd={(val) => {
                 if (onAddNewField) onAddNewField("generalFields", "currency", val);
              }}
            />
          )}
        />
      </div>

      <div className="requisites-cell">
        <Controller
          name={`${fieldArrayName}.${index}.bank`}
          control={control}
          defaultValue={item.bank ?? ''}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Банк"
              className="assets-workplan-textarea"
              onInput={handleTextareaAutoResize}
              rows={1}
            />
          )}
        />
      </div>

      <div className="requisites-cell">
        <Controller
          name={`${fieldArrayName}.${index}.card`}
          control={control}
          defaultValue={item.card ?? ''}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Номер карты"
              className="assets-workplan-textarea"
              onInput={handleTextareaAutoResize}
              rows={1}
            />
          )}
        />
      </div>

      <div className="requisites-cell">
        <Controller
          name={`${fieldArrayName}.${index}.owner`}
          control={control}
          defaultValue={item.owner ?? ''}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Владелец"
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
          title="Удалить реквизит"
        >
          <X size={18} color="red" />
        </button>
      </div>
    </div>
  );
};

export default function RequisitesTab({ fieldsData, onAddNewField }) {
  const { control } = useFormContext();
  const fieldArrayName = 'requisitesList';
  const [isSortMode, setIsSortMode] = useState(false);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: fieldArrayName,
  });

  const currencyOptions = useMemo(() => {
    const rawCurrencies = fieldsData?.generalFields?.currency || [];
    return rawCurrencies.filter(i => !i.isDeleted).map(i => i.value);
  }, [fieldsData]);

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
    <div className="tab-section requisites-tab-wrapper">
      <div className="employee-requisites-table">
        <div className="requisites-row header-row">
          
          <div className={`requisites-cell drag-cell ${isSortMode ? 'visible' : ''}`}></div>
          
          <div className="header-content-wrapper">
            <div className="requisites-cell">Валюта</div>
            <div className="requisites-cell">Банк</div>
            <div className="requisites-cell">Номер карты</div>
            <div className="requisites-cell">Владелец</div>
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
              <SortableRequisiteRow
                key={item.id}
                item={item}
                index={index}
                control={control}
                fieldArrayName={fieldArrayName}
                currencyOptions={currencyOptions}
                onAddNewField={onAddNewField} 
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
          append({
            currency: currencyOptions[0] ?? 'UAH',
            bank: '',
            card: '',
            owner: '',
          })
        }
      >
        <Plus size={16} /> Добавить
      </button>
    </div>
  );
}