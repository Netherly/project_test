import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../Sidebar';
import Modal from '../AlertModal/Modal';
import '../../styles/CurrencyRates.css';
import { ensureTodayRates, getRatesList, upsertRates } from '../../api/rates';
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon';

const PAGE_SIZE = 50;

const fmt = (v, digits = 4) => {
  const n = Number(v);
  return Number.isFinite(n) ? parseFloat(n.toFixed(digits)).toString() : '0';
};

const safeDiv = (a, b) => {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0) return 0;
  return x / y;
};

/*
const calculateRates = (usdToUah, rubToUah) => {
  const C4 = 1;
  const D4 = parseFloat(usdToUah) || 0;
  const E4 = parseFloat(rubToUah) || 0;
  const F4 = D4;

  const UAH_RUB  = safeDiv(C4, E4);
  const UAH_USD  = safeDiv(C4, D4);
  const UAH_USDT = safeDiv(C4, F4);

  const USD_UAH  = safeDiv(D4, C4);
  const USD_RUB  = safeDiv(D4, E4);
  const USD_USDT = safeDiv(D4, F4);

  const USDT_UAH = safeDiv(F4, C4);
  const USDT_USD = safeDiv(F4, D4);
  const USDT_RUB = safeDiv(F4, E4);

  const RUB_UAH  = safeDiv(E4, C4);
  const RUB_USD  = safeDiv(E4, D4);
  const RUB_USDT = safeDiv(E4, F4);

  return {
    UAH: C4, USD: D4, RUB: E4, USDT: F4,
    UAH_RUB, UAH_USD, UAH_USDT,
    USD_UAH, USD_RUB, USD_USDT,
    USDT_UAH, USDT_USD, USDT_RUB,
    RUB_UAH, RUB_USD, RUB_USDT,
  };
};
*/

const getNum = (maybe, fallback) => {
  const n = Number(maybe);
  return Number.isFinite(n) ? n : fallback;
};

const getPureDateTimestamp = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const toYmd = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${toYmd(value)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
};

const mapServerRows = (rows) =>
  rows
    .map((row) => {
      const ymd = toYmd(row.date || new Date());
      const ts  = getPureDateTimestamp(ymd || new Date());
      const USD = Number(row.USD ?? row.usd ?? 0);
      const RUB = Number(row.RUB ?? row.rub ?? 0);
      const UAH = Number(row.UAH ?? row.uah ?? 1);
      
      return {
        id: ymd || String(ts),
        ymd,
        date: ts,
        UAH,
        USD,
        RUB,
        USDT: Number(row.USDT ?? row.usdt ?? 0),
        UAH_RUB:  getNum(row.UAH_RUB  ?? row.uah_rub,  0),
        UAH_USD:  getNum(row.UAH_USD  ?? row.uah_usd,  0),
        UAH_USDT: getNum(row.UAH_USDT ?? row.uah_usdt, 0),
        USD_UAH:  getNum(row.USD_UAH  ?? row.usd_uah,  0),
        USD_RUB:  getNum(row.USD_RUB  ?? row.usd_rub,  0),
        USD_USDT: getNum(row.USD_USDT ?? row.usd_usdt, 0),
        USDT_UAH: getNum(row.USDT_UAH ?? row.usdt_uah, 0),
        USDT_USD: getNum(row.USDT_USD ?? row.usdt_usd, 0),
        USDT_RUB: getNum(row.USDT_RUB ?? row.usdt_rub, 0),
        RUB_UAH:  getNum(row.RUB_UAH  ?? row.rub_uah,  0),
        RUB_USD:  getNum(row.RUB_USD  ?? row.rub_usd,  0),
        RUB_USDT: getNum(row.RUB_USDT ?? row.rub_usdt, 0),
      };
    })
    .sort((a, b) => b.date - a.date);

function isClose(a, b, eps = 1e-9) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

function debounce(fn, wait = 300) {
  let t, lastArgs, lastThis;
  const debounced = function (...args) {
    lastArgs = args; lastThis = this;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(lastThis, lastArgs), wait);
  };
  debounced.flush = () => {
    clearTimeout(t);
    if (lastArgs) fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = undefined;
  };
  return debounced;
}

function CurrencyRates() {
  const [rates, setRates] = useState([]);
  const [initialRates, setInitialRates] = useState([]);
  const [activeRowId, setActiveRowId] = useState(null);
  const [dirtyIds, setDirtyIds] = useState(() => new Set());
  const isDirty = dirtyIds.size > 0;

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const hasMore = rates.length < total;

  const sentinelRef = useRef(null);
  const ensuredTodayRef = useRef(false);

  const [modal, setModal] = useState({
    open: false,
    title: '',
    type: 'info',
    message: '',
    actions: [],
  });

  const openModal = (title, message, type = 'info', actions = []) =>
    setModal({
      open: true,
      title,
      type,
      message,
      actions: actions.length
        ? actions
        : [{ label: 'Ок', variant: 'primary', onClick: () => setModal(m => ({ ...m, open: false })), autoFocus: true }],
    });

  const openErrorModal = (title, message, onRetry) =>
    setModal({
      open: true,
      title,
      type: 'error',
      message,
      actions: [
        { label: 'Закрыть', variant: 'ghost', onClick: () => setModal(m => ({ ...m, open: false })) },
        ...(onRetry ? [{ label: 'Повторить', variant: 'primary', onClick: onRetry, autoFocus: true }] : []),
      ],
    });

  const fetchPage = useCallback(async (pageToLoad) => {
    const data = await getRatesList(pageToLoad, PAGE_SIZE);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    return { mapped: mapServerRows(rows), total: Number(data?.total ?? rows.length) };
  }, []);

  const debouncedSaveToSession = useRef(
    debounce((data) => {
      try { sessionStorage.setItem('currencyRates', JSON.stringify(data)); } catch {}
    }, 300)
  );
  useEffect(() => () => debouncedSaveToSession.current.flush?.(), []);

  const initialLoad = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let { mapped, total: t } = await fetchPage(1);

      if (!ensuredTodayRef.current) {
        ensuredTodayRef.current = true;
        try {
          const result = await ensureTodayRates();
          if (result?.created) {
            const refreshed = await fetchPage(1);
            mapped = refreshed.mapped;
            t = refreshed.total;
          }
        } catch (todayError) {
          console.error(todayError);
        }
      }

      setRates(mapped);
      setInitialRates(mapped);
      setTotal(t);
      setPage(1);
      debouncedSaveToSession.current(mapped);
    } catch (e) {
      console.error(e);
      setError('Не удалось получить курсы с сервера. Показаны локальные данные (сессия).');
      const saved = sessionStorage.getItem('currencyRates');
      if (saved) {
        const parsed = JSON.parse(saved)
          .map((row) => ({
            ...row,
            id: row.id || String(row.date),
            date: getPureDateTimestamp(row.date),
            USDT: Number(row.USD ?? row.USDT ?? 0),
          }))
          .sort((a, b) => b.date - a.date);

        setRates(parsed);
        setInitialRates(parsed);
        setTotal(parsed.length);
        setPage(1);

        openModal(
          'Оффлайн данные',
          'Данные загружены не с сервера, а из хранилища сессии (sessionStorage). Некоторые функции могут быть ограничены.',
          'warning'
        );
      } else {
        openErrorModal(
          'Ошибка загрузки',
          'Не удалось получить курсы с сервера. В сессии нет локальной копии.',
          () => { setModal(m => ({ ...m, open: false })); initialLoad(); }
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true); setError('');
    try {
      const nextPage = page + 1;
      const { mapped } = await fetchPage(nextPage);

      setRates((prev) => {
        const known = new Set(prev.map(r => r.id));
        const merged = [...prev, ...mapped.filter(r => !known.has(r.id))];
        debouncedSaveToSession.current(merged);
        return merged;
      });
      setInitialRates((prev) => {
        const known = new Set(prev.map(r => r.id));
        return [...prev, ...mapped.filter(r => !known.has(r.id))];
      });

      setPage(nextPage);
    } catch (e) {
      console.error(e);
      openErrorModal(
        'Ошибка загрузки',
        'Не удалось догрузить записи. Проверьте подключение к сети.',
        () => { setModal(m => ({ ...m, open: false })); loadMore(); }
      );
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasMore, loading, loadingMore, loadMore]);

  const startEditRow = (rowId) => setActiveRowId(rowId);
  const stopEditRow  = () => setActiveRowId(null);

  const markDirty = (rowId, dirty) => {
    setDirtyIds(prev => {
      const next = new Set(prev);
      if (dirty) next.add(rowId); else next.delete(rowId);
      return next;
    });
  };

  const isRowChanged = (r, b) => {
    if (!b) return true;
    return !isClose(r.USD, b.USD) || !isClose(r.RUB, b.RUB) || !isClose(r.USDT, b.USDT) ||
           !isClose(r.UAH_RUB, b.UAH_RUB) || !isClose(r.UAH_USD, b.UAH_USD) || !isClose(r.UAH_USDT, b.UAH_USDT) ||
           !isClose(r.USD_UAH, b.USD_UAH) || !isClose(r.USD_RUB, b.USD_RUB) || !isClose(r.USD_USDT, b.USD_USDT) ||
           !isClose(r.USDT_UAH, b.USDT_UAH) || !isClose(r.USDT_USD, b.USDT_USD) || !isClose(r.USDT_RUB, b.USDT_RUB) ||
           !isClose(r.RUB_UAH, b.RUB_UAH) || !isClose(r.RUB_USD, b.RUB_USD) || !isClose(r.RUB_USDT, b.RUB_USDT);
  };

  const handleInputChange = (e, rowIndex, key) => {
    e.stopPropagation();
    const raw = e.target.value.replace(',', '.');

    if (raw !== '' && !/^\d*\.?\d{0,4}$/.test(raw)) {
      return;
    }

    setRates((prev) => {
      const arr = [...prev];
      const before = arr[rowIndex];

      let nextRow = { ...before, [key]: raw };

      arr[rowIndex] = nextRow;

      const base = initialRates.find(r => r.id === before.id);
      markDirty(before.id, isRowChanged(arr[rowIndex], base));
      debouncedSaveToSession.current(arr);
      return arr;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError('');
      if (!isDirty) return;

      const baseById = new Map(initialRates.map((r) => [r.id, r]));
      const changed = rates.filter((r) => {
        if (!dirtyIds.has(r.id)) return false;
        return isRowChanged(r, baseById.get(r.id));
      });

      if (changed.length === 0) {
        setDirtyIds(new Set());
        return;
      }

      const payload = changed.map((row) => ({
        date: row.ymd || toYmd(row.date),
        uah:  1.0,
        usd:  Number(row.USD),
        rub:  Number(row.RUB),
        usdt: Number(row.USDT),
        uah_rub:  Number(row.UAH_RUB),
        uah_usd:  Number(row.UAH_USD),
        uah_usdt: Number(row.UAH_USDT),
        usd_uah:  Number(row.USD_UAH),
        usd_rub:  Number(row.USD_RUB),
        usd_usdt: Number(row.USD_USDT),
        usdt_uah: Number(row.USDT_UAH),
        usdt_usd: Number(row.USDT_USD),
        usdt_rub: Number(row.USDT_RUB),
        rub_uah:  Number(row.RUB_UAH),
        rub_usd:  Number(row.RUB_USD),
        rub_usdt: Number(row.RUB_USDT),
      }));

      await upsertRates(payload);
      setInitialRates(rates.map((row) => ({ ...row })));
      setDirtyIds(new Set());
      debouncedSaveToSession.current(rates);
      stopEditRow();
    } catch (e) {
      console.error(e);
      setError('Не удалось сохранить на сервере.');
      openErrorModal(
        'Ошибка сохранения',
        'Данные не сохранились. Возможно, проблема с подключением к серверу.',
        () => { setModal(m => ({ ...m, open: false })); handleSave(); }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const restored = initialRates.map(r => ({ ...r }));
    setRates(restored);
    setDirtyIds(new Set());
    stopEditRow();
  };

  const handleEnsureToday = async () => {
    if (isDirty) {
      openModal('Есть несохранённые изменения', 'Перед добавлением курса на сегодня сохраните или отмените изменения.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ensureTodayRates();
      await initialLoad();

      if (result?.created) {
        openModal('Курс на сегодня добавлен', 'Создана запись на сегодня на основе последнего курса.', 'success');
      } else {
        openModal('Курс на сегодня уже есть', 'Запись на сегодня уже существует.', 'info');
      }
    } catch (e) {
      console.error(e);
      setError('Не удалось добавить курс на сегодня.');
      openErrorModal(
        'Ошибка',
        'Не удалось подготовить запись курсов на сегодня.',
        () => { setModal(m => ({ ...m, open: false })); handleEnsureToday(); }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="currency-rates-page">
      <Sidebar />
      <div className="currency-rates-main-container">
        <header
          className="currency-rates-header-container"
        >
          <h2 className="currency-rates-header-title">
            <PageHeaderIcon pageName={"Курс валют"}/>
            Курсы валют
            </h2>

          {loading && <span>Загрузка…</span>}
          {saving && <span>Сохранение…</span>}
          {error && <span style={{ color: 'salmon' }}>{error}</span>}

          <div className="currency-rates-header-actions">
            {isDirty && (
              <>
                <button type="button" className="cancel-order-btn" onClick={handleCancel}>
                  Отменить
                </button>
                <button type="button" className="save-order-btn" onClick={handleSave} disabled={saving}>
                  Сохранить
                </button>
              </>
            )}

            {!isDirty && (
              <button
                type="button"
                className="cancel-order-btn"
                onClick={handleEnsureToday}
                disabled={loading || saving}
                title="Создать запись курсов на сегодня"
              >
                На сегодня
              </button>
            )}
          </div>
        </header>

        <div className="currency-rates-table-container custom-scrollbar">
          <div className="currency-rates-table-wrapper">
            <table className="currency-rates-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>UAH</th>
                  <th>USD</th>
                  <th>RUB</th>
                  <th>USDT</th>
                  <th>UAH:RUB</th>
                  <th>UAH:USD</th>
                  <th>UAH:USDT</th>
                  <th>USD:UAH</th>
                  <th>USD:RUB</th>
                  <th>USD:USDT</th>
                  <th>USDT:UAH</th>
                  <th>USDT:USD</th>
                  <th>USDT:RUB</th>
                  <th>RUB:UAH</th>
                  <th>RUB:USD</th>
                  <th>RUB:USDT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-spacer-row"><td colSpan={17}></td></tr>
                {rates.map((row, rowIndex) => {
                  const isActive = activeRowId === row.id;

                  const renderEditable = (key) => {
                    let val = row[key];
                    if (typeof val === 'number') {
                      val = fmt(val);
                    } else if (val === undefined) {
                      val = '';
                    } else {
                      val = String(val);
                    }

                    return (
                      <td className="currency-rates-editable-cell">
                        {isActive ? (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(e, rowIndex, key)}
                            onClick={(e) => e.stopPropagation()}
                            className="currency-rates-editable-input"
                          />
                        ) : (
                          fmt(row[key])
                        )}
                      </td>
                    );
                  };

                  return (
                    <tr
                      key={row.id}
                      className={isActive ? 'row-active' : 'row-inactive'}
                      onClick={() => startEditRow(row.id)}
                    >
                      <td>{formatDisplayDate(row.ymd || row.date)}</td>
                      <td>{fmt(row.UAH)}</td>
                      
                      {renderEditable('USD')}
                      {renderEditable('RUB')}
                      
                      <td>{fmt(row.USDT)}</td>

                      <td>{fmt(row.UAH_RUB)}</td>
                      <td>{fmt(row.UAH_USD)}</td>
                      <td>{fmt(row.UAH_USDT)}</td>
                      <td>{fmt(row.USD_UAH)}</td>
                      
                      {renderEditable('USD_RUB')}
                      
                      <td>{fmt(row.USD_USDT)}</td>
                      <td>{fmt(row.USDT_UAH)}</td>
                      <td>{fmt(row.USDT_USD)}</td>
                      <td>{fmt(row.USDT_RUB)}</td>
                      <td>{fmt(row.RUB_UAH)}</td>
                      <td>{fmt(row.RUB_USD)}</td>
                      <td>{fmt(row.RUB_USDT)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <div style={{ padding: 12, opacity: 0.7 }}>Загрузка…</div>}
        </div>

        <Modal
          open={modal.open}
          title={modal.title}
          type={modal.type}
          onClose={() => setModal(m => ({ ...m, open: false }))}
          actions={modal.actions}
        >
          <p>{modal.message}</p>
        </Modal>
      </div>
    </div>
  );
}

export default CurrencyRates;