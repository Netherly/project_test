import { NavLink, useLocation } from "react-router-dom";
import React, { useState, useCallback } from "react";
import Lottie from "lottie-react";
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
import TransactionJson from "../assets/menu-icons/транзакциии json.json";
import AssetsNewJson from "../assets/menu-icons/активы json.json";
import DashboardJson from "../assets/menu-icons/дашборд json.json";


const MediaIcon = ({ src, alt, className }) => {
  // Если webm
  if (typeof src === "string" && src.endsWith(".webm")) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
    );
  }

  // Если JSON-анимация
  if (typeof src === "object" && src !== null) {
    return <Lottie animationData={src} loop={true} className={className} />;
  }

  // Всё остальное — картинка
  return <img src={src} alt={alt} className={className} />;
};

const Sidebar = () => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);

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
    ],
    transactions: [
      { name: "Активы", path: "/assets", icon: AssetsWebm },
      { name: "Транзакции", path: "/list", icon: TransactionWebm },
      { name: "Регулярные платежи", path: "/regular", icon: TransactionNewWebm}
    ],
    settings: [
      { name: "Доступы", path: "/access", icon: RolesWebm },
      { name: "Настройки полей", path: "/fields", icon: FieldSettingsWebm },
      { name: "Курс валют", path: "/currency-rates", icon: CurrencyRatesWebm },
    ],
  };

  const mainMenuItems = [
    { name: "Дашборд", path: "/home", exact: "/statistics", iconActive: DashboardJson, iconInactive: DashboardJson },
    { name: "Рабочий стол", menu: "Desktop", iconActive: DesktopWebm, iconInactive: DesktopWebm },
    { name: "Финансы", menu: "transactions", iconActive: FinanceWebm, iconInactive: FinanceWebm },
    { name: "Справочник", menu: "directory", iconActive: DirectoryWebm, iconInactive: DirectoryWebm },
    { name: "Архив", path: "/archive", iconActive: ArchiveWebm, iconInactive: ArchiveWebm },
    { name: "Настройки", menu: "settings", iconActive: SettingsWebm, iconInactive: SettingsWebm },
  ];

  const MouseEnter = useCallback((menuName) => {
    setActiveMenu(menuName);
  }, []);

  const MouseLeave = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const isActivePath = useCallback((path) => location.pathname === path, [location.pathname]);

  const isParentMenuActive = useCallback((menuKey) => {
    if (!submenus[menuKey]) return false;
    return submenus[menuKey].some(submenuItem =>
      location.pathname === submenuItem.path
    );
  }, [location.pathname, submenus]);

  const copyClientId = useCallback((clientId) => {
    navigator.clipboard
      .writeText(clientId)
      .then(() => console.log("ID клиента скопировано:", clientId))
      .catch((err) => console.error("Ошибка копирования:", err));
  }, []);

  const clientId = "23995951";

  const renderSubmenu = useCallback((key) => {
    if (!submenus[key]) return null;
    
    return (
      <div
        key={`submenu-${key}`}
        className="submenu-panel show"
        onMouseEnter={() => MouseEnter(key)} 
        onMouseLeave={MouseLeave} 
      >
        <ul className="submenu">
          {submenus[key].map(({ name, path, icon }) => (
            <li key={`${key}-${path}`}>
              <NavLink
                to={path}
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
  }, [submenus, MouseEnter, MouseLeave]);

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
              const isParentActive = item.menu ? isParentMenuActive(item.menu) : false;

              const isItemActive = isExactActive || isParentActive;

              const iconSrc =
                isItemActive
                  ? item.iconActive || item.iconInactive
                  : item.iconInactive || item.iconActive;

              return (
                <li
                  key={item.name}
                  className={`menu-item ${isItemActive ? "active" : ""}`}
                  onMouseEnter={() => item.menu && MouseEnter(item.menu)}
                  onMouseLeave={MouseLeave}
                >
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
                    <div className={`submenu-toggle ${isParentActive ? "parent-active" : ""}`}>
                      <MediaIcon src={iconSrc} alt={item.name} className="menu-icon" />
                      <span>{item.name}</span>
                    </div>
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