import React, { useState, useCallback } from "react";
import "./FixesPage.css";
import Sidebar from "../Sidebar.jsx";
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon.jsx';
import { Plus, Download, ChevronUp, ChevronDown } from 'lucide-react';
import FixesModal from './FixesModal/FixesModal';

function Fixes() {
    const [fixes, setFixes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFix, setSelectedFix] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleOpenModal = useCallback((fix = null) => {
        setSelectedFix(fix);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedFix(null);
    }, []);

    const handleSaveFix = useCallback((fixData) => {
        if (selectedFix) {
            setFixes(prev => prev.map(fix =>
                fix.id === selectedFix.id ? { ...fix, ...fixData } : fix
            ));
        } else {
            const newFix = {
                id: fixes.length > 0 ? Math.max(...fixes.map(f => f.id)) + 1 : 1,
                ...fixData
            };
            setFixes(prev => [newFix, ...prev]); // Добавляем в начало
        }
        handleCloseModal();
    }, [selectedFix, fixes, handleCloseModal]);

    const handleDeleteFix = useCallback((fixId) => {
        setFixes(prev => prev.filter(fix => fix.id !== fixId));
        handleCloseModal();
    }, [handleCloseModal]);

    const handleRowClick = useCallback((fix) => {
        handleOpenModal(fix);
    }, [handleOpenModal]);

    const handleSort = useCallback((key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const getSortedFixes = useCallback(() => {
        if (!sortConfig.key) return fixes;

        const sorted = [...fixes].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Обработка для даты
            if (sortConfig.key === 'date') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            // Обработка для строк
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [fixes, sortConfig]);

    const sortedFixes = getSortedFixes();

    const renderSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return null;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp size={16} className="fixes-sort-icon" />
        ) : (
            <ChevronDown size={16} className="fixes-sort-icon" />
        );
    };

    return (
        <div className="fixes-page">
            <Sidebar />
            <div className="fixes-page-main-container">
                <header className="fixes-header-container">
                    <h1 className="fixes-title">
                        <PageHeaderIcon pageName="Настройки" />
                        Фиксы
                    </h1>
                    <div className="fixes-header-buttons">
                        <button className="fixes-button" onClick={() => handleOpenModal()}>
                            <Plus size={20} />Добавить
                        </button>
                    </div>
                </header>

                <div className="fixes-table-container">
                    <table className="fixes-table">
                        <thead>
                            <tr>
                                <th
                                    className="fixes-sortable-header"
                                    onClick={() => handleSort('date')}
                                >
                                    <span>Дата</span>
                                    {renderSortIcon('date')}
                                </th>
                                <th
                                    className="fixes-sortable-header"
                                    onClick={() => handleSort('reporter')}
                                >
                                    <span>Кто</span>
                                    {renderSortIcon('reporter')}
                                </th>
                                <th>Описание</th>
                                <th>Медиа</th>
                                <th
                                    className="fixes-sortable-header"
                                    onClick={() => handleSort('status')}
                                >
                                    <span>Статус</span>
                                    {renderSortIcon('status')}
                                </th>
                                <th>Кому</th>
                                <th
                                    className="fixes-sortable-header"
                                    onClick={() => handleSort('type')}
                                >
                                    <span>Тип</span>
                                    {renderSortIcon('type')}
                                </th>
                                <th>Исправил</th>
                                <th>Дата исправления</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFixes.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-color)' }}>
                                        Нет записей. Нажмите "Добавить" для создания новой записи.
                                    </td>
                                </tr>
                            ) : (
                                sortedFixes.map((fix) => (
                                    <tr
                                        key={fix.id}
                                        className="fixes-row"
                                        onClick={() => handleRowClick(fix)}
                                    >
                                        <td>{fix.date}</td>
                                        <td>{fix.reporter}</td>
                                        <td><span>{fix.description}</span></td>
                                        <td>
                                            {fix.media ? (
                                                <button
                                                    className="fixes-media-download-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        alert('Загрузка файла с сервера: ' + fix.media);
                                                    }}
                                                    title="Скачать файл"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            ) : (
                                                <span className="fixes-no-media">Нет</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`fixes-status fixes-status-${fix.status === 'Исправлено' ? 'fixed' : 'inprogress'}`}>
                                                {fix.status}
                                            </span>
                                        </td>
                                        <td>{fix.assignedTo}</td>
                                        <td>
                                            <span className={`fixes-type fixes-type-${fix.type === 'Фронтенд' ? 'frontend' : 'backend'}`}>
                                                {fix.type}
                                            </span>
                                        </td>
                                        <td>{fix.fixedBy || '—'}</td>
                                        <td>{fix.fixDate || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <FixesModal
                        fix={selectedFix}
                        onClose={handleCloseModal}
                        onSave={handleSaveFix}
                        onDelete={handleDeleteFix}
                    />
                )}
            </div>
        </div>
    );
}

export default Fixes;