import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        executionDate: '',
        executionTime: '',
        executor: '',
        orderNumber: '',
        client: '',
        description: '',
        task: '',
        deadline: '',
        status: ''
    });

    const [initialFormData, setInitialFormData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const executorOptions = ['Web-001', 'Support-404', 'Host-001', 'Dev-245', 'JSDev-008', 'FrontDev-013', 'AndrewKabaliuk', 'Bug-42', 'Kontent-3301', 'Front-007', 'BackendDev-004', 'FrontDev-013(2)', 'HaizhevskaDaria'];

    useEffect(() => {
        const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        setHasChanges(changed);
    }, [formData, initialFormData]);

    useEffect(() => {
        if (isOpen) {
            const initial = {
                executionDate: '',
                executionTime: '',
                executor: '',
                orderNumber: '',
                client: '',
                description: '',
                task: '',
                deadline: '',
                status: ''
            };
            setFormData(initial);
            setInitialFormData(initial);
            setHasChanges(false);
        }
    }, [isOpen]);

    const handleDateKeyDown = (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (allowedKeys.includes(e.key)) {
            return;
        }

        // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }

        if (e.key === '-') {
            return;
        }

        if (e.key >= '0' && e.key <= '9') {
            const currentValue = e.target.value;

            const lastChars = currentValue.slice(-3);
            if (lastChars.length === 3 && lastChars === e.key.repeat(3)) {
                e.preventDefault();
                return;
            }

            if (e.target.dataset.blockedDigit === e.key &&
                Date.now() - parseInt(e.target.dataset.blockTime || '0') < 1000) {
                e.preventDefault();
                return;
            }
        }
    };

    const handleDateInput = (e) => {
        const { name, value } = e.target;

        if (/(\d)\1{4,}/.test(value) || value.includes('111111')) {
            const repeatedDigit = value.match(/(\d)\1{4,}/)?.[1];
            if (repeatedDigit) {
                e.target.dataset.blockedDigit = repeatedDigit;
                e.target.dataset.blockTime = Date.now().toString();
            }

            e.target.value = '';
            setFormData(prev => ({
                ...prev,
                [name]: ''
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusChange = (newStatus) => {
        if (formData.status === newStatus) {
            setFormData(prev => ({ ...prev, status: '' }));
        } else {
            setFormData(prev => ({ ...prev, status: newStatus }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        // Очистка формы
        const clearedData = {
            executionDate: '',
            executionTime: '',
            executor: '',
            orderNumber: '',
            client: '',
            description: '',
            task: '',
            deadline: '',
            status: ''
        };
        setFormData(clearedData);
        setInitialFormData(clearedData);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setHasChanges(false);
    };

    const handleClose = () => {
        onClose();
        // Очистка формы при закрытии
        const clearedData = {
            executionDate: '',
            executionTime: '',
            executor: '',
            orderNumber: '',
            client: '',
            description: '',
            task: '',
            deadline: '',
            status: ''
        };
        setFormData(clearedData);
        setInitialFormData(clearedData);
        setHasChanges(false);
    };

    if (!isOpen) return null;

    return (
        <div className="task-modal-overlay">
            <div className="task-modal-container">
                <div className="task-modal-header">
                    <button className="task-modal-close-btn" onClick={handleClose}>
                        ×
                    </button>
                    <h2 className="task-modal-title">Добавить задачу</h2>
                    {hasChanges && (
                        <div className="task-modal-buttons">
                            <button
                                type="button"
                                className="task-modal-cancel-btn"
                                onClick={handleCancel}
                            >
                                Отменить
                            </button>
                            <button
                                type="submit"
                                className="task-modal-save-btn"
                                onClick={handleSubmit}
                            >
                                Сохранить
                            </button>
                        </div>
                    )}
                </div>

                <form className="task-modal-form" onSubmit={handleSubmit}>
                    <div className="task-modal-form-group">
                        <label htmlFor="executionDate">Дата выполнения (р)</label>
                        <input
                            type="date"
                            id="executionDate"
                            name="executionDate"
                            value={formData.executionDate}
                            onChange={handleInputChange}
                            onKeyDown={handleDateKeyDown}
                            onInput={handleDateInput}
                            className="task-modal-form-input"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="executionTime">Время выполнения</label>
                        <input
                            type="time"
                            id="executionTime"
                            name="executionTime"
                            value={formData.executionTime}
                            onChange={handleInputChange}
                            className="task-modal-form-input"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="executor">
                            Исполнитель <span className="task-modal-required">*</span>
                        </label>
                        <select
                            id="executor"
                            name="executor"
                            value={formData.executor}
                            onChange={handleInputChange}
                            className="task-modal-form-select"
                            required
                        >
                            <option value="">Выберите исполнителя</option>
                            {executorOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="orderNumber">№ заказа</label>
                        <input
                            type="text"
                            id="orderNumber"
                            name="orderNumber"
                            value={formData.orderNumber}
                            onChange={handleInputChange}
                            className="task-modal-form-input"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="client">Клиент (р)</label>
                        <input
                            type="text"
                            id="client"
                            name="client"
                            value={formData.client}
                            onChange={handleInputChange}
                            className="task-modal-form-input"
                            placeholder="?"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="task-modal-form-textarea"
                            rows="3"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="task">
                            Задача <span className="task-modal-required">*</span>
                        </label>
                        <textarea
                            id="task"
                            name="task"
                            value={formData.task}
                            onChange={handleInputChange}
                            className="task-modal-form-textarea"
                            rows="3"
                            required
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label htmlFor="deadline">Срок сдачи</label>
                        <input
                            type="date"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleInputChange}
                            onInput={handleDateInput}
                            className="task-modal-form-input"
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Статус (необязательно)</label>
                        <div className="task-modal-status-buttons">
                            <button
                                type="button"
                                className={`task-modal-status-btn ${formData.status === 'completed' ? 'active completed' : ''}`}
                                onClick={() => handleStatusChange('completed')}
                                title="Завершено"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                className={`task-modal-status-btn ${formData.status === 'cancelled' ? 'active cancelled' : ''}`}
                                onClick={() => handleStatusChange('cancelled')}
                                title="Отменено"
                            >
                                ✗
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;