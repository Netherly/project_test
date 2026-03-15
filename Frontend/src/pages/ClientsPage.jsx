import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ClientsPageHeader from "../components/Client/ClientsPageHeader";
import NoAccessState from "../components/ui/NoAccessState";
import { useFields } from "../context/FieldsContext";
import "../styles/ClientsPage.css";
import {
  fetchClients,
  saveClient as saveClientApi,
  deleteClient as deleteClientApi,
} from "../api/clients";
import { fetchEmployees } from "../api/employees";
import { fetchCompanies, createCompany as createCompanyApi } from "../api/companies";
import { isForbiddenError } from "../utils/isForbiddenError";
import {
  CACHE_TTL,
  hasDataChanged,
  readCacheSnapshot,
  writeCachedValue,
} from "../utils/resourceCache";


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
  "Удаленные": "🗑️",
};

const STORAGE_KEY = "clientsTableWidths";
const MIN_W = 24;

function TagsCell({ tags = [] }) {
  if (!tags.length) return <span className="ellipsis">—</span>;
  const visible = tags.slice(0, 2);
  const rest = tags.length - visible.length;

  return (
    <div className="tags-cell" title={tags.map((t) => t?.name ?? t).join(", ")}>
      {visible.map((t) => (
        <span
          key={`${t?.name ?? t}-${t?.color || "nc"}`}
          className="tag-chip"
          style={{
            background: t?.color || "var(--chips-bg)",
            color: t?.textColor || "var(--chips-text)",
          }}
          title={t?.name ?? String(t)}
        >
          {t?.name ?? String(t)}
        </span>
      ))}
      {rest > 0 && <span className="more-chip">+{rest}</span>}
    </div>
  );
}

const Ellipsis = ({ value }) => {
  let text;

  if (Array.isArray(value)) {
    text = value
      .map((t) => (t && typeof t === "object" ? t.name ?? JSON.stringify(t) : String(t)))
      .join(", ");
  } else if (value && typeof value === "object") {
    text = value.name || JSON.stringify(value);
  } else {
    text = String(value ?? "—");
  }

  return (
    <span className="ellipsis" title={text}>
      {text}
    </span>
  );
};

const normalizeStr = (value) => String(value ?? "").trim();
const uniqueList = (arr) => Array.from(new Set(arr));
const CLIENT_FILTER_DEFAULTS = {
  query: "",
  currency: "",
  status: "",
  tags: [],
  source: "",
  category: "",
  country: "",
  share: "",
  dateFrom: "",
  dateTo: "",
};

const parseClientFiltersFromUrl = (searchParams) => ({
  query: searchParams.get("q") || "",
  currency: searchParams.get("currency") || "",
  status: searchParams.get("status") || "",
  tags: (searchParams.get("tags") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  source: searchParams.get("source") || "",
  category: searchParams.get("category") || "",
  country: searchParams.get("country") || "",
  share: searchParams.get("share") || "",
  dateFrom: searchParams.get("dateFrom") || "",
  dateTo: searchParams.get("dateTo") || "",
});

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clientCountries = [], currencies = [], clientCategories = [], clientSources = [] } = useFields();
  const appliedFilters = useMemo(
    () => parseClientFiltersFromUrl(searchParams),
    [searchParams]
  );

  /* === загрузка данных === */
  const [loading, setLoading] = useState(
    () => !readCacheSnapshot("clientsData", { fallback: [] }).hasData
  );
  const [list, setList] = useState(
    () => readCacheSnapshot("clientsData", { fallback: [] }).data || []
  );
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [companiesList, setCompaniesList] = useState(
    () => readCacheSnapshot("companiesData", { fallback: [] }).data || []
  );
  const [employeesList, setEmployeesList] = useState(() => {
    const cachedEmployees = readCacheSnapshot("employees", { fallback: [] }).data || [];
    return Array.isArray(cachedEmployees)
      ? cachedEmployees.map((e) => ({
          id: e.id,
          full_name: e.fullName ?? e.full_name ?? "",
        }))
      : [];
  });

  
  const referrerOptions = useMemo(() => {
    const items = [];
    const seen = new Set();
    const addItem = (id, name, label) => {
      if (!id || !name) return;
      const key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ id: key, name, label });
    };

    employeesList.forEach((e) => {
      const name = e?.full_name || e?.fullName || "";
      addItem(e?.id, name, name ? `${name} (сотрудник)` : "");
    });

    list.forEach((c) => {
      const name = c?.name || c?.full_name || "";
      addItem(c?.id, name, name ? `${name} (клиент)` : "");
    });

    return items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [employeesList, list]);

  const referrerById = useMemo(
    () => new Map(referrerOptions.map((r) => [String(r.id), r.name])),
    [referrerOptions]
  );

  const withReferrerNames = (client) => {
    if (!client || !referrerById.size) return client;
    const refId = client.referrer_id != null ? String(client.referrer_id) : "";
    const refFirstId =
      client.referrer_first_id != null ? String(client.referrer_first_id) : "";
    return {
      ...client,
      referrer_name: client.referrer_name || referrerById.get(refId) || "",
      referrer_first_name:
        client.referrer_first_name || referrerById.get(refFirstId) || "",
    };
  };

  useEffect(() => {
    let mounted = true;
    const snapshot = readCacheSnapshot("employees", {
      fallback: [],
      ttlMs: CACHE_TTL.lists,
    });

    if (snapshot.hasData) {
      const normalized = Array.isArray(snapshot.data)
        ? snapshot.data.map((e) => ({
            id: e.id,
            full_name: e.fullName ?? e.full_name ?? "",
          }))
        : [];
      setEmployeesList((prev) => (hasDataChanged(prev, normalized) ? normalized : prev));
      if (snapshot.isFresh) {
        return () => {
          mounted = false;
        };
      }
    }

    (async () => {
      try {
        const data = await fetchEmployees();
        if (!mounted) return;
        writeCachedValue("employees", Array.isArray(data) ? data : []);
        const normalized = Array.isArray(data)
          ? data.map((e) => ({
              id: e.id,
              full_name: e.fullName ?? e.full_name ?? "",
            }))
          : [];
        setEmployeesList((prev) => (hasDataChanged(prev, normalized) ? normalized : prev));
      } catch (e) {
        console.error("fetchEmployees failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const snapshot = readCacheSnapshot("companiesData", {
      fallback: [],
      ttlMs: CACHE_TTL.companies,
    });

    if (snapshot.hasData) {
      const cachedCompanies = Array.isArray(snapshot.data) ? snapshot.data : [];
      setCompaniesList((prev) =>
        hasDataChanged(prev, cachedCompanies) ? cachedCompanies : prev
      );
      if (snapshot.isFresh) {
        return () => {
          mounted = false;
        };
      }
    }

    (async () => {
      try {
        const data = await fetchCompanies();
        if (!mounted) return;
        const nextCompanies = Array.isArray(data) ? data : [];
        writeCachedValue("companiesData", nextCompanies);
        setCompaniesList((prev) =>
          hasDataChanged(prev, nextCompanies) ? nextCompanies : prev
        );
      } catch (e) {
        console.error("fetchCompanies failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const snapshot = readCacheSnapshot("clientsData", {
      fallback: [],
      ttlMs: CACHE_TTL.lists,
    });

    if (snapshot.hasData) {
      const cachedClients = Array.isArray(snapshot.data) ? snapshot.data : [];
      setList((prev) => (hasDataChanged(prev, cachedClients) ? cachedClients : prev));
      setLoading(false);
      if (snapshot.isFresh) {
        setError("");
        setForbidden(false);
        return () => {
          mounted = false;
        };
      }
    }

    (async () => {
      if (!snapshot.hasData) {
        setLoading(true);
      }
      setError("");
      setForbidden(false);
      try {
        const data = await fetchClients();
        if (!mounted) return;
        const nextClients = Array.isArray(data) ? data : [];
        writeCachedValue("clientsData", nextClients);
        setList((prev) => (hasDataChanged(prev, nextClients) ? nextClients : prev));
      } catch (e) {
        console.error("fetchClients failed:", e);
        if (mounted) {
          if (isForbiddenError(e)) {
            setForbidden(true);
            setError("");
          } else {
            setError(e?.message || "Не удалось загрузить клиентов");
          }
          if (!snapshot.hasData) {
            setList([]);
          }
        }
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

    const ordersJson = localStorage.getItem("ordersData");
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
      if (!clientOrders.has(clientIdNum)) clientOrders.set(clientIdNum, []);
      clientOrders.get(clientIdNum).push(order);
    }

    for (const [clientId, orders] of clientOrders.entries()) {
      if (!orders.length) continue;
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

  const filteredRows = useMemo(() => {
    const {
      query,
      currency,
      status,
      tags,
      source,
      category,
      country,
      share,
      dateFrom,
      dateTo,
    } = appliedFilters;

    return (list || [])
      .filter((c) => {
        if (!query) return true;
        const parts = [
          c.name,
          ...(c.tags || []).map((t) => t.name),
          c.note,
          c.intro_description,
          c.source?.name || c.source,
          c.category?.name || c.category,
          c.full_name,
          c.country?.name || c.country,
          c.currency?.name || c.currency,
          String(c.hourly_rate),
          String(c.percent),
          c.referrer_name,
          c.referrer_first_name,
          c.status,
          c.last_order_date,
          ...(c.credentials || []).flatMap((cr) => [cr.login, cr.description]),
        ];
        const text = parts.join(" ").toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .filter((c) => {
        const curName = c.currency?.name || c.currency;
        return !currency || curName === currency;
      })
      .filter((c) => {
        const clientStatus = c.status?.name || c.status;
        return !status || clientStatus === status;
      })
      .filter(
        (c) =>
          !tags.length ||
          (c.tags || []).some((t) => tags.includes(t.name))
      )
      .filter((c) => {
        const srcName = c.source?.name || c.source;
        return !source || srcName === source;
      })
      .filter((c) => {
        const catName = c.category?.name || c.category;
        return !category || catName === category;
      })
      .filter((c) => {
        const countryName = c.country?.name || c.country;
        return !country || countryName === country;
      })
      .filter((c) => {
        if (!share) return true;
        const hasShare = c.share_info === true || c.share_info === "true";
        return share === "yes" ? hasShare : !hasShare;
      })
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
    appliedFilters,
  ]);

  const currencyOptions = useMemo(
    () => {
      if (Array.isArray(currencies) && currencies.length > 0) {
        return currencies.map(c => 
          typeof c === 'string' ? c : (c?.name || c?.code || String(c))
        ).filter(Boolean);
      }
      return Array.from(new Set(list.map((c) => c.currency?.name || c.currency))).filter(Boolean);
    },
    [currencies, list]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(list.map((c) => c.status))).filter(Boolean),
    [list]
  );
  const tagOptions = useMemo(
    () =>
      Array.from(new Set(list.flatMap((c) => (c.tags || []).map((t) => t.name)))).filter(Boolean),
    [list]
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(list.map((c) => c.source?.name || c.source))).filter(Boolean),
    [list]
  );
  const categoryOptions = useMemo(
    () => (clientCategories.length ? clientCategories : []),
    [clientCategories]
  );
  const countryOptions = useMemo(
    () => (clientCountries.length ? clientCountries : []),
    [clientCountries]
  );

  const headers = [
    "Клиент",
    "Теги",
    "Вводное описание",
    "Категория",
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
      return Array.isArray(arr) && arr.length === COLS ? arr : Array(COLS).fill(null);
    } catch {
      return Array(COLS).fill(null);
    }
  };
  const [colWidths, setColWidths] = useState(load);
  const wrapRef = useRef(null);

  
  useLayoutEffect(() => {
    if (wrapRef.current && colWidths.every((w) => w == null)) {
      const total = wrapRef.current.clientWidth || 1200;
      const w = Math.floor(total / COLS);
      setColWidths(Array(COLS).fill(w));
    }
  }, [COLS]); 

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths));
  }, [colWidths]);

  const [showModal, setShow] = useState(false);
  const [active, setActive] = useState(null);
  const [expanded, setExp] = useState({});
  const idMap = useMemo(() => new Map(list.map((c) => [c.id, c])), [list]);
  const currentSearch = searchParams.toString();

  const openEdit = (c) => {
    if (c?.id) {
      navigate({
        pathname: `/clients/${c.id}`,
        search: currentSearch,
      });
    } else {
      navigate({
        pathname: "/clients/new",
        search: currentSearch,
      });
    }
  };

  const openRef = (id, e) => {
    e.stopPropagation();
    const r = idMap.get(id);
    if (r) openEdit(r);
  };

  const updateUrlFilters = ({
    query = "",
    currency = "",
    status = "",
    tags = [],
    source = "",
    category = "",
    country = "",
    share = "",
    dateFrom = "",
    dateTo = "",
  }) => {
    const params = new URLSearchParams(searchParams);
    const nextValues = {
      q: String(query || "").trim(),
      currency: String(currency || "").trim(),
      status: String(status || "").trim(),
      tags: Array.isArray(tags) ? tags.filter(Boolean).join(",") : "",
      source: String(source || "").trim(),
      category: String(category || "").trim(),
      country: String(country || "").trim(),
      share: String(share || "").trim(),
      dateFrom: String(dateFrom || "").trim(),
      dateTo: String(dateTo || "").trim(),
    };

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const save = async (data) => {
    try {
      setError("");
      const saved = withReferrerNames(await saveClientApi(data));
      setList((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = saved;
          writeCachedValue("clientsData", copy);
          return copy;
        }
        const next = [saved, ...prev];
        writeCachedValue("clientsData", next);
        return next;
      });
      return saved;
    } catch (e) {
      console.error("saveClient failed:", e);
      setError(e?.message || "Не удалось сохранить клиента");
      throw e;
    }
  };

  const addCompany = async (payload) => {
    const created = await createCompanyApi(payload);
    setCompaniesList((prev) => {
      const next = [...prev, created];
      next.sort((a, b) => String(a.name).localeCompare(String(b.name), "ru"));
      writeCachedValue("companiesData", next);
      return next;
    });
    return created;
  };

  const remove = async (id) => {
    try {
      setError("");
      await deleteClientApi(id);
      setList((prev) => {
        const next = prev.filter((c) => c.id !== id);
        writeCachedValue("clientsData", next);
        return next;
      });
    } catch (e) {
      console.error("deleteClient failed:", e);
      setError(e?.message || "Не удалось удалить клиента");
      throw e;
    }
  };

  const onDown = (i, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[i] ?? 0;
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

  
  const normalizeCategoryName = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    return String(value?.name ?? value?.value ?? "").trim();
  };

  const groupedClients = useMemo(() => {
    const buckets = new Map();

    const ensureBucket = (key, name) => {
      const existing = buckets.get(key);
      if (existing) return existing;
      const created = { key, name, clients: [] };
      buckets.set(key, created);
      return created;
    };

    (clientCategories || [])
      .map(normalizeCategoryName)
      .filter(Boolean)
      .forEach((name) => {
        ensureBucket(`cat:${name.toLowerCase()}`, name);
      });

    (filteredRows || []).forEach((client) => {
      const rawName = normalizeCategoryName(client?.category?.name || client?.category);
      const name = rawName || "Без категории";
      const key = rawName ? `cat:${rawName.toLowerCase()}` : "cat:uncategorized";
      ensureBucket(key, name).clients.push(client);
    });

    const items = Array.from(buckets.values()).map((item) => ({
      ...item,
      count: item.clients.length,
    }));
    items.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
    return items;
  }, [filteredRows, clientCategories]);

  useEffect(() => {
    if (!groupedClients.length) return;
    setExp((prev) => {
      const next = { ...prev };
      let changed = false;
      groupedClients.forEach((g) => {
        if (!(g.key in next)) {
          next[g.key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [groupedClients]);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="clients-layout">
      <Sidebar />
      <div className="clients-page">
        <ClientsPageHeader
          onAdd={() => {
            navigate({
              pathname: "/clients/new",
              search: currentSearch,
            });
          }}
          onSearch={(query, nextFilters = appliedFilters) => {
            updateUrlFilters({
              ...CLIENT_FILTER_DEFAULTS,
              ...nextFilters,
              query,
            });
          }}
          queryValue={appliedFilters.query}
          total={filteredRows.length}
          addDisabled={forbidden}
          addLabel={forbidden ? "Нет доступа" : "Добавить"}
          hideAddIcon={forbidden}
          currencyOptions={currencyOptions}
          statusOptions={statusOptions}
          tagOptions={tagOptions}
          sourceOptions={sourceOptions}
          categoryOptions={categoryOptions}
          countryOptions={countryOptions}
          filtersValue={appliedFilters}
        />

        {forbidden && !loading ? (
          <NoAccessState
            title='Нет доступа к разделу "Клиенты"'
            description="У вашей учетной записи недостаточно прав для просмотра списка клиентов."
            note="Если доступ нужен, обратитесь к администратору."
          />
        ) : (
          <div ref={wrapRef} className="clients-table-wrapper custom-scrollbar">
            {loading ? (
              <div className="table-loader">Загрузка…</div>
            ) : (
            <table className="clients-table">
              <thead className="fixed-task-panel">
                <tr>
                  {headers.map((h, i) => (
                    <th key={h} style={{ width: colWidths[i] ?? undefined }}>
                      {h}
                      <span className="resizer" onMouseDown={(e) => onDown(i, e)} />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {groupedClients.map((group) => {
                  const isOpen = expanded[group.key] !== false;
                  return (
                    <React.Fragment key={group.key}>
                      <tr
                        className="group-header"
                        onClick={() => setExp((p) => ({ ...p, [group.key]: !isOpen }))}
                      >
                        <td colSpan={COLS}>
                          <span className={`collapse-icon ${!isOpen ? "collapsed" : ""}`}>▼</span>
                          {String(group.name || "Без категории").toUpperCase()}
                          <span className="group-count">{group.count}</span>
                        </td>
                      </tr>

                      {isOpen &&
                        group.clients.map((c) => (
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
                              <Ellipsis value={c.category} />
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
                            <td className="num">{c.hourly_rate ?? "—"}</td>
                            <td className="num">{c.percent ?? "—"}</td>
                            <td className="ref-cell" onClick={(e) => openRef(c.referrer_id, e)}>
                              <Ellipsis value={c.referrer_name} />
                            </td>
                            <td className="ref-cell" onClick={(e) => openRef(c.referrer_first_id, e)}>
                              <Ellipsis value={c.referrer_first_name} />
                            </td>
                            {(() => {
                              const latestStatus = latestOrderStatusMap.get(c.id);
                              const emoji = statusToEmojiMap[latestStatus] || "—";
                              return (
                                <td
                                  title={latestStatus || "Нет заказов"}
                                  style={{ textAlign: "center", fontSize: "1.3em", cursor: "default" }}
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
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        )}

        {!loading && !forbidden && filteredRows.length === 0 && (
          <div className="empty-state">{error || "Клиенты не найдены"}</div>
        )}
      </div>
    </div>
  );
}
