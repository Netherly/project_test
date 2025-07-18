import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/Sidebar.css';

import dashboardIcon from '../assets/menu-icons/dashboard_static.png';
import dashboardIconActive from '../assets/menu-icons/dashboard.gif';
import ordersIcon from '../assets/sub-menu-icons/orders_static.png';
import ordersIconActive from '../assets/sub-menu-icons/orders.gif';
import testactive from '../assets/menu-icons/test-icon.webp'

const Sidebar = () => {
  const { theme, toggleTheme, backgroundImage, setBackgroundImage } = useContext(ThemeContext);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderLink = (to, label, staticIcon, activeIcon, isSub = false) => {
    return (
      <li className={isSub ? 'submenu-item' : 'menu-item'} onClick={() => setOpenMenu(null)}>
        <NavLink
          to={to}
          className={({ isActive }) => (isActive ? (isSub ? 'active-sub' : 'active') : '')}
        >
          {({ isActive }) => (
            <>
              <img
                src={isActive ? activeIcon : staticIcon}
                alt={label}
                className={isSub ? 'submenu-icon' : 'menu-icon'}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      </li>
    );
  };

   const copyClientId = (clientId) => {
    navigator.clipboard.writeText(clientId).then(() => {
      console.log('ID клиента скопирован:', clientId);
    }).catch(err => {
      console.error('Ошибка при копировании:', err);
    });
  };

  const clientId = "23995951"; 

  return (
    <nav
      className={`sidebar ${theme}`}
    >
      <NavLink className="avatar-link">
          <img src="/avatar.jpg" alt="Профиль" className="avatar-sidebar" />
          <div className="avatar-dropdown">
            <div className="avatar-info">
              <div className="avatar-name">Nickname</div>
              <div
                className="avatar-id"
                onClick={() => copyClientId(clientId)}
                style={{ cursor: 'pointer' }}
                title="Нажмите для копирования"
              >
                ID: {clientId} 📋
              </div>
            </div>
            <div className="avatar-actions">
              <NavLink to="/profile" className="avatar-action">профиль</NavLink>
              <button className="avatar-action">выйти</button>
            </div>
          </div>
        </NavLink>

      <div className="scrollable-menu hidden-scroll">
        <ul className="menu">
          {renderLink('/home', 'Главная', dashboardIcon, dashboardIconActive)}

          <li className="menu-item">
            <a
              href="#"
              className={openMenu === 'workspace' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('workspace');
              }}
            >
              <img
                src={openMenu === 'workspace' ? dashboardIconActive : dashboardIcon}
                alt="Рабочий стол"
                className="menu-icon"
              />
              <span>Рабочий стол</span>
            </a>
          </li>

          {openMenu === 'workspace' && (
            <div className="submenu-panel show">
              <ul className="submenu">
                {renderLink('/orders', 'Заказы', ordersIcon, ordersIconActive, true)}
                {renderLink('/executors', 'Исполнители', ordersIcon, ordersIconActive, true)}
                {renderLink('/tasks', 'Задачи', ordersIcon, ordersIconActive, true)}
                {renderLink('/journal', 'Журнал', ordersIcon, ordersIconActive, true)}
                {renderLink('/calendar', 'Календарь', ordersIcon, ordersIconActive, true)}
              </ul>
            </div>
          )}

          <li className="menu-item">
            <a
              href="#"
              className={openMenu === 'directory' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('directory');
              }}
            >
              <img src={"https://cdn-icons-gif.flaticon.com/7211/7211817.gif"} alt="Справочник" className="menu-icon" />
              <span>Справочник</span>
            </a>
          </li>

          {openMenu === 'directory' && (
            <div className="submenu-panel show">
              <ul className="submenu">
                {renderLink('/clients', 'Клиенты', ordersIcon, ordersIconActive, true)}
                {renderLink('/employees', 'Сотрудники', ordersIcon, ordersIconActive, true)}
                {renderLink('/reports', 'Отчеты', ordersIcon, ordersIconActive, true)}
                {renderLink('/access', 'Доступы', ordersIcon, ordersIconActive, true)}
              </ul>
            </div>
          )}

          {renderLink('/stats', 'Статистика', ordersIcon, ordersIconActive)}
          {renderLink('/assets', 'Активы', testactive, testactive)}
          {renderLink('/transactions', 'Транзакции', ordersIcon, ordersIconActive)}
          {renderLink('/archive', 'Архив', ordersIcon, ordersIconActive)}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;