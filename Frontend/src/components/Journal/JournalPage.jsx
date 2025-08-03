import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../../styles/JournalPage.css"; 
import LogEntryDetails from "./LogEntryDetail"; 
import AddLogEntryForm from "./AddLogEntryForm"; 

const JournalPage = () => {
    const orderStatuses = [
        "Лид",
        "Изучаем ТЗ",
        "Обсуждаем с клиентом",
        "Клиент думает",
        "Ожидаем предоплату",
        "Взяли в работу",
        "Ведется разработка",
        "На уточнении у клиента",
        "Тестируем",
        "Тестирует клиент",
        "На доработке",
        "Ожидаем оплату",
        "Успешно завершен",
        "Закрыт",
        "Неудачно завершён",
        "Удаленные"
    ];

    
    const statusToEmojiMap = {
        "Лид": "🎯",
        "Изучаем ТЗ": "📄",
        "Обсуждаем с клиентом": "💬",
        "Клиент думает": "🤔",
        "Ожидаем предоплату": "💳",
        "Взяли в работу": "🚀",
        "Ведется разработка": "💻",
        "На уточнении у клиента": "📝",
        "Тестируем": "🧪",
        "Тестирует клиент": "👀",
        "На доработке": "🔧",
        "Ожидаем оплату": "💸",
        "Успешно завершен": "🏆",
        "Закрыт": "🏁",
        "Неудачно завершён": "❌",
        "Удаленные": "🗑️"
    };

    const initialLogEntries = [
        {
            id: 1,
            description: "'GSSE'. Реализация задач за Исполнителем",
            orderNumber: "2416",
            executorRole: "Frontend Developer",
            workDate: "2 июля 2025 г.",
            startTime: "12:00",
            endTime: "17:51",
            hours: "5:51:00",
            workDone: "Доделан блок с нами работают, сделан адаптив этого блока. Добавил новую категорию и блок на странице портфолио, исправлен вид текста в новом блоке в адаптивe. Выгрузил блок с нами работают на основную страницу и перевел заголовок.",
            email: "alexanderlisyak@gmail.com",
            status: "Ведется разработка" 
        },
        {
            id: 2,
            description: "'CRM GSSE'. Разработка CRM системы",
            orderNumber: "2417",
            executorRole: "Frontend Developer",
            workDate: "1 июля 2025 г.",
            startTime: "-",
            endTime: "-",
            hours: "0:00:00",
            workDone: "Отчет за Июль 2025. Https://...",
            email: "alexanderlisyak@gmail.com",
            status: "Ожидаем предоплату" 
        },
        {
            id: 3,
            description: "'CRM GSSE'. Разработка CRM системы",
            orderNumber: "2417",
            executorRole: "Frontend Developer",
            workDate: "1 июля 2025 г.",
            startTime: "-",
            endTime: "-",
            hours: "0:00:00",
            workDone: "Отчет за Июль 2025. Https://...",
            email: "alexanderlisyak@gmail.com",
            status: "Клиент думает" 
        },
        {
            id: 4,
            description: "'CRM GSSE'. Разработка CRM системы",
            orderNumber: "2417",
            executorRole: "Frontend Developer",
            workDate: "1 июля 2025 г.",
            startTime: "-",
            endTime: "-",
            hours: "0:00:00",
            workDone: "Отчет за Июль 2025. Https://...",
            email: "alexanderlisyak@gmail.com",
            status: "Успешно завершен" 
        },
        {
            id: 5,
            description: "'CRM GSSE'. Разработка CRM системы",
            orderNumber: "2417",
            executorRole: "Frontend Developer",
            workDate: "1 июля 2025 г.",
            startTime: "-",
            endTime: "-",
            hours: "0:00:00",
            workDone: "Отчет за Июль 2025. Https://...",
            email: "alexanderlisyak@gmail.com",
            status: "Лид" 
        },
        {
            id: 6,
            description: "'CRM GSSE'. Разработка CRM системы",
            orderNumber: "2417",
            executorRole: "Frontend Developer",
            workDate: "1 июля 2025 г.",
            startTime: "-",
            endTime: "-",
            hours: "0:00:00",
            workDone: "Отчет за Июль 2025. Https://...",
            email: "alexanderlisyak@gmail.com",
            status: "Изучаем ТЗ" 
        },
    ];

    
    const [allLogEntries, setAllLogEntries] = useState(() => {
        const savedLogEntries = localStorage.getItem('journalEntries');
        return savedLogEntries ? JSON.parse(savedLogEntries) : initialLogEntries;
    });

   
    const [displayedLogEntries, setDisplayedLogEntries] = useState(allLogEntries);

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [searchOrderNumber, setSearchOrderNumber] = useState("");
    const [searchWorkDate, setSearchWorkDate] = useState("");
    const [searchWorkDone, setSearchWorkDone] = useState("");
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

    
    useEffect(() => {
        localStorage.setItem('journalEntries', JSON.stringify(allLogEntries));
        applyFilters(); 
    }, [allLogEntries]);

    
    useEffect(() => {
        applyFilters();
    }, [searchOrderNumber, searchWorkDate, searchWorkDone]);

    const applyFilters = () => {
        let filtered = allLogEntries.filter(entry => {
            const matchesOrderNumber = searchOrderNumber
                ? entry.orderNumber.toLowerCase().includes(searchOrderNumber.toLowerCase())
                : true;

            const matchesWorkDate = searchWorkDate
                ? entry.workDate.toLowerCase().includes(searchWorkDate.toLowerCase())
                : true;

            const matchesWorkDone = searchWorkDone
                ? entry.workDone.toLowerCase().includes(searchWorkDone.toLowerCase())
                : true;

            return matchesOrderNumber && matchesWorkDate && matchesWorkDone;
        });
        setDisplayedLogEntries(filtered);
    };

    const handleResetSearch = () => {
        setSearchOrderNumber("");
        setSearchWorkDate("");
        setSearchWorkDone("");
        setDisplayedLogEntries(allLogEntries);
    };

    const handleRowClick = (entry) => {
        setSelectedEntry(entry);
    };

    const handleCloseDetails = () => {
        setSelectedEntry(null);
    };

    const handleAddLogEntry = (newEntry) => {
        setAllLogEntries(prevEntries => [{ id: Date.now(), ...newEntry, status: newEntry.status || "Лид" }, ...prevEntries]);
        setShowAddForm(false);
    };

    const handleDeleteLogEntry = (idToDelete) => {
        setAllLogEntries(prevEntries => prevEntries.filter(entry => entry.id !== idToDelete));
    };

    const handleDuplicateLogEntry = (entryToDuplicate) => {
        const newId = Date.now();
        const duplicatedEntry = {
            ...entryToDuplicate,
            id: newId,
            description: `${entryToDuplicate.description} (Копия)`,
        };
        setAllLogEntries(prevEntries => [...prevEntries, duplicatedEntry]);
    };

    return (
        <div className="journal-page">
            <Sidebar />
            <div className="journal-page-main-container">
                <header className="journal-header-container">
                    <h1 className="journal-title">Журнал</h1>
                    <div className="add-entry-button-wrapper">
                        <button className="add-entry-button" onClick={() => setShowAddForm(true)}>
                            ➕ Добавить запись
                        </button>
                    </div>
                    <div className="search-container">
                        <div className="main-search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Введите номер заказа, дату или слово"
                                className="main-search-input"
                                value={`${searchOrderNumber} ${searchWorkDate} ${searchWorkDone}`.trim()}
                                onChange={(e) => {
                                    
                                }}
                                onFocus={() => setShowAdvancedSearch(true)}
                            />
                            <span
                                className="toggle-advanced-search"
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            >
                                {showAdvancedSearch ? "▲" : "▼"}
                            </span>
                        </div>

                        {showAdvancedSearch && (
                            <div className="advanced-search-fields">
                                <div className="search-field-group">
                                    <label>Номер заказа</label>
                                    <input
                                        type="text"
                                        placeholder="Укажите номер заказа"
                                        value={searchOrderNumber}
                                        onChange={(e) => setSearchOrderNumber(e.target.value)}
                                    />
                                    <span className="clear-input" onClick={() => setSearchOrderNumber("")}>✖️</span>
                                </div>
                                <div className="search-field-group">
                                    <label>День</label>
                                    <input
                                        type="text"
                                        placeholder="Укажите день"
                                        value={searchWorkDate}
                                        onChange={(e) => setSearchWorkDate(e.target.value)}
                                    />
                                    <span className="clear-input" onClick={() => setSearchWorkDate("")}>✖️</span>
                                </div>
                                <div className="search-field-group">
                                    <label>Что было сделано?</label>
                                    <input
                                        type="text"
                                        placeholder="Укажите слова"
                                        value={searchWorkDone}
                                        onChange={(e) => setSearchWorkDone(e.target.value)}
                                    />
                                    <span className="clear-input" onClick={() => setSearchWorkDone("")}>✖️</span>
                                </div>

                                <div className="search-buttons">
                                    <button className="reset-button" onClick={handleResetSearch}>Сбросить</button>
                                    <button className="search-button" onClick={applyFilters}>Поиск</button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="journal-table-container">
                    <table className="journal-table">
                        <thead>
                            <tr>
                                <th>Статус заказа</th>
                                <th>Описание заказа</th>
                                <th>№ заказа</th>
                                <th>Исполнитель роль</th>
                                <th>Дата работы</th>
                                <th>Время начала</th>
                                <th>Время окончания</th>
                                <th>Часы</th>
                                <th>Что было сделано?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedLogEntries.map((entry) => (
                                <tr key={entry.id} onClick={() => handleRowClick(entry)} className="journal-table-row">
                                    <td className="status-cell" title={entry.status}>
                                        {statusToEmojiMap[entry.status] || entry.status}
                                    </td>
                                    <td>{entry.description}</td>
                                    <td>{entry.orderNumber}</td>
                                    <td>{entry.executorRole}</td>
                                    <td>{entry.workDate}</td>
                                    <td>{entry.startTime}</td>
                                    <td>{entry.endTime}</td>
                                    <td>{entry.hours}</td>
                                    <td>{entry.workDone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEntry && (
                <LogEntryDetails
                    entry={selectedEntry}
                    onClose={handleCloseDetails}
                    onDelete={handleDeleteLogEntry}
                    onDuplicate={handleDuplicateLogEntry}
                    orderStatuses={orderStatuses} 
                />
            )}

            {showAddForm && (
                <AddLogEntryForm
                    onAdd={handleAddLogEntry}
                    onClose={() => setShowAddForm(false)}
                    orderStatuses={orderStatuses} 
                />
            )}
        </div>
    );
};

export default JournalPage;