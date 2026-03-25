import React from 'react';

const TABS = [
  { id: 'general', label: 'Общее' },
  { id: 'finances', label: 'Финансы' },
  { id: 'requisites', label: 'Реквизиты' },
];


export default function TabsNav({ activeTab, setActiveTab, errors = {}, isNew }) {
  
  const visibleTabs = isNew ? TABS.filter(tab => tab.id !== 'summary') : TABS;

  return (
    <nav className="tabs-nav">
      <ul>
        {visibleTabs.map(tab => (
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