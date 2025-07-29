import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/Sidebar.css';

import dashboardIcon from '../assets/menu-icons/dashboard_static.png';
import dashboardIconActive from '../assets/menu-icons/dashboard.gif';
import ordersIcon from '../assets/sub-menu-icons/orders_static.png';
import ordersIconActive from '../assets/sub-menu-icons/orders.gif';
import testactive from '../assets/menu-icons/Активы.webm'

// Компонент для анимированных иконок
const AnimatedIcon = ({ src, alt, className, isActive }) => {
  if (src.endsWith('.webm')) {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={className}
      >
        <source src={src} type="video/webm" />
      </video>
    );
  }
  
  return <img src={src} alt={alt} className={className} />;
};

const Sidebar = () => {
  const { theme, toggleTheme, backgroundImage, setBackgroundImage } = useContext(ThemeContext);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
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
              <AnimatedIcon
                src={isActive ? activeIcon : staticIcon}
                alt={label}
                className={isSub ? 'submenu-icon' : 'menu-icon'}
                isActive={isActive}
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
          {renderLink('/home', 'Статистика', dashboardIcon, dashboardIconActive)}

          <li className="menu-item">
            <a
              href="#"
              className={openMenu === 'workspace' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('workspace');
              }}
            >
              <AnimatedIcon
                src={openMenu === 'workspace' ? dashboardIconActive : dashboardIcon}
                alt="Рабочий стол"
                className="menu-icon"
                isActive={openMenu === 'workspace'}
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
          {renderLink('/assets', 'Активы', testactive, testactive)}
          {renderLink('/currency-rates', 'Транзакции', ordersIcon, ordersIconActive)}
          {renderLink('/clients', 'Клиенты', ordersIcon, ordersIconActive)}
          {renderLink('/employees', 'Сотрудники', ordersIcon, ordersIconActive)}

          <li className="menu-item">
            <a
              href="#"
              className={openMenu === 'directory' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('directory');
              }}
            >
              <AnimatedIcon 
                src="https://cdn-icons-gif.flaticon.com/7211/7211817.gif" 
                alt="Справочник" 
                className="menu-icon"
                isActive={openMenu === 'directory'}
              />
              <span>Справочник</span>
            </a>
          </li>

          {openMenu === 'directory' && (
            <div className="submenu-panel show">
              <ul className="submenu">
                {renderLink('/reports', 'Отчеты', ordersIcon, ordersIconActive, true)}
                {renderLink('/access', 'Доступы', ordersIcon, ordersIconActive, true)}
              </ul>
            </div>
          )}

          {renderLink('/stats', 'Статистика', ordersIcon, ordersIconActive)}
          {renderLink('/archive', 'Архив', ordersIcon, ordersIconActive)}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;