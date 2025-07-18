import React, { useState } from 'react';
import './AddAssetForm.css'; 

const AddAssetForm = ({ onAdd, onClose }) => {
    const [formData, setFormData] = useState({
        id: '', 
        accountName: '', 
        currency: 'UAH', 
        type: 'Наличные', 
        employee: '', 
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData); 
    };

    return (
        <div className="add-asset-overlay">
            <div className="add-asset-modal">
                <div className="add-asset-header">
                    <h2>Добавить счет</h2>
                    <div className="add-asset-actions">
                        <span className="icon" onClick={onClose}>✖️</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="add-asset-form">
                    <div className="form-group">
                        <label htmlFor="id">Айди счета</label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            placeholder="Введите айди счета"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="accountName">Наименование счета</label>
                        <input
                            type="text"
                            id="accountName"
                            name="accountName"
                            value={formData.accountName}
                            onChange={handleChange}
                            placeholder="Например, ПриватБанк - Ключ к счету"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="currency">Валюта счета</label>
                        <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            required
                        >
                            <option value="UAH">UAH</option>
                            <option value="RUB">RUB</option>
                            <option value="USD">USD</option>
                            <option value="USDT">USDT</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">Тип</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            <option value="Наличные">Наличные</option>
                            <option value="Безналичные">Безналичные</option>
                            <option value="Криптовалюта">Криптовалюта</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="employee">Сотрудник</label>
                        <input
                            type="text"
                            id="employee"
                            name="employee"
                            value={formData.employee}
                            onChange={handleChange}
                            placeholder="Выберите сотрудника"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>Отменить</button>
                        <button type="submit" className="save-button">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAssetForm;