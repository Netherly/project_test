import { NavLink, useLocation } from "react-router-dom";
import React, { useState } from "react";
import "../styles/Sidebar.css";

import DashboardWebm from "../assets/menu-icons/Дашборд.webm";
import FinanceWebm from "../assets/menu-icons/Финансы.webm";
import DirectoryWebm from "../assets/menu-icons/Справочники.webm";
import DesktopWebm from "../assets/menu-icons/Рабочий стол.webm";
import FieldSettingsWebm from "../assets/menu-icons/Настройки полей.webm";
import CurrencyRatesWebm from "../assets/menu-icons/Курсы валют.webm";
import ClientsWebm from "../assets/menu-icons/Клиенты.webm";
import OrdersWebm from "../assets/menu-icons/Заказы.webm";
import AssetsWebm from "../assets/menu-icons/Активы.webm";
import AssetsNewWebm from "../assets/menu-icons/Активы вектор вебм.webm";
import TasksWebm from "../assets/menu-icons/Задачи.webm";
import RolesWebm from "../assets/menu-icons/Роли.webm";
import EntryWebm from "../assets/menu-icons/Доступы.webm";
import ArchiveWebm from "../assets/menu-icons/Архив.webm";
import ExecutorsWebm from "../assets/menu-icons/Исполнители.webm";
import SettingsWebm from "../assets/menu-icons/Настройки.webm";
import JournalWebm from "../assets/menu-icons/Журнал.webm";
import TransactionWebm from "../assets/menu-icons/Транзакции.webm";
import TransactionNewWebm from "../assets/menu-icons/Транзакции вектор вебм.webm";
import ReportWebm from "../assets/menu-icons/Отчеты.webm";
import EmployesWebm from "../assets/menu-icons/Сотрудники.webm";

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
      .then(() => console.log("ID клиента скопировано:", clientId))
      .catch((err) => console.error("Ошибка копирования:", err));
  };

  const clientId = "23995951";

  const mainMenuItems = [
    { name: "Дашборд", path: "/home", exact: "/statistics", iconActive: DashboardWebm, iconInactive: DashboardWebm },
    { name: "Рабочий стол", menu: "Desktop", iconActive: DesktopWebm, iconInactive: DesktopWebm },
    { name: "Финансы", menu: "transactions", iconActive: FinanceWebm, iconInactive: FinanceWebm },
    { name: "Справочник", menu: "directory", iconActive: DirectoryWebm, iconInactive: DirectoryWebm },
    { name: "Архив", path: "/archive", iconActive: ArchiveWebm, iconInactive: ArchiveWebm },
    { name: "Настройки", menu: "settings", iconActive: SettingsWebm, iconInactive: SettingsWebm },
  ];

  const submenus = {
    Desktop: [
      { name: "Заказы", path: "/orders", icon: OrdersWebm },
      { name: "Исполнители", path: "/executors", icon: ExecutorsWebm },
      { name: "Задачи", path: "/tasks", icon: TasksWebm },
      { name: "Журнал", path: "/journal", icon: JournalWebm },
      { name: "Календарь", path: "/calendar" },
    ],
    directory: [
      { name: "Клиенты", path: "/clients", icon: ClientsWebm },
      { name: "Сотрудники", path: "/employees", icon: EmployesWebm },
      { name: "Отчёты", path: "/reports", icon: ReportWebm },
      { name: "Доступы", path: "/access", icon: EntryWebm },
    ],
    transactions: [
      { name: "Активы", path: "/assets", icon: AssetsWebm },
      { name: "Активы(n)", path: "/assets", icon: AssetsNewWebm },
      { name: "Транзакции", path: "/list", icon: TransactionWebm },
      { name: "Транзакции(n)", path: "/list", icon: TransactionNewWebm },
      { name: "Регулярные платежи", path: "/regular", icon: TransactionNewWebm}
    ],
    settings: [
      { name: "Роли/Доступы", path: "/roles-access", icon: RolesWebm },
      { name: "Настройки полей", path: "/fields", icon: FieldSettingsWebm }, 
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
                title="Нажмите чтобы скопировать"
              >
                ID: {clientId} 📋
              </div>
            </div>
            <div className="avatar-actions">
              <NavLink to="/profile" className="avatar-action">
                Профиль
              </NavLink>
              <button className="avatar-action">Выход</button>
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