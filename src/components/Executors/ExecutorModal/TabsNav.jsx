

import React from 'react';

const TABS = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'general', label: 'Общее' },
  { id: 'journal', label: 'Журнал' },
  { id: 'finances', label: 'Финансы' },
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