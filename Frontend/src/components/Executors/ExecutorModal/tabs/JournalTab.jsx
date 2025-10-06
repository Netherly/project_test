import React, { useMemo } from 'react';

export default function JournalTab({ executor, journalEntries, isNew }) {
    
    const executorWorkLog = useMemo(() => {
        // Проверяем наличие журнала и имени исполнителя
        // В объекте executor имя приходит в поле 'performer'
        if (!journalEntries || !executor?.performer) {
            return [];
        }

        // 1. Фильтруем все записи журнала напрямую
        const filteredLogs = journalEntries.filter(
            // Сравниваем 'executorRole' из записи журнала с именем 'performer'
            (entry) => entry.executorRole === executor.performer
        );

        // 2. Сортируем отфильтрованные записи по дате (от новых к старым)
        return filteredLogs.sort((a, b) => new Date(b.workDate) - new Date(a.workDate));

    }, [journalEntries, executor]); // Зависимости: массив журнала и объект исполнителя

    if (isNew) {
        return (
            <div className="placeholder-tab">
                <p>Журнал выполнения будет доступен после сохранения исполнителя.</p>
            </div>
        );
    }

    return (
        <div className="tab-content-row-column">
            <div className="tab-content-title">Журнал выполнения</div>

            {executorWorkLog.length > 0 ? (
                <div className="executor-work-log-table">
                    <div className="executor-work-log-header">
                        <div>Номер заказа</div> 
                        <div>Дата работы</div>
                        <div>Часы</div>
                        <div>Что было сделано?</div>
                    </div>
                    {executorWorkLog.map((log) => (
                        <div key={log.id} className="executor-work-log-row">
                            <div>{log.orderNumber || '-'}</div>
                            <div>{new Date(log.workDate).toLocaleDateString() || '-'}</div>
                            <div>{log.hours || '-'}</div>
                            <div>{log.workDone || '-'}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="placeholder-tab">
                    <p>Для этого исполнителя нет записей о выполненных работах.</p>
                </div>
            )}
        </div>
    );
}