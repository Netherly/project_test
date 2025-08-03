import { NavLink, useLocation } from "react-router-dom";
import React, { useState } from "react";
import "../styles/Sidebar.css";

// Menu icons
import DashboardWebm from "../assets/menu-icons/Дашборд.webm";
import FinanceWebm from "../assets/menu-icons/Финансы.webm";
import TransactionsWebm from "../assets/menu-icons/Транзакции.webm";
import DirectoryWebm from "../assets/menu-icons/Справочники.webm";
import DesktopWebm from "../assets/menu-icons/Рабочий стол.webm";
import FieldSettingsWebm from "../assets/menu-icons/Настройки полей.webm";
import CurrencyRatesWebm from "../assets/menu-icons/Курсы валют.webm";
import ClientsWebm from "../assets/menu-icons/Клиенты.webm";
import OrdersWebm from "../assets/menu-icons/Заказы.webm";
import ArchiveWebm from "../assets/menu-icons/Архив.webm";

// Reusable icon component
const MediaIcon = ({ src, alt, className }) =>
  src.endsWith(".webm") ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className={className}
    />
  ) : (
    <img src={src} alt={alt} className={className} />
  );

const Sidebar = () => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (menuName) =>
    setActiveMenu((prev) => (prev === menuName ? null : menuName));

  const isActivePath = (path) => location.pathname === path;

  const copyClientId = (clientId) => {
    navigator.clipboard
      .writeText(clientId)
      .then(() => console.log("Client ID copied:", clientId))
      .catch((err) => console.error("Copy error:", err));
  };

  const clientId = "23995951";

  const mainMenuItems = [
    { name: "Дашборд", path: "/home", exact: "/statistics", iconActive: DashboardWebm, iconInactive: DashboardWebm },
    { name: "Рабочий стол", menu: "Desktop", iconActive: DesktopWebm, iconInactive: DesktopWebm },
    { name: "Финансы", menu: "transactions", iconActive: FinanceWebm, iconInactive: FinanceWebm },
    { name: "Справочник", menu: "directory", iconActive: DirectoryWebm, iconInactive: DirectoryWebm },
    { name: "Архив", path: "/archive", iconActive: ArchiveWebm, iconInactive: ArchiveWebm },
    { name: "Настройки", menu: "settings", iconActive: FieldSettingsWebm, iconInactive: FieldSettingsWebm },
  ];

  const submenus = {
    Desktop: [
      { name: "Заказы", path: "/orders", icon: OrdersWebm },
      { name: "Исполнители", path: "/executors" },
      { name: "Задачи", path: "/tasks" },
      { name: "Журнал", path: "/journal" },
      { name: "Календарь", path: "/calendar" },
    ],
    directory: [
      { name: "Клиенты", path: "/clients", icon: ClientsWebm },
      { name: "Сотрудники", path: "/employees", icon: "https://cdn-icons-gif.flaticon.com/7211/7211849.gif" },
      { name: "Отчёты", path: "/reports", icon: "https://cdn-icons-gif.flaticon.com/6416/6416398.gif" },
      { name: "Доступы", path: "/access", icon: "https://cdn-icons-gif.flaticon.com/15968/15968705.gif" },
    ],
    transactions: [
      { name: "Активы", path: "/assets" },
      { name: "Транзакции", path: "/list" },
    ],
    settings: [
      { name: "Роли/Доступы", path: "/roles-access" },
      { name: "Настройки полей", path: "/fields" },
      { name: "Курс валют", path: "/currency-rates", icon: CurrencyRatesWebm },
    ],
  };

  const renderSubmenu = (key) => (
    <div className="submenu-panel show">
      <ul className="submenu">
        {submenus[key].map(({ name, path, icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={isActivePath(path) ? "active-sub" : ""}
              onClick={() => setActiveMenu(null)}
            >
              {icon && <MediaIcon src={icon} alt={name} className="submenu-icon" />}
              <span>{name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <nav className="sidebar">
        <NavLink className="avatar-link">
          <img src="/avatar.jpg" alt="Profile" className="avatar-sidebar" />
          <div className="avatar-dropdown">
            <div className="avatar-info">
              <div className="avatar-name">Nickname</div>
              <div
                className="avatar-id"
                onClick={() => copyClientId(clientId)}
                style={{ cursor: "pointer" }}
                title="Click to copy"
              >
                ID: {clientId} 📋
              </div>
            </div>
            <div className="avatar-actions">
              <NavLink to="/profile" className="avatar-action">
                Profile
              </NavLink>
              <button className="avatar-action">Logout</button>
            </div>
          </div>
        </NavLink>

        <div className="scrollable-menu hidden-scroll">
          <ul className="menu">
            {mainMenuItems.map((item) => {
              const isMenuOpen = activeMenu === item.menu;
              const isExactActive = isActivePath(item.exact || item.path);
              const iconSrc =
                isMenuOpen || isExactActive
                  ? item.iconActive || item.iconInactive
                  : item.iconInactive || item.iconActive;

              return (
                <li key={item.name} className={`menu-item ${isMenuOpen ? "active" : ""}`}>
                  {item.path ? (
                    <NavLink
                      to={item.path}
                      className={isExactActive ? "active" : ""}
                      onClick={() => setActiveMenu(null)}
                    >
                      <MediaIcon src={iconSrc} alt={item.name} className="menu-icon" />
                      <span>{item.name}</span>
                    </NavLink>
                  ) : (
                    <NavLink
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleMenu(item.menu);
                      }}
                      className="submenu-toggle"
                    >
                      <MediaIcon src={iconSrc} alt={item.name} className="menu-icon" />
                      <span>{item.name}</span>
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {activeMenu && submenus[activeMenu] && renderSubmenu(activeMenu)}
    </>
  );
};

export default Sidebar;