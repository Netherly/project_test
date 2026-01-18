import React, { useState, useEffect, useRef } from "react";
import "./TasksPage.css";
import Sidebar from "../Sidebar.jsx";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon.jsx";
import TaskModal from "./TaskModal.jsx";
import TaskViewModal from "./TaskViewModal.jsx";

function TasksPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Дефолтные размеры колонок
    const defaultColumnWidths = {
        1: 50,  // Checkbox
        2: 80,  // №
        3: 60,  // LVL
        4: 130, // Дата выполнения
        5: 130, // Время выполнения
        6: 150, // От кого/Кому
        7: 120, // Клиент
        8: 100, // № заказа
        9: 200, // Описание
        10: 200, // Задача
        11: 130, // Срок сдачи
        12: 100  // Статус
    };

    // Состояние для ресайза колонок
    const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);

    const tableRef = useRef(null);

    useEffect(() => {
        const storedTasks = localStorage.getItem("tasks");
        if (storedTasks) {
            try {
                setTasks(JSON.parse(storedTasks));
            } catch (e) {
                console.error("Ошибка парсинга tasks из localStorage", e);
            }
        }

        const storedWidths = localStorage.getItem("columnWidths");
        if (storedWidths) {
            try {
                setColumnWidths(JSON.parse(storedWidths));
            } catch (e) {
                console.error("Ошибка парсинга columnWidths из localStorage", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    }, [columnWidths]);

    // Улучшенная функция для resize колонок с пропорциональным сжатием
    const createColumnResizer = (columnIndex) => {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startWidth = columnWidths[columnIndex];

            const tableContainer = tableRef.current?.parentElement;
            if (!tableContainer) return;

            const containerWidth = tableContainer.clientWidth;
            const minColumnWidth = 40;

            const visibleColumns = Object.keys(columnWidths).filter(key => {
                const colIndex = parseInt(key);
                return deleteMode || colIndex !== 1;
            }).map(key => parseInt(key));

            const handleMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newWidth = Math.max(minColumnWidth, startWidth + deltaX);

                const currentTotalWidth = visibleColumns.reduce((sum, colIndex) => {
                    return sum + (colIndex === columnIndex ? newWidth : columnWidths[colIndex]);
                }, 0);

                if (currentTotalWidth <= containerWidth) {
                    setColumnWidths(prev => ({
                        ...prev,
                        [columnIndex]: newWidth
                    }));
                    return;
                }

                const otherColumns = visibleColumns.filter(colIndex => colIndex !== columnIndex);
                const totalOtherWidths = otherColumns.reduce((sum, colIndex) => sum + columnWidths[colIndex], 0);

                const availableWidthForOthers = containerWidth - newWidth;

                const minWidthForOthers = otherColumns.length * minColumnWidth;

                if (availableWidthForOthers < minWidthForOthers) {
                    const maxPossibleWidth = containerWidth - minWidthForOthers;
                    const finalWidth = Math.max(minColumnWidth, Math.min(newWidth, maxPossibleWidth));

                    const finalAvailableWidth = containerWidth - finalWidth;

                    const newColumnWidths = { ...columnWidths, [columnIndex]: finalWidth };
                    otherColumns.forEach(colIndex => {
                        newColumnWidths[colIndex] = minColumnWidth;
                    });

                    setColumnWidths(newColumnWidths);
                } else {
                    const compressionRatio = availableWidthForOthers / totalOtherWidths;

                    const newColumnWidths = { ...columnWidths, [columnIndex]: newWidth };

                    otherColumns.forEach(colIndex => {
                        const originalWidth = columnWidths[colIndex];
                        const compressedWidth = Math.max(minColumnWidth, originalWidth * compressionRatio);
                        newColumnWidths[colIndex] = compressedWidth;
                    });

                    const finalTotalWidth = Object.values(newColumnWidths).reduce((sum, width) => sum + width, 0);

                    if (finalTotalWidth > containerWidth) {
                        const scaleFactor = containerWidth / finalTotalWidth;
                        Object.keys(newColumnWidths).forEach(colIndex => {
                            newColumnWidths[colIndex] = Math.max(minColumnWidth, newColumnWidths[colIndex] * scaleFactor);
                        });
                    }

                    setColumnWidths(newColumnWidths);
                }
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.classList.remove('resizing-columns');
            };

            document.body.classList.add('resizing-columns');
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveTask = (taskData) => {
        const newTask = {
            id: Date.now(),
            level: 1,
            executionDate: taskData.executionDate || "-",
            executionTime: taskData.executionTime || "-",
            fromTo: taskData.executor || "-",
            orderNumber: taskData.orderNumber || "-",
            client: taskData.client || "-",
            description: taskData.description || "-",
            task: taskData.task || "-",
            deadline: taskData.deadline || "-",
            status:
                taskData.status === "completed"
                    ? "Завершено"
                    : taskData.status === "cancelled"
                        ? "Отменено"
                        : "В процессе",
            impression: "",
        };

        setTasks((prevTasks) => [...prevTasks, newTask]);
        setIsModalOpen(false);
    };

    const handleTaskClick = (task) => {
        if (deleteMode) {
            const isCurrentlySelected = selectedTaskIds.has(task.id);
            handleTaskSelect(task.id, !isCurrentlySelected);
            return;
        }
        setSelectedTask(task);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedTask(null);
    };

    const handleSaveTaskChanges = (updatedTask) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    };

    const handleToggleDeleteMode = () => {
        const newDeleteMode = !deleteMode;
        setDeleteMode(newDeleteMode);
        setSelectedTaskIds(new Set());

        if (newDeleteMode) {
            setColumnWidths(defaultColumnWidths);
        }
    };

    const handleTaskSelect = (taskId, isSelected) => {
        const newSelectedIds = new Set(selectedTaskIds);
        if (isSelected) {
            newSelectedIds.add(taskId);
        } else {
            newSelectedIds.delete(taskId);
        }
        setSelectedTaskIds(newSelectedIds);
    };

    const handleSelectAll = () => {
        if (selectedTaskIds.size === tasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(tasks.map(task => task.id)));
        }
    };

    const handleDeleteSelected = () => {
        if (selectedTaskIds.size > 0) {
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        setTasks(prevTasks => prevTasks.filter(task => !selectedTaskIds.has(task.id)));
        setSelectedTaskIds(new Set());
        setDeleteMode(false);
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const cancelDeleteMode = () => {
        setDeleteMode(false);
        setSelectedTaskIds(new Set());
    };

    const getColumnStyle = (columnIndex) => ({
        width: `${columnWidths[columnIndex]}px`,
        minWidth: `${columnWidths[columnIndex]}px`,
        maxWidth: `${columnWidths[columnIndex]}px`
    });

    // Компонент для ресайзера колонок
    const ColumnResizer = ({ columnIndex }) => (
        <div
            className="column-resizer"
            onMouseDown={createColumnResizer(columnIndex)}
        />
    );

    // Заголовки колонок
    const columnHeaders = [
        { id: 1, label: "", isCheckbox: true },
        { id: 2, label: "№" },
        { id: 3, label: "LVL" },
        { id: 4, label: "Дата выполнения" },
        { id: 5, label: "Время выполнения" },
        { id: 6, label: "От кого? / Кому?" },
        { id: 7, label: "Клиент" },
        { id: 8, label: "№ заказа" },
        { id: 9, label: "Описание" },
        { id: 10, label: "Задача" },
        { id: 11, label: "Срок сдачи" },
        { id: 12, label: "Статус" }
    ];

    return (
        <div className="tasks-page">
            <Sidebar />
            <div className="tasks-page-main-container">
                <header className="tasks-header-container">
                    <h1 className="tasks-title">
                        <PageHeaderIcon pageName="Задачи" />
                        ЗАДАЧИ
                    </h1>
                    <div className="tasks-header-right">
                        <div className="header-separator"></div>
                        <div className="tasks-header-buttons">
                            {!deleteMode ? (
                                <button className="header-button delete-tasks-button" onClick={handleToggleDeleteMode}>
                                    УДАЛИТЬ
                                </button>
                            ) : (
                                <>
                                    <button className="header-button cancel-delete-button" onClick={cancelDeleteMode}>
                                        ОТМЕНА
                                    </button>
                                    <button className="header-button select-all-button" onClick={handleSelectAll}>
                                        {selectedTaskIds.size === tasks.length ? 'СНЯТЬ ВЫБОР' : 'ВЫБРАТЬ ВСЕ'}
                                    </button>
                                    <button className="header-button confirm-delete-button" onClick={handleDeleteSelected} disabled={selectedTaskIds.size === 0}>
                                        УДАЛИТЬ ({selectedTaskIds.size})
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="header-separator"></div>
                        <div className="tasks-header-buttons">
                            {!deleteMode && (
                                <button className="header-button add-task-button" onClick={handleOpenModal}>
                                    ДОБАВИТЬ
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="tasks-content">
                    <div className="tasks-table-container">
                        <table className="tasks-table resizable-table" ref={tableRef}>
                            <thead>
                                <tr>
                                    {columnHeaders.map(header => {
                                        if (header.isCheckbox && !deleteMode) return null;

                                        return (
                                            <th key={header.id} className="resizable-th" style={getColumnStyle(header.id)}>
                                                {header.isCheckbox ? (
                                                    <input
                                                        type="checkbox"
                                                        className="select-all-checkbox"
                                                        checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                ) : (
                                                    header.label
                                                )}
                                                <ColumnResizer columnIndex={header.id} />
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={deleteMode ? "12" : "11"}
                                            style={{
                                                textAlign: "center",
                                                padding: "20px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Нет задач. Добавьте первую задачу!
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className={`task-row ${deleteMode ? 'delete-mode' : ''} ${selectedTaskIds.has(task.id) ? 'selected' : ''}`}
                                        >
                                            {deleteMode && (
                                                <td style={getColumnStyle(1)}>
                                                    <input
                                                        type="checkbox"
                                                        className="task-checkbox"
                                                        checked={selectedTaskIds.has(task.id)}
                                                        onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
                                                    />
                                                </td>
                                            )}
                                            <td style={getColumnStyle(2)}>
                                                <span className="task-priority-indicator"></span>
                                                {task.id}
                                            </td>
                                            <td style={getColumnStyle(3)}>{task.level}</td>
                                            <td style={getColumnStyle(4)}>{task.executionDate}</td>
                                            <td style={getColumnStyle(5)}>{task.executionTime}</td>
                                            <td style={getColumnStyle(6)}>{task.fromTo}</td>
                                            <td style={getColumnStyle(7)}>{task.client}</td>
                                            <td style={getColumnStyle(8)}>{task.orderNumber}</td>
                                            <td style={getColumnStyle(9)} className="text-cell">
                                                <div className="text-content">
                                                    {task.description}
                                                </div>
                                            </td>
                                            <td style={getColumnStyle(10)} className="text-cell">
                                                <div className="text-content">
                                                    {task.task}
                                                </div>
                                            </td>
                                            <td style={getColumnStyle(11)}>{task.deadline}</td>
                                            <td style={getColumnStyle(12)}>
                                                <span
                                                    className={`status-indicator ${task.status === "Завершено"
                                                        ? "status-completed"
                                                        : task.status === "Отменено"
                                                            ? "status-cancelled"
                                                            : task.status === "В ожидании"
                                                                ? "status-pending"
                                                                : "status-in-progress"
                                                        }`}
                                                >
                                                    {task.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="delete-modal-overlay">
                        <div className="delete-modal">
                            <div className="delete-modal-header">
                                <h3>Подтверждение удаления</h3>
                            </div>
                            <div className="delete-modal-content">
                                <p>Вы уверены, что хотите удалить {selectedTaskIds.size} задач(и)?</p>
                                <p className="delete-warning">Это действие нельзя отменить.</p>
                            </div>
                            <div className="delete-modal-buttons">
                                <button className="delete-modal-cancel" onClick={cancelDelete}>
                                    Отмена
                                </button>
                                <button className="delete-modal-confirm" onClick={confirmDelete}>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <TaskModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveTask}
                />

                <TaskViewModal
                    isOpen={isViewModalOpen}
                    onClose={handleCloseViewModal}
                    task={selectedTask}
                    onSave={handleSaveTaskChanges}
                />
            </div>
        </div>
    );
}

export default TasksPage;