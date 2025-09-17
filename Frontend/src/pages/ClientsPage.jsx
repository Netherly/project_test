// src/pages/ClientsPage.jsx

import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react';
import Sidebar from '../components/Sidebar';
import ClientModal from '../components/Client/ClientModal/ClientModal';
import ClientsPageHeader from '../components/Client/ClientsPageHeader';
import '../styles/ClientsPage.css';
import { sampleClients } from '../data/sampleClients';

const STORAGE_KEY = 'clientsTableWidths';
const MIN_W = 24;

export default function ClientsPage({
  clients = sampleClients,
  onSaveClient = async c => c,
  onAddCompany = () => {},
  companies = [],
  employees = [],
  referrers = [],
  countries = [],
  currencies = []
}) {
  /* === состояния фильтров === */
  const [search, setSearch]                 = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [tagFilter, setTagFilter]           = useState([]);    // массив выбранных тегов
  const [sourceFilter, setSourceFilter]     = useState('');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');

  /* список клиентов */
  const [list, setList] = useState(clients);

  /* === фильтрация строк === */
  const filteredRows = useMemo(() => {
    return list
      // глобальный поиск по всем полям + по login/description в credentials
      .filter(c => {
        if (!search) return true;
        const parts = [
          c.name,
          ...(c.tags || []).map(t => t.name),
          c.note,
          c.intro_description,
          c.source,
          c.full_name,
          c.country,
          c.currency,
          String(c.hourly_rate),
          String(c.percent),
          c.referrer_name,
          c.referrer_first_name,
          c.status,
          c.last_order_date,
          ...(c.credentials || []).flatMap(cr => [cr.login, cr.description])
        ];
        const text = parts.join(' ').toLowerCase();
        return text.includes(search.toLowerCase());
      })
      // фильтр по валюте
      .filter(c => !currencyFilter || c.currency === currencyFilter)
      // фильтр по статусу
      .filter(c => !statusFilter   || c.status === statusFilter)
      // фильтр по тегам (любое совпадение)
      .filter(c =>
        !tagFilter.length ||
        (c.tags || []).some(t => tagFilter.includes(t.name))
      )
      // фильтр по источнику
      .filter(c => !sourceFilter || c.source === sourceFilter)
      // фильтр по дате
      .filter(c => {
        if (dateFrom && c.last_order_date !== '—' && new Date(c.last_order_date) < new Date(dateFrom)) return false;
        if (dateTo   && c.last_order_date !== '—' && new Date(c.last_order_date) > new Date(dateTo)) return false;
        return true;
      });
  }, [
    list,
    search,
    currencyFilter,
    statusFilter,
    tagFilter,
    sourceFilter,
    dateFrom,
    dateTo
  ]);

  /* === опции для селектов === */
  const currencyOptions = useMemo(
    () => currencies.length
      ? currencies
      : Array.from(new Set(list.map(c => c.currency))).filter(Boolean),
    [currencies, list]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(list.map(c => c.status))).filter(Boolean),
    [list]
  );
  const tagOptions = useMemo(
    () =>
      Array.from(
        new Set(list.flatMap(c => (c.tags || []).map(t => t.name)))
      ).filter(Boolean),
    [list]
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(list.map(c => c.source))).filter(Boolean),
    [list]
  );

  /* === загрузка/сохранение ширин колонок === */
  const headers = [
    'Клиент','Теги','Примечание','Вводное описание','Источник','ФИО','Страна',
    'Валюта','в час','Доля %','Реферер','Реферер перв.','Статус','Дата последнего заказа'
  ];
  const COLS = headers.length;
  const load = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(arr) && arr.length === COLS
        ? arr
        : Array(COLS).fill(null);
    } catch {
      return Array(COLS).fill(null);
    }
  };
  const [colWidths, setColWidths] = useState(load);
  const wrapRef = useRef(null);

  useLayoutEffect(() => {
    if (colWidths.every(w => w == null) && wrapRef.current) {
      const total = wrapRef.current.clientWidth || 1200;
      const w = Math.floor(total / COLS);
      setColWidths(Array(COLS).fill(w));
    }
  }, [wrapRef, colWidths]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths));
  }, [colWidths]);
useEffect(() => {
    const logins = filteredRows.flatMap(c =>
      (c.credentials || []).map(cr => cr.login)
    );
    console.log('Filtered credentials logins:', logins);
  }, [filteredRows]);

  /* === прочие состояния и функции === */
  const [showModal, setShow]   = useState(false);
  const [active, setActive]    = useState(null);
  const [expanded, setExp]     = useState({1:true,2:true,3:true});

  const ellipsis = v => (
    <span
      className="ellipsis"
      title={
        Array.isArray(v)
          ? v.map(t => t.name).join(', ')
          : String(v ?? '')
      }
    >
      {Array.isArray(v)
        ? (v.length > 2
            ? `${v.slice(0,2).map(t => t.name).join(', ')}, +${v.length-2}`
            : v.map(t => t.name).join(', '))
        : v}
    </span>
  );
  const idMap = useMemo(() => new Map(list.map(c => [c.id, c])), [list]);

  const openEdit = c => { setActive(c); setShow(true); };
  const openRef  = (id, e) => {
    e.stopPropagation();
    const r = idMap.get(id);
    r && openEdit(r);
  };
  const save     = async data => {
    const s = await onSaveClient(data);
    setList(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = s;
        return copy;
      }
      return [s, ...prev];
    });
    setShow(false);
  };

  const onDown = (i, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[i];
    const move = ev => {
      const next = Math.max(startW + (ev.clientX - startX), MIN_W);
      setColWidths(prev => {
        const arr = [...prev];
        arr[i] = next;
        return arr;
      });
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const groups = {1:'Партнёры',2:'Наши клиенты',3:'По ситуации'};

  return (
    <div className="clients-layout">
      <Sidebar/>
      <div className="clients-page">
        {/* шапка с поиском, фильтрами и статистикой */}
        <ClientsPageHeader
          onAdd={() => { setActive(null); setShow(true); }}
          onSearch={setSearch}
          total={filteredRows.length}
          currencyOptions={currencyOptions}
          statusOptions={statusOptions}
          tagOptions={tagOptions}
          sourceOptions={sourceOptions}
          onFilterChange={({ currency, status, tags, source, dateFrom, dateTo }) => {
            setCurrencyFilter(currency);
            setStatusFilter(status);
            setTagFilter(tags);
            setSourceFilter(source);
            setDateFrom(dateFrom);
            setDateTo(dateTo);
          }}
        />

        {/* таблица */}
        <div ref={wrapRef} className="clients-table-wrapper">
          <table className="clients-table">
            <thead className="fixed-task-panel">
              <tr>
                {headers.map((h, i) => (
                  <th key={h} style={{ position: 'relative', width: colWidths[i] }}>
                    {h}
                    <span className="resizer" onMouseDown={e => onDown(i, e)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([gid, gname]) => (
                <React.Fragment key={gid}>
                  <tr
                    className="group-row"
                    onClick={() => setExp(p => ({ ...p, [gid]: !p[gid] }))}
                  >
                    <td colSpan={COLS}>
                      {expanded[gid] ? '▼' : '▶'} {gid}. {gname}{' '}
                      <span className="group-count">
                        {filteredRows.filter(c => String(c.group) === gid).length}
                      </span>
                    </td>
                  </tr>
                  {expanded[gid] &&
                    filteredRows
                      .filter(c => String(c.group) === gid)
                      .map(c => (
                        <tr key={c.id} onClick={() => openEdit(c)}>
                          <td style={{ width: colWidths[0] }}>{c.name}</td>
                          <td style={{ width: colWidths[1] }}>{ellipsis(c.tags)}</td>
                          <td style={{ width: colWidths[2] }}>{ellipsis(c.note)}</td>
                          <td style={{ width: colWidths[3] }}>{ellipsis(c.intro_description)}</td>
                          <td style={{ width: colWidths[4] }}>{ellipsis(c.source)}</td>
                          <td style={{ width: colWidths[5] }}>{ellipsis(c.full_name)}</td>
                          <td style={{ width: colWidths[6] }}>{ellipsis(c.country)}</td>
                          <td style={{ width: colWidths[7] }}>{ellipsis(c.currency)}</td>
                          <td style={{ width: colWidths[8] }}>{c.hourly_rate}</td>
                          <td style={{ width: colWidths[9] }}>{c.percent}</td>
                          <td
                            className="ref-cell"
                            style={{ width: colWidths[10] }}
                            onClick={e => openRef(c.referrer_id, e)}
                          >
                            {ellipsis(c.referrer_name)}
                          </td>
                          <td
                            className="ref-cell"
                            style={{ width: colWidths[11] }}
                            onClick={e => openRef(c.referrer_first_id, e)}
                          >
                            {ellipsis(c.referrer_first_name)}
                          </td>
                          <td style={{ width: colWidths[12] }}>{ellipsis(c.status)}</td>
                          <td style={{ width: colWidths[13] }}>{ellipsis(c.last_order_date)}</td>
                        </tr>
                      ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="empty-state">Клиенты не найдены</div>
        )}

        {showModal && (
          <ClientModal
            client={active}
            companies={companies}
            employees={employees}
            referrers={referrers}
            countries={countries}
            currencies={currencies}
            onClose={() => setShow(false)}
            onSave={save}
            onAddCompany={onAddCompany}
          />
        )}
      </div>
    </div>
  );
}
