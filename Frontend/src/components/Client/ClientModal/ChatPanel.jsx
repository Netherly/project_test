// src/components/Client/ClientModal/ChatPanel.jsx
import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import './ChatPanel.css';

export default function ChatPanel({ initialLogs = [] }) {
  const [logs, setLogs]               = useState(
    initialLogs.map((log, idx) => ({ ...log, pinned: false, id: idx }))
  );
  const [note, setNote]               = useState('');
  const [editingId, setEditingId]     = useState(null);
  const [editText, setEditText]       = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const taRef                          = useRef(null);

  // pin/unpin
  const handlePin = id =>
    setLogs(logs.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l));

  // open confirm dialog
  const requestDelete = id => setConfirmDeleteId(id);
  // actually delete
  const confirmDelete = () => {
    setLogs(logs.filter(l => l.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  // edit start/save/cancel
  const startEdit = l => { setEditingId(l.id); setEditText(l.message); };
  const saveEdit  = id => {
    setLogs(logs.map(l => l.id === id ? { ...l, message: editText } : l));
    setEditingId(null);
  };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  // textarea auto-resize + limit
  const handleNoteChange = e => {
    if (e.target.value.length <= 500) {
      setNote(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };
  const handleSend = () => {
    const txt = note.trim();
    if (!txt) return;
    const now = new Date();
    const newLog = {
      id: Date.now(),
      timestamp: now.toISOString(),
      author: 'Я',
      message: txt,
      pinned: false
    };
    setLogs([...logs, newLog]);
    setNote('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  // grouping unpinned logs by month
  const groups = useMemo(() => {
    const map = {};
    logs.filter(l => !l.pinned).forEach(log => {
      const d = new Date(log.timestamp);
      const month = d.toLocaleString('ru', { month: 'long', year: 'numeric' });
      (map[month] = map[month] || []).push(log);
    });
    return Object.entries(map).map(([m, items]) => ({ month: m, items }));
  }, [logs]);

  // always show full date/time instead of "Сегодня"
  const formatMeta = log => {
    const d = new Date(log.timestamp);
    return d.toLocaleString('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' ' + log.author;
  };

  const pinnedLogs = logs.filter(l => l.pinned);

  return (
    <aside className="chat-panel">
      <div className="chat-scroll">
        {/* закреплённые */}
        {pinnedLogs.map(log => (
          <div key={log.id} className="log-item pinned">
            <div className="log-item__icon">📌</div>
            <div className="log-item__body">
              <div className="log-header">
                <span className="log-meta">{formatMeta(log)}</span>
              </div>
              <div className="log-message">{log.message}</div>
            </div>
            <div className="log-actions">
              <button className="action-btn pin" onClick={() => handlePin(log.id)}>
                ⭐ Открепить
              </button>
              <button className="action-btn delete" onClick={() => requestDelete(log.id)}>
                🚫 Удалить
              </button>
            </div>
          </div>
        ))}

        {/* группы по месяцам */}
        {groups.map(({ month, items }) => (
          <React.Fragment key={month}>
            <div className="chat-group__header">{month}</div>
            {items.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-item__icon">📄</div>
                <div className="log-item__body">
                  <div className="log-header">
                    <span className="log-meta">{formatMeta(log)}</span>
                  </div>
                  {editingId === log.id ? (
                    <textarea
                      className="log-edit-textarea"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                    />
                  ) : (
                    <div className="log-message">{log.message}</div>
                  )}
                </div>
                <div className="log-actions">
                  <button className="action-btn pin" onClick={() => handlePin(log.id)}>
                    ⭐ Закрепить
                  </button>
                  <button className="action-btn delete" onClick={() => requestDelete(log.id)}>
                    🚫 Удалить
                  </button>
                  {editingId === log.id ? (
                    <>
                      <button className="action-btn save" onClick={() => saveEdit(log.id)}>
                        💾 Сохранить
                      </button>
                      <button className="action-btn cancel" onClick={cancelEdit}>
                        ✖ Отмена
                      </button>
                    </>
                  ) : (
                    <button className="action-btn edit" onClick={() => startEdit(log)}>
                      ✏️ Изменить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* поле ввода */}
      <div className="chat-input-wrapper">
        <textarea
          ref={taRef}
          className="chat-textarea"
          placeholder="Примечание: введите текст (Ctrl+Enter для отправки)"
          value={note}
          onChange={handleNoteChange}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSend()}
          rows={1}
        />
        <div className="chat-input-footer">
          <span className="char-counter">{note.length}/500</span>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!note.trim()}
          >
            Добавить
          </button>
        </div>
      </div>

      {/* окно подтверждения удаления */}
      {confirmDeleteId !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p>Данное примечание будет удалено. Продолжить?</p>
            <div className="confirm-buttons">
              <button className="btn yes" onClick={confirmDelete}>Да</button>
              <button className="btn no" onClick={cancelDelete}>Нет</button>
            </div>
            <button className="confirm-close" onClick={cancelDelete}>×</button>
          </div>
        </div>
      )}
    </aside>
  );
}

ChatPanel.propTypes = {
  initialLogs: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    author:    PropTypes.string.isRequired,
    message:   PropTypes.string.isRequired
  }))
};
