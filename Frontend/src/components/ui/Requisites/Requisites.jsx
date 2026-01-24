import React, { useState, useCallback, useRef } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { Plus } from 'lucide-react';
import './Requisites.css';

const CURRENCIES = [
    { value: '', label: 'Валюта' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'UAH', label: 'UAH' },
    { value: 'RUB', label: 'RUB' },
];

const Requisites = ({ control }) => {
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'requisites',
    });

    const [editingRows, setEditingRows] = useState({});
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleAdd = useCallback(() => {
        append({ currency: '', bank: '', account: '' });
        setEditingRows(prev => ({ ...prev, [fields.length]: true }));
    }, [append, fields.length]);

    const toggleEdit = useCallback((index) => {
        setEditingRows(prev => ({ ...prev, [index]: !prev[index] }));
    }, []);

    const isEditing = useCallback((index) => editingRows[index] || false, [editingRows]);

    const handleRemove = useCallback((index) => {
        remove(index);
        setEditingRows(prev => {
            const { [index]: removed, ...rest } = prev;
            return rest;
        });
    }, [remove]);

    const allowDrop = (e) => e.preventDefault();

    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e, index) => {
        dragOverItem.current = index;
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over');

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragged = dragItem.current;
        const dropped = dragOverItem.current;
        if (dragged === null || dropped === null || dragged === dropped) return;
        move(dragged, dropped);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="requisites">
            <div className="requisites-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Валюта</th>
                            <th>Банк</th>
                            <th>Счет</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.length > 0 ? (
                            fields.map((row, index) => (
                                <tr
                                    key={row.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDragEnd={handleDragEnd}
                                    onDrop={handleDrop}
                                    onDragOver={allowDrop}
                                    className={`requisite-row ${isEditing(index) ? 'editing' : ''}`}
                                >
                                    <td>
                                        <Controller
                                            control={control}
                                            name={`requisites.${index}.currency`}
                                            render={({ field }) => (
                                                <select {...field} disabled={!isEditing(index)}>
                                                    {CURRENCIES.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            control={control}
                                            name={`requisites.${index}.bank`}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Название банка"
                                                    disabled={!isEditing(index)}
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            control={control}
                                            name={`requisites.${index}.account`}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Номер счета"
                                                    disabled={!isEditing(index)}
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                type="button"
                                                className="btn-edit"
                                                onClick={() => toggleEdit(index)}
                                                title={isEditing(index) ? 'Сохранить' : 'Редактировать'}
                                            >
                                                {isEditing(index) ? '✓' : '✏️'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() => handleRemove(index)}
                                                title="Удалить"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr className="empty">
                                <td colSpan="5">Нет данных. Добавьте новую строку.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <button type="button" className="btn-add" onClick={handleAdd}>
                <Plus size={20} />
                <span>Добавить</span>
            </button>
        </div>
    );
};

export default Requisites;