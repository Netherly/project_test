

import React from 'react';


const TABS = [
    { id: 'summary', label: 'Сводка' },
    { id: 'employees', label: 'Сотрудники' },
    { id: 'access', label: 'Доступы' },
    { id: 'finances', label: 'Финансы' },
];

export default function CompanyTabsNav({ activeTab, setActiveTab, errors = {} }) {
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