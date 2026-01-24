import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import './FixesModal.css';
import ConfirmationModal from '../../../../../src/components/modals/confirm/ConfirmationModal';

function FixesModal({ fix, onClose, onSave, onDelete }) {
    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        date: getCurrentDateTime(),
        reporter: '',
        description: '',
        media: '',
        status: 'В работе',
        assignedTo: '',
        type: 'Фронтенд',
        fixedBy: '',
        fixDate: ''
    });

    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const textareaRef = useRef(null);

    // Состояние для меню удаления
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Состояния для отслеживания изменений
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    // редактируем ли существующий фикс
    const isEditMode = !!fix;

    useEffect(() => {
        if (fix) {
            setFormData(fix);
            if (fix.media) {
                setUploadedFile({ name: fix.media, isExisting: true });
            }
        }
    }, [fix]);

    // Автоматическая подстройка высоты textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [formData.description]);

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Закрытие меню по Escape
    const handleEsc = useCallback((event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [handleEsc]);

    const handleDeleteClick = () => {
        if (fix && fix.id) {
            onDelete(fix.id);
        }
        setMenuOpen(false);
    };

    const handleFileUpload = (e) => {
        // Блокируем загрузку файлов в режиме редактирования
        if (isEditMode) {
            e.preventDefault();
            return;
        }

        const file = e.target.files[0];
        setUploadError('');

        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        const isZip = fileExtension === 'zip';

        if (!isImage && !isZip) {
            setUploadError('Разрешены только изображения (JPG, PNG, GIF, WEBP) и ZIP файлы');
            e.target.value = '';
            return;
        }

        const maxSize = isImage ? 5 * 1024 * 1024 : 500 * 1024 * 1024;
        if (file.size > maxSize) {
            const maxSizeText = isImage ? '5 МБ' : '500 МБ';
            setUploadError(`Размер файла превышает ${maxSizeText}`);
            e.target.value = '';
            return;
        }

        setUploadedFile(file);
        setFormData(prev => ({
            ...prev,
            media: file.name
        }));
        setHasUnsavedChanges(true);
    };

    const handleRemoveFile = () => {
        // Блокируем удаление файлов в режиме редактирования
        if (isEditMode) {
            return;
        }

        setUploadedFile(null);
        setUploadError('');
        setFormData(prev => ({
            ...prev,
            media: ''
        }));
        const fileInput = document.getElementById('media');
        if (fileInput) fileInput.value = '';
        setHasUnsavedChanges(true);
    };

    const handleDownloadFile = () => {
        if (!uploadedFile) return;

        if (uploadedFile.isExisting) {
            alert('Загрузка файла с сервера: ' + uploadedFile.name);
            return;
        }

        const url = URL.createObjectURL(uploadedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = uploadedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setHasUnsavedChanges(false);
    };

    // Обработчики для модалки подтверждения
    const handleConfirmClose = () => {
        setShowConfirmationModal(false);
        onClose();
    };

    const handleCancelClose = () => {
        setShowConfirmationModal(false);
    };

    const handleOverlayClick = () => {
        if (hasUnsavedChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };

    const handleCloseButtonClick = () => {
        if (hasUnsavedChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };

    const handleCancelButtonClick = () => {
        if (hasUnsavedChanges) {
            setShowConfirmationModal(true);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixes-modal-overlay" onClick={handleOverlayClick}>
            <div className="fixes-modal-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="fixes-modal-header">
                    <h2>{fix ? 'Редактировать фикс' : 'Добавить фикс'}</h2>
                    <div className="fixes-modal-actions">
                        {/* Меню удаления с 3 точками */}
                        {isEditMode && (
                            <div ref={menuRef} className="fixes-modal-delete-menu">
                                <button
                                    className="fixes-modal-menu-btn"
                                    type="button"
                                    onClick={() => setMenuOpen(o => !o)}
                                    aria-label="Открыть меню"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                    </svg>
                                </button>

                                <ul className={`fixes-modal-dropdown ${menuOpen ? 'fixes-modal-dropdown-show' : ''}`}>
                                    <li onClick={handleDeleteClick}>
                                        <Trash2 size={14} /> Удалить фикс
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* Кнопка закрытия */}
                        <span className="fixes-modal-icon" onClick={handleCloseButtonClick}>
                            <X size={24} />
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="fixes-modal-form custom-scrollbar">
                    <div className="fixes-modal-form-row">
                        <label htmlFor="date" className="fixes-modal-form-label">
                            Дата и время
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="fixes-modal-form-input"
                            disabled={isEditMode}
                        />
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="reporter" className="fixes-modal-form-label">
                            Кто сообщил
                        </label>
                        <input
                            type="text"
                            id="reporter"
                            name="reporter"
                            value={formData.reporter}
                            onChange={handleChange}
                            placeholder="Имя сотрудника"
                            required
                            className="fixes-modal-form-input"
                            disabled={isEditMode}
                        />
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="description" className="fixes-modal-form-label">
                            Описание
                        </label>
                        <textarea
                            ref={textareaRef}
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Подробное описание проблемы"
                            required
                            className="fixes-modal-form-textarea"
                            disabled={isEditMode}
                        />
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="media" className="fixes-modal-form-label">
                            Медиа файл
                        </label>
                        <div className="fixes-modal-file-upload-container">
                            {!isEditMode && (
                                <>
                                    <input
                                        type="file"
                                        id="media"
                                        name="media"
                                        onChange={handleFileUpload}
                                        accept=".jpg,.jpeg,.png,.gif,.webp,.zip"
                                        className="fixes-modal-file-input-hidden"
                                    />
                                    <div className="fixes-modal-upload-row">
                                        <label htmlFor="media" className="fixes-modal-file-upload-btn">
                                            Выбрать файл
                                        </label>
                                        <span className="fixes-modal-file-upload-hint">
                                            Фото до 5 МБ, ZIP до 500 МБ
                                        </span>
                                    </div>

                                </>
                            )}

                            {isEditMode && !uploadedFile && (
                                <span className="fixes-modal-file-upload-hint">
                                    Файл не загружен
                                </span>
                            )}

                            {uploadedFile && (

                                <div className="fixes-modal-uploaded-file-info">
                                    <span className="fixes-modal-file-name">{uploadedFile.name}</span>

                                    <div className="fixes-modal-file-actions">
                                        <button
                                            type="button"
                                            onClick={handleDownloadFile}
                                            className="fixes-modal-download-file-btn"
                                            title="Скачать файл"
                                        >
                                            <Download size={16} />
                                        </button>

                                        {!uploadedFile.isExisting && uploadedFile.size && (
                                            <span className="fixes-modal-file-size-inline">
                                                {formatFileSize(uploadedFile.size)}
                                            </span>
                                        )}

                                        {!isEditMode && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="fixes-modal-remove-file-btn"
                                                title="Удалить файл"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {uploadError && (
                                <div className="fixes-modal-upload-error">
                                    {uploadError}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="status" className="fixes-modal-form-label">
                            Статус
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="fixes-modal-form-input"
                        >
                            <option value="В работе">В работе</option>
                            <option value="Исправлено">Исправлено</option>
                        </select>
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="assignedTo" className="fixes-modal-form-label">
                            Кому назначено
                        </label>
                        <input
                            type="text"
                            id="assignedTo"
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            placeholder="Имя исполнителя"
                            required
                            className="fixes-modal-form-input"
                        />
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="type" className="fixes-modal-form-label">
                            Тип
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="fixes-modal-form-input"
                        >
                            <option value="Фронтенд">Фронтенд</option>
                            <option value="Бэкенд">Бэкенд</option>
                        </select>
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="fixedBy" className="fixes-modal-form-label">
                            Исправил
                        </label>
                        <input
                            type="text"
                            id="fixedBy"
                            name="fixedBy"
                            value={formData.fixedBy}
                            onChange={handleChange}
                            placeholder="Кто исправил"
                            className="fixes-modal-form-input"
                        />
                    </div>

                    <div className="fixes-modal-form-row">
                        <label htmlFor="fixDate" className="fixes-modal-form-label">
                            Дата исправления
                        </label>
                        <input
                            type="date"
                            id="fixDate"
                            name="fixDate"
                            value={formData.fixDate}
                            onChange={handleChange}
                            className="fixes-modal-form-input"
                        />
                    </div>

                    <div className="fixes-modal-form-actions">
                        <button
                            type="button"
                            className="fixes-modal-cancel-btn"
                            onClick={handleCancelButtonClick}
                        >
                            Отмена
                        </button>
                        <button type="submit" className="fixes-modal-save-btn">
                            {fix ? 'Сохранить' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Модалка подтверждения */}
            {showConfirmationModal && (
                <ConfirmationModal
                    title="Есть несохраненные изменения"
                    message="Вы уверены, что хотите закрыть окно? Все несохраненные данные будут утеряны."
                    onConfirm={handleConfirmClose}
                    onCancel={handleCancelClose}
                    confirmText="Да, закрыть"
                    cancelText="Остаться"
                />
            )}
        </div>
    );
}

export default FixesModal;