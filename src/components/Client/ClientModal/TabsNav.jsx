// src/components/Client/ClientModal/TabsNav.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './TabsNav.css';

const TABS = [
  { id: 'summary', label: 'Сводка'},
  { id: 'info',     label: 'Общее' },
  { id: 'contacts', label: 'Контакты' },
  { id: 'finances', label: 'Финансы' },
  { id: 'accesses', label: 'Доступы' }
];

export default function TabsNav({ activeTab, setActiveTab, errors = {}, isNew }) {
  const hasErrors = (tabId) =>
    errors && Array.isArray(errors[tabId]) && errors[tabId].length > 0;

  const visibleTabs = isNew ? TABS.filter(t => t.id !== 'summary') : TABS;

  return (
    <nav className="tabs-nav">
      <ul>
        {visibleTabs.map((t, i) => { 
          const active = activeTab === t.id;
          return (
            <li key={t.id} className={`${active ? 'active' : ''} ${hasErrors(t.id) ? 'has-error' : ''}`}>
              <button type="button" onClick={() => setActiveTab(t.id)}>
                {t.label}
                {hasErrors(t.id) && <span className="error-dot" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

TabsNav.propTypes = {
  activeTab:    PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  errors:       PropTypes.object,
  isNew:        PropTypes.bool,
};


TabsNav.defaultProps = {
  errors: {},
  isNew: false,
};