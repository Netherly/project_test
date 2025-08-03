// src/components/Client/ClientModal/TabsNav.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './TabsNav.css';

const TABS = [
  { id: 'info',     label: 'Общая информация' },
  { id: 'contacts', label: 'Контакты' },
  { id: 'finances', label: 'Финансы' },
  { id: 'accesses', label: 'Доступы' }
];

export default function TabsNav({ activeTab, setActiveTab, errors = {} }) {
  const hasErrors = (tabId) =>
    errors && Array.isArray(errors[tabId]) && errors[tabId].length > 0;

  return (
    <nav className="tabs-nav">
      <ul>
        {TABS.map((t, i) => {
          const active = activeTab === t.id;
          return (
            <li key={t.id} className={`${active ? 'active' : ''} ${hasErrors(t.id) ? 'has-error' : ''}`}>
              <button type="button" onClick={() => setActiveTab(t.id)}>
                {i + 1}. {t.label}
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
  errors:       PropTypes.object
};
