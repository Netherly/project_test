import React, { useMemo } from 'react';

export default function JournalTab({ executor, journalEntries, isNew }) {
    
    const executorWorkLog = useMemo(() => {
        if (!journalEntries || !executor?.performer) {
            return [];
        }
        const filteredLogs = journalEntries.filter(
            (entry) => entry.executorRole === executor.performer
        );
        return filteredLogs.sort((a, b) => new Date(b.workDate) - new Date(a.workDate));
    }, [journalEntries, executor]);

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
                <div className="finances-log-table">
                        
                    {/* Заголовок */}
                    <div className="finances-log-row header-row">
                        <div className="finances-log-content-wrapper">
                            <div className="finances-log-cell">Номер заказа</div>
                            <div className="finances-log-cell">Дата работы</div>
                            <div className="finances-log-cell">Часы</div>
                            <div className="finances-log-cell">Что было сделано?</div>
                        </div>
                    </div>

                    {/* Строки данных */}
                    {executorWorkLog.map((log) => (
                        <div key={log.id} className="finances-log-row">
                            <div className="finances-log-content-wrapper">
                                <div className="finances-log-cell">
                                    <input type="text" value={log.orderNumber || '-'} readOnly />
                                </div>
                                <div className="finances-log-cell">
                                    <input type="text" value={new Date(log.workDate).toLocaleDateString() || '-'} readOnly />
                                </div>
                                <div className="finances-log-cell">
                                    <input type="text" value={log.hours || '-'} readOnly />
                                </div>
                                <div className="finances-log-cell">
                                    <input type="text" value={log.workDone || '-'} readOnly />
                                </div>
                            </div>
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