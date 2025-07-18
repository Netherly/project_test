import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ClientModal from './ClientModal';
import '../styles/ClientsPage.css';
import { sampleClients } from '../data/sampleClients';

const STORAGE_KEY = 'clientsTableWidths';
const MIN_W = 24;                       // ≈ ширина 2-х символов

export default function ClientsPage({
  clients = sampleClients,
  onSaveClient = async c => c,
  onAddCompany = () => {},
  companies = [], employees = [], referrers = [], countries = [], currencies = []
}) {
  /* ---------- базовые данные ---------- */
  const headers = [
    'Клиент','Теги','Примечание','Вводное описание','Источник','ФИО','Страна',
    'Валюта','в час','Доля %','Реферер','Реферер перв.','Статус','Дата последнего заказа'
  ];
  const COLS = headers.length;

  /* ---------- загрузка ширин ---------- */
  const load = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(arr) && arr.length === COLS ? arr : Array(COLS).fill(null);
    } catch { return Array(COLS).fill(null); }
  };
  const [colWidths, setColWidths] = useState(load);

  /* ---------- вычисляем стартовую ширину ---------- */
  const wrapRef = useRef(null);
  useLayoutEffect(() => {
    if (colWidths.every(w => w == null) && wrapRef.current) {
      const total = wrapRef.current.clientWidth || 1200;
      const w = Math.floor(total / COLS);
      setColWidths(Array(COLS).fill(w));      // фиксируем пиксели
    }
  }, [wrapRef, colWidths]);

  /* сохраняем каждое изменение */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths));
  }, [colWidths]);

  /* ---------- прочие состояния ---------- */
  const [list,      setList]   = useState(clients);
  const [search,    setSearch] = useState('');
  const [showModal, setShow]   = useState(false);
  const [active,    setActive] = useState(null);
  const [expanded,  setExp]    = useState({ 1:true, 2:true, 3:true });

  /* ---------- helpers ---------- */
  const groups = { 1:'Партнёры', 2:'Наши клиенты', 3:'По ситуации' };
  const ellipsis = v => (
    <span className="ellipsis"
          title={Array.isArray(v)?v.map(t=>t.name).join(', '):String(v??'')}>
      {Array.isArray(v)
        ? (v.length>2
            ? `${v.slice(0,2).map(t=>t.name).join(', ')}, +${v.length-2}`
            : v.map(t=>t.name).join(', '))
        : v}
    </span>
  );

  const idMap   = useMemo(() => new Map(list.map(c=>[c.id,c])), [list]);
  const rows    = useMemo(
    () => list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [list, search]
  );

  /* ---------- UI actions ---------- */
  const openEdit = c => { setActive(c); setShow(true); };
  const openRef  = (id,e)=>{ e.stopPropagation(); const r=idMap.get(id); r&&openEdit(r); };
  const save     = async d=>{
    const s=await onSaveClient(d);
    setList(p=>{
      const i=p.findIndex(x=>x.id===s.id);
      return i!==-1 ? Object.assign([...p],{[i]:s}) : [s,...p];
    });
    setShow(false);
  };

  /* ---------- resize ---------- */
  const onDown = (i,e)=>{
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

  /* ---------- render ---------- */
  return (
    <div className="clients-layout">
      <Sidebar/>
      <div className="clients-page">
        {/* toolbar */}
        <header className="list-toolbar">
          <input className="toolbar-search" placeholder="Поиск…"
                 value={search} onChange={e=>setSearch(e.target.value)}/>
          <div className="toolbar-stats">
            <span>Итого клиентов:</span><b>{rows.length}</b>
            <button onClick={()=>{setActive(null);setShow(true);}}>+ добавить клиента</button>
          </div>
        </header>

        {/* table */}
        <div ref={wrapRef} className="clients-table-wrapper hidden-scroll">
          <table className="clients-table">
            <thead>
              <tr>{headers.map((h,i)=>
                <th key={h} style={{position:'relative',width:colWidths[i]}}>
                  {h}
                  <span className="resizer" onMouseDown={e=>onDown(i,e)}/>
                </th>)}
              </tr>
            </thead>

            <tbody>
              {Object.entries(groups).map(([gid,gname])=>(
                <React.Fragment key={gid}>
                  <tr className="group-row" onClick={()=>setExp(p=>({...p,[gid]:!p[gid]}))}>
                    {/* <td colSpan={COLS}>{expanded[gid]?'▼':'►'} {gid}. {gname}</td> */}
                    <td colSpan={COLS}>{expanded[gid] ? '▼' : '►'} {gid}. {gname}
                    {' '}<span className="group-count">количество клиентов ({rows.filter(c => String(c.group) === gid).length})</span></td>
                  </tr>
                  {expanded[gid] && rows.filter(c=>String(c.group)===gid).map(c=>(
                    <tr key={c.id} onClick={()=>openEdit(c)}>
                      <td style={{width:colWidths[0]}}>{c.name}</td>
                      <td style={{width:colWidths[1]}}>{ellipsis(c.tags)}</td>
                      <td style={{width:colWidths[2]}}>{ellipsis(c.note)}</td>
                      <td style={{width:colWidths[3]}}>{ellipsis(c.intro_description)}</td>
                      <td style={{width:colWidths[4]}}>{ellipsis(c.source)}</td>
                      <td style={{width:colWidths[5]}}>{ellipsis(c.full_name)}</td>
                      <td style={{width:colWidths[6]}}>{ellipsis(c.country)}</td>
                      <td style={{width:colWidths[7]}}>{ellipsis(c.currency)}</td>
                      <td style={{width:colWidths[8]}} >{c.hourly_rate}</td>
                      <td style={{width:colWidths[9]}} >{c.percent}</td>
                      <td className="ref-cell" style={{width:colWidths[10]}}
                          onClick={e=>openRef(c.referrer_id,e)}>{ellipsis(c.referrer_name)}</td>
                      <td className="ref-cell" style={{width:colWidths[11]}}
                          onClick={e=>openRef(c.referrer_first_id,e)}>{ellipsis(c.referrer_first_name)}</td>
                      <td style={{width:colWidths[12]}}>{ellipsis(c.status)}</td>
                      <td style={{width:colWidths[13]}}>{ellipsis(c.last_order_date)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length===0 && <div className="empty-state">Клиенты не найдены</div>}

        {showModal &&
          <ClientModal client={active} companies={companies} employees={employees}
                       referrers={referrers} countries={countries} currencies={currencies}
                       onClose={()=>setShow(false)} onSave={save} onAddCompany={onAddCompany}/>}
      </div>
    </div>
  );
}
