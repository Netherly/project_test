import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ChatPanel.css';
import { api } from '../../../api/api';
import { useNavigate } from 'react-router-dom';


export default function ChatPanel({ initialLogs = [], storageKey, clientId, employeeId }) {
  const entityType = clientId ? 'client' : employeeId ? 'employee' : null;
  const entityId = clientId || employeeId || null;
  const isRemote = Boolean(entityType && entityId);
  const isEmployeeRemote = isRemote && entityType === 'employee';
  const entityLabel = entityType === 'client' ? 'клиент' : entityType === 'employee' ? 'сотрудник' : 'объект';
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

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
  const IMPORTANT_EMPLOYEE_ACTIONS = new Set([
    'created',
    'deleted',
    'note',
    'telegram_linked',
    'telegram_unlinked',
    'asset_attached',
    'asset_detached',
    'asset_removed',
    'transaction_created',
    'transaction_updated',
    'transaction_deleted',
    'asset_transaction_created',
    'asset_transaction_updated',
    'asset_transaction_deleted',
  ]);
  
  
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
    const hasChanges = Boolean(log?.changes && Object.keys(log.changes).length);
    if (log?.message && (log?.action !== 'updated' || !hasChanges)) return log.message;
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
        .flatMap(([field, change]) => {
          const label = getFieldLabel(field);
          if (change && (Array.isArray(change.added) || Array.isArray(change.removed))) {
            const added = Array.isArray(change.added) ? change.added : [];
            const removed = Array.isArray(change.removed) ? change.removed : [];
            const parts = [];
            if (added.length) parts.push(`${label} добавлено "${formatValue(added)}"`);
            if (removed.length) parts.push(`${label} удалено "${formatValue(removed)}"`);
            return parts.length ? parts : [`${label} изменено`];
          }

          const from = formatValue(change?.from);
          const to = formatValue(change?.to);
          if ((change?.from === null || change?.from === undefined || change?.from === '') && to !== '—') {
            return `${label} добавлено "${to}"`;
          }
          if (change?.to === null || change?.to === undefined || change?.to === '') {
            return `${label} очищено`;
          }
          return `${label} было "${from}" стало "${to}"`;
        })
        .join('\n');
    }
    return 'Событие';
  };

  const getRemotePresentation = (log) => {
    if (!isEmployeeRemote) return 'card';
    if (log?.presentation) return log.presentation;
    return IMPORTANT_EMPLOYEE_ACTIONS.has(log?.action) ? 'important' : 'inline';
  };

  const normalizeRemoteLog = (log) => ({
    id: log.id,
    timestamp: log.createdAt || log.timestamp,
    author: log.actorName || (log.source === 'self' ? 'Самостоятельно' : 'Система'),
    actorId: log.actorId || null,
    message: buildMessage(log),
    messageParts: Array.isArray(log.messageParts) ? log.messageParts : null,
    action: log.action,
    source: log.source,
    changes: log.changes,
    target: log.target || null,
    pinned: Boolean(log.pinned),
    important: Boolean(log.important ?? getRemotePresentation(log) !== 'inline'),
    presentation: getRemotePresentation(log),
    editable: Boolean(log.editable),
    deletable: Boolean(log.deletable),
    pinnable: Boolean(log.pinnable ?? getRemotePresentation(log) !== 'inline'),
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
  const handlePin = async (id) => {
    if (isEmployeeRemote) {
      const target = logs.find((log) => log.id === id);
      if (!target?.pinnable) return;
      try {
        const updated = await api.pinActivityLog({
          entityType,
          entityId,
          logId: id,
          pinned: !target.pinned,
        });
        if (!updated) return;
        setLogs((prev) => prev.map((log) => (log.id === id ? normalizeRemoteLog(updated) : log)));
      } catch (e) {
        console.error('Ошибка закрепления заметки:', e);
      }
      return;
    }

    if (isRemote) return;
    setLogs(logs.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l));
  };

  // open confirm dialog
  const requestDelete = id => {
    if (isEmployeeRemote) {
      const target = logs.find((log) => log.id === id);
      if (!target?.deletable) return;
      setConfirmDeleteId(id);
      return;
    }
    if (isRemote) return;
    setConfirmDeleteId(id);
  };
  // actually delete
  const confirmDelete = async () => {
    if (isEmployeeRemote) {
      try {
        await api.deleteActivityNote({
          entityType,
          entityId,
          logId: confirmDeleteId,
        });
        setLogs((prev) => prev.filter((log) => log.id !== confirmDeleteId));
      } catch (e) {
        console.error('Ошибка удаления заметки:', e);
      }
      setConfirmDeleteId(null);
      return;
    }

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
    if (isEmployeeRemote) {
      if (!l?.editable) return;
      setEditingId(l.id);
      setEditText(l.message);
      return;
    }
    if (isRemote) return;
    setEditingId(l.id);
    setEditText(l.message);
  };
  const saveEdit = async (id) => {
    if (isEmployeeRemote) {
      try {
        const updated = await api.updateActivityNote({
          entityType,
          entityId,
          logId: id,
          message: editText,
        });
        if (!updated) return;
        setLogs((prev) => prev.map((log) => (log.id === id ? normalizeRemoteLog(updated) : log)));
        setEditingId(null);
        setEditText('');
      } catch (e) {
        console.error('Ошибка обновления заметки:', e);
      }
      return;
    }

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
    const baseLogs = isEmployeeRemote
      ? logs.filter((log) => !log.pinned)
      : isRemote
        ? logs
        : logs.filter((log) => !log.pinned);
    baseLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const month = d.toLocaleString('ru', { month: 'long', year: 'numeric' });
      (map[month] = map[month] || []).push(log);
    });
    return Object.entries(map).map(([m, items]) => ({ month: m, items }));
  }, [logs, isRemote, isEmployeeRemote]);

  // always show full date/time instead of "Сегодня"
  const formatMeta = log => {
    const d = new Date(log.timestamp);
    return d.toLocaleString('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pinnedLogs = isEmployeeRemote
    ? logs.filter((log) => log.pinned)
    : isRemote
      ? []
      : logs.filter((log) => log.pinned);

  const renderActor = (log) => {
    if (!log.author) return null;

    if (log.actorId) {
      return (
        <button
          type="button"
          className="log-actor-link"
          onClick={() => navigate(`/employees/${log.actorId}`)}
        >
          {log.author}
        </button>
      );
    }

    return <span>{log.author}</span>;
  };

  const getTargetRoute = (target) => {
    if (!target?.id) return null;
    if (target.type === 'transaction') return `/list/${target.id}`;
    if (target.type === 'asset') return `/assets/${target.id}`;
    if (target.type === 'employee') return `/employees/${target.id}`;
    return null;
  };

  const hasInlineMessageTargets = (log) =>
    Array.isArray(log?.messageParts) &&
    log.messageParts.some((part) => part?.type === 'link' && getTargetRoute({ type: part.targetType, id: part.id }));

  const getTargetLabel = (target) => {
    if (target?.type === 'transaction') return 'Открыть транзакцию';
    if (target?.type === 'asset') return 'Открыть актив';
    if (target?.type === 'employee') return 'Открыть сотрудника';
    return 'Открыть';
  };

  const getImportantLogIcon = (log) => {
    if (log.action === 'note') return { symbol: '✓', tone: 'note' };
    if (String(log.action || '').includes('transaction')) return { symbol: '₴', tone: 'transaction' };
    if (String(log.action || '').includes('asset')) return { symbol: '◆', tone: 'asset' };
    if (String(log.action || '').includes('deleted')) return { symbol: '−', tone: 'danger' };
    return { symbol: '+', tone: 'create' };
  };

  const renderLogMessageContent = (log) => {
    if (!Array.isArray(log?.messageParts) || !log.messageParts.length) {
      return log.message;
    }

    return log.messageParts.map((part, index) => {
      if (part?.type !== 'link') {
        return <React.Fragment key={`${log.id}-text-${index}`}>{part?.text || ''}</React.Fragment>;
      }

      const route = getTargetRoute({ type: part.targetType, id: part.id });
      if (!route) {
        return <React.Fragment key={`${log.id}-linktext-${index}`}>{part?.text || ''}</React.Fragment>;
      }

      return (
        <button
          key={`${log.id}-link-${part.targetType || 'target'}-${part.id || index}`}
          type="button"
          className="log-actor-link log-inline-link"
          onClick={() => navigate(route)}
        >
          {part.text}
        </button>
      );
    });
  };

  const renderImportantActions = (log) => {
    const canShowActions = (!isRemote && !isEmployeeRemote) || (isEmployeeRemote && (log.pinnable || log.editable || log.deletable));
    if (!canShowActions) return null;

    return (
      <div className="log-actions">
        {(isEmployeeRemote ? log.pinnable : true) && (
          <button className="action-btn pin" onClick={() => handlePin(log.id)}>
            {log.pinned ? '⭐ Открепить' : '⭐ Закрепить'}
          </button>
        )}
        {(isEmployeeRemote ? log.deletable : true) && (
          <button className="action-btn delete" onClick={() => requestDelete(log.id)}>
            🚫 Удалить
          </button>
        )}
        {(isEmployeeRemote ? log.editable : true) && (
          editingId === log.id ? (
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
          )
        )}
      </div>
    );
  };

  const renderEmployeeImportantLog = (log) => {
    const icon = getImportantLogIcon(log);
    const targetRoute = getTargetRoute(log.target);
    const showGenericTargetLink = Boolean(targetRoute) && !hasInlineMessageTargets(log);
    return (
      <div key={log.id} className={`log-item log-item--with-actions employee-important-log${log.pinned ? ' pinned' : ''}`}>
        <div className={`log-item__icon employee-important-log__icon tone-${icon.tone}`}>{icon.symbol}</div>
        <div className="log-item__body">
          <div className="log-header">
            <span className="log-meta">
              {formatMeta(log)}
              {log.author && (
                <>
                  {' '}
                  {renderActor(log)}
                </>
              )}
            </span>
          </div>
          {editingId === log.id ? (
            <textarea
              className="log-edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
            />
          ) : (
            <>
              <div className="log-message">{renderLogMessageContent(log)}</div>
              {showGenericTargetLink && (
                <button
                  type="button"
                  className="log-target-link"
                  onClick={() => navigate(targetRoute)}
                >
                  {getTargetLabel(log.target)}
                </button>
              )}
            </>
          )}
        </div>
        {renderImportantActions(log)}
      </div>
    );
  };

  const renderEmployeeInlineLog = (log) => (
    <div key={log.id} className="employee-log-row">
      <div className="employee-log-row__meta">
        {formatMeta(log)}
        {log.author && (
          <>
            {' '}
            {renderActor(log)}
          </>
        )}
      </div>
      <div className="employee-log-row__message">{log.message}</div>
    </div>
  );

  return (
    <aside className="chat-panel">
      <div className="chat-scroll">
        {loadError && <div className="chat-empty">{loadError}</div>}
        {!loadError && logs.length === 0 && (
          <div className="chat-empty">Пока нет логов. Сохраните изменения или добавьте примечание.</div>
        )}
        {/* закреплённые */}
        {!isEmployeeRemote && !isRemote && pinnedLogs.map(log => (
          <div key={log.id} className="log-item pinned">
            <div className="log-item__icon">📌</div>
            <div className="log-item__body">
              <div className="log-header">
                <span className="log-meta">
                  {formatMeta(log)}
                  {log.author && (
                    <>
                      {' '}
                      {renderActor(log)}
                    </>
                  )}
                </span>
              </div>
              <div className="log-message">{log.message}</div>
            </div>
            {renderImportantActions(log)}
          </div>
        ))}

        {isEmployeeRemote && pinnedLogs.map(renderEmployeeImportantLog)}

        {/* группы по месяцам */}
        {groups.map(({ month, items }) => (
          <React.Fragment key={month}>
            <div className="chat-group__header">{month}</div>
            {items.map(log => {
              if (isEmployeeRemote) {
                return log.presentation === 'inline'
                  ? renderEmployeeInlineLog(log)
                  : renderEmployeeImportantLog(log);
              }

              return (
                <div key={log.id} className="log-item">
                  <div className="log-item__icon">📄</div>
                  <div className="log-item__body">
                    <div className="log-header">
                      <span className="log-meta">
                        {formatMeta(log)}
                        {log.author && (
                          <>
                            {' '}
                            {renderActor(log)}
                          </>
                        )}
                      </span>
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
                  {!isRemote && renderImportantActions(log)}
                </div>
              );
            })}
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
