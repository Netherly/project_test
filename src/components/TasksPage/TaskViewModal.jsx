import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TaskViewModal = ({ isOpen, onClose, task, onSave }) => {
    const [status, setStatus] = useState('');
    const [impression, setImpression] = useState('');
    const [showImpressionField, setShowImpressionField] = useState(false);

    const [initialStatus, setInitialStatus] = useState('');
    const [initialImpression, setInitialImpression] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const changed = status !== initialStatus || impression !== initialImpression;
        setHasChanges(changed);
    }, [status, impression, initialStatus, initialImpression]);

    useEffect(() => {
        if (task) {
            let currentStatus = 'in-progress';
            if (task.status === 'Завершено') {
                currentStatus = 'completed';
                setShowImpressionField(true);
            } else if (task.status === 'В ожидании') {
                currentStatus = 'pending';
                setShowImpressionField(true);
            } else if (task.status === 'Отменено') {
                currentStatus = 'cancelled';
                setShowImpressionField(true);
            } else {
                setShowImpressionField(false);
            }

            const currentImpression = task.impression || '';

            setStatus(currentStatus);
            setImpression(currentImpression);
            setInitialStatus(currentStatus);
            setInitialImpression(currentImpression);
            setHasChanges(false);
        }
    }, [task]);

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'pending') {
            setShowImpressionField(true);
        } else {
            setShowImpressionField(false);
            setImpression('');
        }
    };

    const handleSave = () => {
        const updatedTask = {
            ...task,
            status: status === 'completed' ? 'Завершено' :
                status === 'cancelled' ? 'Отменено' :
                    status === 'pending' ? 'В ожидании' :
                        'В процессе',
            impression: impression
        };
        onSave(updatedTask);

        setInitialStatus(status);
        setInitialImpression(impression);
        setHasChanges(false);

        onClose();
    };

    const handleCancel = () => {
        // Сбрасываем к исходным значениям
        setStatus(initialStatus);
        setImpression(initialImpression);

        if (initialStatus === 'completed' || initialStatus === 'cancelled' || initialStatus === 'pending') {
            setShowImpressionField(true);
        } else {
            setShowImpressionField(false);
        }

        setHasChanges(false);
    };

    const handleClose = () => {
        onClose();
        // Сброс к исходным значениям при закрытии
        if (task) {
            if (task.status === 'Завершено') {
                setStatus('completed');
                setShowImpressionField(true);
            } else if (task.status === 'В ожидании') {
                setStatus('pending');
                setShowImpressionField(true);
            } else if (task.status === 'Отменено') {
                setStatus('cancelled');
                setShowImpressionField(true);
            } else {
                setStatus('in-progress');
                setShowImpressionField(false);
            }
            setImpression(task.impression || '');
        }
        setHasChanges(false);
    };

    if (!isOpen || !task) return null;

    return (
        <div className="task-modal-overlay">
            <div className="task-modal-container">
                <div className="task-modal-header">
                    <button className="task-modal-close-btn" onClick={handleClose}>
                        ×
                    </button>
                    <h2 className="task-modal-title">Просмотр задачи #{task.id}</h2>
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
                                type="button"
                                className="task-modal-save-btn"
                                onClick={handleSave}
                            >
                                Сохранить
                            </button>
                        </div>
                    )}
                </div>

                <div className="task-modal-form">
                    <div className="task-modal-form-group">
                        <label>Дата выполнения</label>
                        <input
                            type="text"
                            value={task.executionDate || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Время выполнения</label>
                        <input
                            type="text"
                            value={task.executionTime || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Исполнитель</label>
                        <input
                            type="text"
                            value={task.fromTo || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>№ заказа</label>
                        <input
                            type="text"
                            value={task.orderNumber || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Клиент</label>
                        <input
                            type="text"
                            value={task.client || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Описание</label>
                        <textarea
                            value={task.description || '-'}
                            className="task-modal-form-textarea"
                            rows="3"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Задача</label>
                        <textarea
                            value={task.task || '-'}
                            className="task-modal-form-textarea"
                            rows="3"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Срок сдачи</label>
                        <input
                            type="text"
                            value={task.deadline || '-'}
                            className="task-modal-form-input"
                            readOnly
                        />
                    </div>

                    <div className="task-modal-form-group">
                        <label>Статус</label>
                        <div className="task-modal-status-buttons">
                            <button
                                type="button"
                                className={`task-modal-status-btn ${status === 'completed' ? 'active completed' : ''}`}
                                onClick={() => handleStatusChange('completed')}
                                title="Завершено"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                className={`task-modal-status-btn ${status === 'cancelled' ? 'active cancelled' : ''}`}
                                onClick={() => handleStatusChange('cancelled')}
                                title="Отменено"
                            >
                                ✗
                            </button>
                            <button
                                type="button"
                                className={`task-modal-status-btn ${status === 'in-progress' ? 'active in-progress' : ''}`}
                                onClick={() => handleStatusChange('in-progress')}
                                title="В процессе"
                            >
                                ⟳
                            </button>
                        </div>
                    </div>

                    {showImpressionField && (
                        <div className="task-modal-form-group">
                            <label htmlFor="impression">Впечатление от задачи</label>
                            <textarea
                                id="impression"
                                value={impression}
                                onChange={(e) => setImpression(e.target.value)}
                                className="task-modal-form-textarea"
                                rows="4"
                                placeholder="Напишите ваше впечатление от выполнения задачи..."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskViewModal;