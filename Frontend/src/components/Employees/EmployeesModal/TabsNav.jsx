

import React from 'react';

const TABS = [
  { id: 'general', label: 'Общая информация' },
  { id: 'contacts', label: 'Контакты' },
  { id: 'requisites', label: 'Реквизиты' },
  { id: 'finances', label: 'Финансы' },
  { id: 'orders', label: 'Заказы' },
];

export default function TabsNav({ activeTab, setActiveTab, errors = {} }) {
  return (
    <nav className="tabs-nav">
      <ul>
        {TABS.map(tab => (
          <li
            key={tab.id}
            className={`
              ${activeTab === tab.id ? 'active' : ''}
              ${errors[tab.id] ? 'error' : ''}
            `}
          >
            <button type="button" onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}