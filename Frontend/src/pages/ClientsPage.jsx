// src/pages/ClientsPage.jsx
import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import Sidebar from "../components/Sidebar";
import ClientModal from "../components/Client/ClientModal/ClientModal";
import ClientsPageHeader from "../components/Client/ClientsPageHeader";
import "../styles/ClientsPage.css";
import { sampleClients } from "../data/sampleClients";
import { fetchClients, saveClient as saveClientApi } from "../api/clients";

const statusToEmojiMap = {
  "Лид": "🎯", "Изучаем ТЗ": "📄", "Обсуждаем с клиентом": "💬",
  "Клиент думает": "🤔", "Ожидаем предоплату": "💳", "Взяли в работу": "🚀",
  "Ведется разработка": "💻", "На уточнении у клиента": "📝", "Тестируем": "🧪",
  "Тестирует клиент": "👀", "На доработке": "🔧", "Ожидаем оплату": "💸",
  "Успешно завершен": "🏆", "Закрыт": "🏁", "Неудачно завершён": "❌", "Удаленные": "🗑️"
};

const STORAGE_KEY = "clientsTableWidths";
const MIN_W = 24;

/* ====== UI helpers ====== */
function TagsCell({ tags = [] }) {
  if (!tags.length) return <span className="ellipsis">—</span>;
  const visible = tags.slice(0, 2);
  const rest = tags.length - visible.length;

  return (
    <div className="tags-cell" title={tags.map((t) => t.name).join(", ")}>
      {visible.map((t) => (
        <span
          key={`${t.name}-${t.color || "nc"}`}
          className="tag-chip"
          style={{
            background: t.color || "var(--chips-bg)",
            color: t.textColor || "var(--chips-text)",
          }}
          title={t.name}
        >
          {t.name}
        </span>
      ))}
      {rest > 0 && <span className="more-chip">+{rest}</span>}
    </div>
  );
}

const STATUS_MAP = {
  active: { text: "Активен", cls: "status--active" },
  inactive: { text: "Неактивен", cls: "status--inactive" },
  paused: { text: "Пауза", cls: "status--paused" },
  prospect: { text: "Потенциальный", cls: "status--prospect" },
  lead: { text: "Лид", cls: "status--lead" },
  blacklist: { text: "Блэклист", cls: "status--blacklist" },
};
function StatusPill({ value }) {
  if (!value) return <span className="ellipsis">—</span>;
  const key = String(value).toLowerCase();
  const m = STATUS_MAP[key] || { text: value, cls: "status--neutral" };
  return (
    <span className={`status-pill ${m.cls}`} title={value}>
      {m.text}
    </span>
  );
}

const Ellipsis = ({ value }) => {
  const text = Array.isArray(value)
    ? value.map((t) => t.name).join(", ")
    : String(value ?? "—");
  return (
    <span className="ellipsis" title={text}>
      {text}
    </span>
  );
};

export default function ClientsPage({
  
  clients = sampleClients,
  onSaveClient, 
  onAddCompany = () => {},
  companies = [],
  employees = [],
  referrers = [],
  countries = [],
  currencies = [],
}) {
  /* === фильтры === */
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState([]); 
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* === загрузка данных === */
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchClients();
        if (!mounted) return;
        setList(Array.isArray(data) && data.length ? data : clients);
      } catch (e) {
        console.error("fetchClients failed:", e);
        if (mounted) setList(clients); 
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    
  }, []); 

  const latestOrderStatusMap = useMemo(() => {
    const statusMap = new Map();
    const clientOrders = new Map(); 
    
   
    const ordersJson = localStorage.getItem('ordersData'); 
    let ordersData = []; 

    if (ordersJson) {
      try {
       
        ordersData = JSON.parse(ordersJson);
      } catch (error) {
        console.error("Ошибка парсинга заказов из localStorage:", error);
      }
    }
    
    


    
    for (const order of ordersData) {
      const clientIdNum = parseInt(order.order_client, 10);
      if (isNaN(clientIdNum)) continue;

      if (!clientOrders.has(clientIdNum)) {
        clientOrders.set(clientIdNum, []);
      }
      clientOrders.get(clientIdNum).push(order);
    }

    
    for (const [clientId, orders] of clientOrders.entries()) {
      if (orders.length === 0) continue;

      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.orderDate);
        const dateB = new Date(b.orderDate);
        
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });

      const latestOrder = sortedOrders[0];
      if (latestOrder && latestOrder.stage) {
        statusMap.set(clientId, latestOrder.stage);
      }
    }

    return statusMap;
  }, []);
  /* === фильтрация === */
  const filteredRows = useMemo(() => {
    return (list || [])
      .filter((c) => {
        if (!search) return true;
        const parts = [
          c.name,
          ...(c.tags || []).map((t) => t.name),
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
          ...(c.credentials || []).flatMap((cr) => [cr.login, cr.description]),
        ];
        const text = parts.join(" ").toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .filter((c) => !currencyFilter || c.currency === currencyFilter)
      .filter((c) => !statusFilter || c.status === statusFilter)
      .filter(
        (c) =>
          !tagFilter.length ||
          (c.tags || []).some((t) => tagFilter.includes(t.name))
      )
      .filter((c) => !sourceFilter || c.source === sourceFilter)
      .filter((c) => {
        if (
          dateFrom &&
          c.last_order_date !== "—" &&
          new Date(c.last_order_date) < new Date(dateFrom)
        )
          return false;
        if (
          dateTo &&
          c.last_order_date !== "—" &&
          new Date(c.last_order_date) > new Date(dateTo)
        )
          return false;
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
    dateTo,
  ]);

  /* === опции селектов === */
  const currencyOptions = useMemo(
    () =>
      currencies.length
        ? currencies
        : Array.from(new Set(list.map((c) => c.currency))).filter(Boolean),
    [currencies, list]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(list.map((c) => c.status))).filter(Boolean),
    [list]
  );
  const tagOptions = useMemo(
    () =>
      Array.from(
        new Set(list.flatMap((c) => (c.tags || []).map((t) => t.name)))
      ).filter(Boolean),
    [list]
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(list.map((c) => c.source))).filter(Boolean),
    [list]
  );

  /* === заголовки и ширины === */
  const headers = [
    "Клиент",
    "Теги",
    "Вводное описание",
    "Источник",
    "ФИО",
    "Страна",
    "Валюта",
    "В час",
    "Доля %",
    "Реферер",
    "Реферер первый",
    "Статус",
    "Дата посл. зак.",
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
    if (colWidths.every((w) => w == null) && wrapRef.current) {
      const total = wrapRef.current.clientWidth || 1200;
      const w = Math.floor(total / COLS);
      setColWidths(Array(COLS).fill(w));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapRef, COLS]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths));
  }, [colWidths]);

  /* === лог по credential логинам у отфильтрованных (для отладки) === */
  useEffect(() => {
    const logins = filteredRows.flatMap((c) =>
      (c.credentials || []).map((cr) => cr.login)
    );
    console.log("Filtered credentials logins:", logins);
  }, [filteredRows]);

  /* === модалка/редактирование === */
  const [showModal, setShow] = useState(false);
  const [active, setActive] = useState(null);
  const [expanded, setExp] = useState({ 1: true, 2: true, 3: true });

  const idMap = useMemo(() => new Map(list.map((c) => [c.id, c])), [list]);

  const openEdit = (c) => {
    setActive(c);
    setShow(true);
  };
  const openRef = (id, e) => {
    e.stopPropagation();
    const r = idMap.get(id);
    r && openEdit(r);
  };

  const save = async (data) => {
    try {
      const saved = await saveClientApi(data);
      setList((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      setShow(false);
    } catch (e) {
      console.error("saveClient failed:", e);
      // тут можно показать тост/модалку
    }
  };

  const onDown = (i, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[i];
    const move = (ev) => {
      const next = Math.max(startW + (ev.clientX - startX), MIN_W);
      setColWidths((prev) => {
        const arr = [...prev];
        arr[i] = next;
        return arr;
      });
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const groups = { 1: "Партнёры", 2: "Наши клиенты", 3: "По ситуации" };

   const formatDate = (dateString) => {
    
    if (!dateString) return null; 

    const date = new Date(dateString);

    
    if (isNaN(date.getTime())) {
      return null;
    }

    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="clients-layout">
      <Sidebar />
      <div className="clients-page">
        <ClientsPageHeader
          onAdd={() => {
            setActive(null);
            setShow(true);
          }}
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
    

        <div ref={wrapRef} className="clients-table-wrapper">
          {loading ? (
            <div className="table-loader">Загрузка…</div>
          ) : (
            <table className="clients-table">
              <thead className="fixed-task-panel">
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={h}
                    >
                      {h}
                      <span
                        className="resizer"
                        onMouseDown={(e) => onDown(i, e)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.entries(groups).map(([gid, gname]) => (
                  <React.Fragment key={gid}>
                    <tr
                      className="group-header" 
                      onClick={() =>
                        setExp((p) => ({ ...p, [gid]: !p[gid] }))
                      }
                    >
                      <td colSpan={COLS}>
                       
                        <span className={`collapse-icon ${!expanded[gid] ? "collapsed" : ""}`}>
                          ▼
                        </span>
                        
                        {gname.toUpperCase()}
                        
                        <span className="group-count">
                          {
                            filteredRows.filter(
                              (c) => String(c.group) === gid
                            ).length
                          }
                        </span>
                      </td>
                    </tr>

                    {expanded[gid] &&
                      filteredRows
                        .filter((c) => String(c.group) === gid)
                        .map((c) => (
                          <tr key={c.id} onClick={() => openEdit(c)}>
                            <td>
                              <Ellipsis value={c.name} />
                            </td>
                            <td>
                              <TagsCell tags={c.tags} />
                            </td>
                            <td>
                              <Ellipsis value={c.intro_description} />
                            </td>
                            <td>
                              <Ellipsis value={c.source} />
                            </td>
                            <td>
                              <Ellipsis value={c.full_name} />
                            </td>
                            <td>
                              <Ellipsis value={c.country} />
                            </td>
                            <td>
                              <Ellipsis value={c.currency} />
                            </td>
                            <td className="num">
                              {c.hourly_rate ?? "—"}
                            </td>
                            <td className="num">
                              {c.percent ?? "—"}
                            </td>
                            <td
                              className="ref-cell"
                            
                              onClick={(e) => openRef(c.referrer_id, e)}
                            >
                              <Ellipsis value={c.referrer_name} />
                            </td>
                            <td
                              className="ref-cell"
                              onClick={(e) => openRef(c.referrer_first_id, e)}
                            >
                              <Ellipsis value={c.referrer_first_name} />
                            </td>
                            {(() => {
                              const latestStatus = latestOrderStatusMap.get(c.id);
                              const emoji = statusToEmojiMap[latestStatus] || '—';
                              
                              return (
                                <td 
                                  title={latestStatus || 'Нет заказов'} 
                                  style={{ textAlign: 'center', fontSize: '1.3em', cursor: 'default' }}
                                >
                                  {emoji}
                                </td>
                              );
                            })()}
                            <td>
                              <Ellipsis value={formatDate(c.last_order_date || "")} />
                            </td>
                          </tr>
                        ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredRows.length === 0 && (
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
