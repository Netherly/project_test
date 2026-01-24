import React, { useState } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import "./Requisites.css";

const Requisites = ({ control }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'requisites',
    });

    const [editingRows, setEditingRows] = useState({});

    const handleAddRequisiteRow = () => {
        append({ currency: '', bank: '', account: '' });
    };

    const toggleEdit = (index) => {
        setEditingRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const isEditing = (index) => editingRows[index] || false;

    return (
        <div className="requisites-content-table">
            <table className="requisites-table">
                <thead>
                    <tr>
                        <th>Валюта</th>
                        <th>Банк</th>
                        <th>Счет</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((row, index) => (
                        <tr key={row.id}>
                            <td>
                                <Controller
                                    control={control}
                                    name={`requisites.${index}.currency`}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="requisites-select"
                                            disabled={!isEditing(index)}
                                        >
                                            <option value="">Выберите валюту</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="UAH">UAH</option>
                                            <option value="RUB">RUB</option>
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
                                            type="text-bank"
                                            placeholder="Название банка"
                                            className="requisites-input"
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
                                            type="text-card"
                                            placeholder="Номер счета/карты"
                                            className="requisites-input"
                                            disabled={!isEditing(index)}
                                        />
                                    )}
                                />
                            </td>
                            <td>
                                <div className="table-btn-section">
                                    <button
                                        type="button"
                                        onClick={() => toggleEdit(index)}
                                        title={isEditing(index) ? "Сохранить изменения" : "Редактировать"}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        title="Удалить строку"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="requisites-add-row">
                <button type="button" onClick={handleAddRequisiteRow}>Добавить поле ➕</button>
            </div>
        </div>
    );
};

export default Requisites;