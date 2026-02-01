import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ChatPanel.css';
import { api } from '../../../api/api';


export default function ChatPanel({ initialLogs = [], storageKey, clientId, employeeId }) {
  const entityType = clientId ? 'client' : employeeId ? 'employee' : null;
  const entityId = clientId || employeeId || null;
  const isRemote = Boolean(entityType && entityId);
  const entityLabel = entityType === 'client' ? 'клиент' : entityType === 'employee' ? 'сотрудник' : 'объект';
  const [loadError, setLoadError] = useState('');

  const FIELD_LABELS = {
    email: 'Почта',
    phone: 'Телефон',
    full_name: 'ФИО',
    name: 'Название',
    login: 'Логин',
    status: 'Статус',
    birthDate: 'Дата рождения',
    passport: 'Паспорт',
    address: 'Адрес',
    companyId: 'Компания',
    roleId: 'Роль',
    countryId: 'Страна',
    currencyId: 'Валюта',
    balance: 'Баланс',
    tags: 'Теги',
    requisitesCount: 'Реквизиты',
    requisites: 'Реквизиты',
    accessesCount: 'Доступы',
    managerId: 'Менеджер',
    groupId: 'Группа',
    categoryId: 'Категория',
    sourceId: 'Источник',
    publicId: 'Публичный ID',
    userid: 'User ID',
    folder: 'Папка',
    chatLink: 'Ссылка на чат',
    telegramUsername: 'Telegram',
    telegramUserId: 'Telegram ID',
    telegramChatId: 'Telegram Chat ID',
    telegramLinkedAt: 'Дата привязки Telegram',
    telegramVerified: 'Telegram подтверждён',
    photoLink: 'Фото',
    rates: 'Ставки',
    mainCurrency: 'Основная валюта',
  };
  
  
  const [logs, setLogs] = useState(() => {
    if (isRemote) return [];
    let initialValue = initialLogs.map((log, idx) => ({ ...log, pinned: false, id: idx }));
    if (storageKey) {
      try {
        const savedLogs = localStorage.getItem(storageKey);
        if (savedLogs) {
          initialValue = JSON.parse(savedLogs);
        }
      } catch (e) {
        console.error("Ошибка загрузки логов из localStorage:", e);
      }
    }
    return initialValue;
  });

  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const taRef = useRef(null);

 
  useEffect(() => {
    if (isRemote || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch (e) {
      console.error("Ошибка сохранения логов в localStorage:", e);
    }
  }, [logs, storageKey, isRemote]);

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getFieldLabel = (field) => FIELD_LABELS[field] || field;

  const buildMessage = (log) => {
    if (log?.message) return log.message;
    if (log?.action === 'created') {
      return `Создан ${entityLabel}${log?.source === 'self' ? ' (саморегистрация)' : ''}`;
    }
    if (log?.action === 'deleted') return `Удалён ${entityLabel}`;
    if (log?.action === 'telegram_linked') return 'Привязан Telegram';
    if (log?.action === 'telegram_unlinked') return 'Telegram отвязан';
    if (log?.action === 'updated') {
      const entries = Object.entries(log?.changes || {});
      if (!entries.length) return 'Изменены данные';
      return entries
        .map(([field, change]) => {
          const label = getFieldLabel(field);
          if (change && (Array.isArray(change.added) || Array.isArray(change.removed))) {
            const added = Array.isArray(change.added) ? change.added : [];
            const removed = Array.isArray(change.removed) ? change.removed : [];
            const parts = [];
            if (added.length) parts.push(`Добавлено: ${formatValue(added)}`);
            if (removed.length) parts.push(`Удалено: ${formatValue(removed)}`);
            return parts.length ? `${label}: ${parts.join('; ')}` : `${label}: —`;
          }
          return `${label}: ${formatValue(change?.from)} → ${formatValue(change?.to)}`;
        })
        .join('; ');
    }
    return 'Событие';
  };

  const normalizeRemoteLog = (log) => ({
    id: log.id,
    timestamp: log.createdAt || log.timestamp,
    author: log.actorName || (log.source === 'self' ? 'Самостоятельно' : 'Система'),
    message: buildMessage(log),
    action: log.action,
    source: log.source,
    changes: log.changes,
    pinned: false,
  });

  useEffect(() => {
    if (!isRemote) return;
    let active = true;
    (async () => {
      try {
        const data = await api.getActivityLogs({ entityType, entityId, order: 'asc' });
        if (!active) return;
        const mapped = Array.isArray(data) ? data.map(normalizeRemoteLog) : [];
        setLogs(mapped);
        setLoadError('');
      } catch (e) {
        console.error('Ошибка загрузки логов:', e);
        if (active) {
          setLoadError('Не удалось загрузить логи. Проверьте, что миграции применены.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [entityType, entityId, isRemote]);


  // pin/unpin
  const handlePin = id => {
    if (isRemote) return;
    setLogs(logs.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l));
  };

  // open confirm dialog
  const requestDelete = id => {
    if (isRemote) return;
    setConfirmDeleteId(id);
  };
  // actually delete
  const confirmDelete = () => {
    if (isRemote) {
      setConfirmDeleteId(null);
      return;
    }
    setLogs(logs.filter(l => l.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  // edit start/save/cancel
  const startEdit = l => {
    if (isRemote) return;
    setEditingId(l.id);
    setEditText(l.message);
  };
  const saveEdit = id => {
    if (isRemote) return;
    setLogs(logs.map(l => l.id === id ? { ...l, message: editText } : l));
    setEditingId(null);
  };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  // textarea auto-resize + limit
  const handleNoteChange = e => {
    if (e.target.value.length <= 2000) {
      setNote(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };
  const handleSend = async () => {
    const txt = note.trim();
    if (!txt) return;

    if (isRemote) {
      try {
        const created = await api.addActivityNote({ entityType, entityId, message: txt });
        if (created) {
          const mapped = normalizeRemoteLog(created);
          setLogs((prev) => [...prev, mapped]);
        }
        setNote('');
        if (taRef.current) taRef.current.style.height = 'auto';
      } catch (e) {
        console.error('Ошибка добавления заметки:', e);
      }
      return;
    }

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
    const baseLogs = isRemote ? logs : logs.filter(l => !l.pinned);
    baseLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const month = d.toLocaleString('ru', { month: 'long', year: 'numeric' });
      (map[month] = map[month] || []).push(log);
    });
    return Object.entries(map).map(([m, items]) => ({ month: m, items }));
  }, [logs, isRemote]);

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

  const pinnedLogs = isRemote ? [] : logs.filter(l => l.pinned);

  return (
    <aside className="chat-panel">
      <div className="chat-scroll">
        {loadError && <div className="chat-empty">{loadError}</div>}
        {!loadError && logs.length === 0 && (
          <div className="chat-empty">Пока нет логов. Сохраните изменения или добавьте примечание.</div>
        )}
        {/* закреплённые */}
        {!isRemote && pinnedLogs.map(log => (
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
                {!isRemote && (
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
                )}
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
          <span className="char-counter">{note.length}/2000</span>
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
    author: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired
  })),
  storageKey: PropTypes.string,
  clientId: PropTypes.string,
  employeeId: PropTypes.string
};
