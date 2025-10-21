import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../Sidebar';
import Modal from '../AlertModal/Modal';
import '../../styles/CurrencyRates.css';
import { getRatesList, upsertRates } from '../../api/rates';
import PageHeaderIcon from '../HeaderIcon/PageHeaderIcon';

const PAGE_SIZE = 50;

/* ---------- utils ---------- */
const fmt = (v, digits = 4) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : Number(0).toFixed(digits);
};
const safeDiv = (a, b) => {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0) return 0;
  return x / y;
};
const calculateRates = (usdToUah, rubToUah) => {
  const C4 = 1;
  const D4 = parseFloat(usdToUah) || 0;
  const E4 = parseFloat(rubToUah) || 0;
  const F4 = D4; // USDT = USD

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
const getNum = (maybe, fallback) => {
  const n = Number(maybe);
  return Number.isFinite(n) ? n : fallback;
};
const getPureDateTimestamp = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const mapServerRows = (rows) =>
  rows
    .map((row) => {
      const ts  = getPureDateTimestamp(row.date || new Date());
      const USD = Number(row.USD ?? row.usd ?? 0);
      const RUB = Number(row.RUB ?? row.rub ?? 0);
      const UAH = Number(row.UAH ?? row.uah ?? 1);
      const calc = calculateRates(USD, RUB);
      return {
        id: String(ts),
        date: ts,
        UAH,
        USD,
        RUB,
        USDT: USD, // USDT = USD
        UAH_RUB:  getNum(row.UAH_RUB  ?? row.uah_rub,  calc.UAH_RUB),
        UAH_USD:  getNum(row.UAH_USD  ?? row.uah_usd,  calc.UAH_USD),
        UAH_USDT: getNum(row.UAH_USDT ?? row.uah_usdt, calc.UAH_USDT),
        USD_UAH:  getNum(row.USD_UAH  ?? row.usd_uah,  calc.USD_UAH),
        USD_RUB:  getNum(row.USD_RUB  ?? row.usd_rub,  calc.USD_RUB),
        USD_USDT: getNum(row.USD_USDT ?? row.usd_usdt, calc.USD_USDT),
        USDT_UAH: getNum(row.USDT_UAH ?? row.usdt_uah, calc.USDT_UAH),
        USDT_USD: getNum(row.USDT_USD ?? row.usdt_usd, calc.USDT_USD),
        USDT_RUB: getNum(row.USDT_RUB ?? row.usdt_rub, calc.USDT_RUB),
        RUB_UAH:  getNum(row.RUB_UAH  ?? row.rub_uah,  calc.RUB_UAH),
        RUB_USD:  getNum(row.RUB_USD  ?? row.rub_usd,  calc.RUB_USD),
        RUB_USDT: getNum(row.RUB_USDT ?? row.rub_usdt, calc.RUB_USDT),
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

/* ---------- component ---------- */
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
      const { mapped, total: t } = await fetchPage(1);
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

  const handleInputChange = (e, rowIndex, key) => {
    e.stopPropagation();
    const raw = e.target.value;
    const val = raw === '' ? '' : parseFloat(raw);

    setRates((prev) => {
      const arr = [...prev];
      const before = arr[rowIndex];

      const nextUSD = key === 'USD' ? (val === '' ? '' : Number(val)) : before.USD;
      const nextRUB = key === 'RUB' ? (val === '' ? '' : Number(val)) : before.RUB;

      const usdNum = nextUSD === '' ? 0 : nextUSD;
      const rubNum = nextRUB === '' ? 0 : nextRUB;

      const recalculated = { ...calculateRates(usdNum, rubNum) };
      arr[rowIndex] = { ...before, ...recalculated, USD: usdNum, RUB: rubNum };

      const base = initialRates.find(r => r.id === before.id);
      const changed =
        !base ||
        !isClose(arr[rowIndex].USD, base.USD) ||
        !isClose(arr[rowIndex].RUB, base.RUB) ||
        !isClose(arr[rowIndex].USDT, base.USDT);

      markDirty(before.id, changed);
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
        const b = baseById.get(r.id);
        if (!b) return true;
        return !isClose(r.USD, b.USD) || !isClose(r.RUB, b.RUB) || !isClose(r.USDT, b.USDT);
      });

      if (changed.length === 0) {
        setDirtyIds(new Set());
        return;
      }

      const payload = changed.map((row) => {
        const rec = calculateRates(row.USD, row.RUB);
        return {
          date: new Date(row.date).toISOString().slice(0, 10), // YYYY-MM-DD
          uah:  1.0,
          usd:  Number(row.USD),
          rub:  Number(row.RUB),
          usdt: Number(row.USD),

          uah_rub:  Number(rec.UAH_RUB),
          uah_usd:  Number(rec.UAH_USD),
          uah_usdt: Number(rec.UAH_USDT),

          usd_uah:  Number(rec.USD_UAH),
          usd_rub:  Number(rec.USD_RUB),
          usd_usdt: Number(rec.USD_USDT),

          usdt_uah: Number(rec.USDT_UAH),
          usdt_usd: Number(rec.USDT_USD),
          usdt_rub: Number(rec.USDT_RUB),

          rub_uah:  Number(rec.RUB_UAH),
          rub_usd:  Number(rec.RUB_USD),
          rub_usdt: Number(rec.RUB_USDT),
        };
      });

      await upsertRates(payload);
      setInitialRates(rates);
      setDirtyIds(new Set());
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
    const restored = initialRates.map(r => {
      const base = { ...r, USDT: r.USD };
      return { ...base, ...calculateRates(base.USD, base.RUB) };
    });
    setRates(restored);
    setDirtyIds(new Set());
    stopEditRow();
  };

  const handleRefresh = async () => {
    if (isDirty) {
      openModal('Есть несохранённые изменения', 'Перед обновлением списка сохраните или отмените изменения.', 'warning');
      return;
    }
    await initialLoad();
  };

  const shownCount = rates.length;

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
            {/* <span style={{ opacity: 0.8, fontSize: 12 }}>
              Показано {shownCount} из {total}
            </span>

            <button
              type="button"
              className="cancel-order-btn"
              onClick={handleRefresh}
              title="Обновить список с первой страницы"
            >
              Обновить
            </button> */}

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
          </div>
        </header>

        <div className="currency-rates-table-container">
          <div className="currency-rates-table-wrapper">
            <table className="currency-rates-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>UAH</th>
                  <th>USD ✎</th>
                  <th>RUB ✎</th>
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
                {rates.map((row, rowIndex) => {
                  const isActive = activeRowId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={isActive ? 'row-active' : 'row-inactive'}
                      onClick={() => startEditRow(row.id)}
                    >
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td>{fmt(row.UAH)}</td>

                      {/* USD editable */}
                      <td className="currency-rates-editable-cell">
                        {isActive ? (
                          <input
                            type="number"
                            step="0.01"
                            value={String(row.USD ?? '')}          // без toFixed
                            onChange={(e) => handleInputChange(e, rowIndex, 'USD')}
                            onClick={(e) => e.stopPropagation()}
                            className="currency-rates-editable-input"
                          />
                        ) : (
                          Number(row.USD).toFixed(2)
                        )}
                      </td>

                      {/* RUB editable */}
                      <td className="currency-rates-editable-cell">
                        {isActive ? (
                          <input
                            type="number"
                            step="0.01"
                            value={String(row.RUB ?? '')}          // без toFixed
                            onChange={(e) => handleInputChange(e, rowIndex, 'RUB')}
                            onClick={(e) => e.stopPropagation()}
                            className="currency-rates-editable-input"
                          />
                        ) : (
                          Number(row.RUB).toFixed(2)
                        )}
                      </td>

                      {/* USDT not editable = USD */}
                      <td>{fmt(row.USDT)}</td>

                      <td>{fmt(row.UAH_RUB)}</td>
                      <td>{fmt(row.UAH_USD)}</td>
                      <td>{fmt(row.UAH_USDT)}</td>
                      <td>{fmt(row.USD_UAH)}</td>
                      <td>{fmt(row.USD_RUB)}</td>
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

          {/* sentinel for infinite scroll */}
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
