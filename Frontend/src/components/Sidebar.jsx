// src/components/Sidebar.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import "../styles/Sidebar.css";
import { ProfileAPI } from "../api/profile";

import DashboardWebm from "../assets/menu-icons/Дашборд.webm";
import FinanceWebm from "../assets/menu-icons/Финансы.webm";
import DirectoryWebm from "../assets/menu-icons/Справочники.webm";
import DesktopWebm from "../assets/menu-icons/Рабочий стол.webm";
import FieldSettingsWebm from "../assets/menu-icons/Настройки полей.webm";
import CurrencyRatesWebm from "../assets/menu-icons/Курсы валют.webm";
import ClientsWebm from "../assets/menu-icons/Клиенты.webm";
import OrdersWebm from "../assets/menu-icons/Заказы.webm";
import AssetsWebm from "../assets/menu-icons/Активы.webm";
import TasksWebm from "../assets/menu-icons/Задачи.webm";
import RolesWebm from "../assets/menu-icons/Роли.webm";
import ArchiveWebm from "../assets/menu-icons/Архив.webm";
import ExecutorsWebm from "../assets/menu-icons/Исполнители.webm";
import SettingsWebm from "../assets/menu-icons/Настройки.webm";
import JournalWebm from "../assets/menu-icons/Журнал.webm";
import TransactionWebm from "../assets/menu-icons/Транзакции.webm";
import TransactionNewWebm from "../assets/menu-icons/Транзакции вектор вебм.webm";
import ReportWebm from "../assets/menu-icons/Отчеты.webm";
import EmployesWebm from "../assets/menu-icons/Сотрудники.webm";
import DashboardJson from "../assets/menu-icons/Дашборд.webm";

const MediaIcon = ({ src, alt, className, active }) => {
  const lottieRef = useRef(null);
  const cycleCountRef = useRef(0);
  const pauseTimerRef = useRef(null);

  const handleComplete = () => {
    cycleCountRef.current += 1;
    if (cycleCountRef.current < 2) {
      lottieRef.current?.goToAndPlay(0);
    } else {
      pauseTimerRef.current = setTimeout(() => {
        cycleCountRef.current = 0;
        lottieRef.current?.goToAndPlay(0);
      }, 30000);
    }
  };

  useEffect(() => {
    const lottie = lottieRef.current;
    if (!lottie) return;
    if (active) {
      cycleCountRef.current = 0;
      lottie.goToAndPlay(0);
    } else {
      lottie.stop();
      cycleCountRef.current = 0;
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    }
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, [active]);

  if (typeof src === "string" && src.endsWith(".webm")) {
    return <video src={src} autoPlay={active} loop muted playsInline className={className} />;
  }
  if (typeof src === "object" && src !== null) {
    return (
      <Lottie
        lottieRef={lottieRef}
        animationData={src}
        loop={false}
        autoplay={false}
        onComplete={handleComplete}
        className={className}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const leaveTimerRef = useRef(null); 

 
  const [profile, setProfile] = useState({ nickname: "Nickname", userId: "" });
  const loadProfile = useCallback(async () => {
    try {
      const p = await ProfileAPI.get();
      setProfile({ nickname: p.nickname || "Nickname", userId: p.userId || "" });
    } catch (e) {
      console.error("Не удалось загрузить профиль в Sidebar:", e?.message || e);
    }
  }, []);
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleAvatarEnter = useCallback(() => { loadProfile(); }, [loadProfile]);

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
      { name: "Компании", path: "/company", icon: ReportWebm},
    ],
    transactions: [
      { name: "Активы", path: "/assets", icon: AssetsWebm },
      { name: "Транзакции", path: "/list", icon: TransactionWebm },
      { name: "Регулярные платежи", path: "/regular", icon: TransactionNewWebm },
    ],
    settings: [
      { name: "Доступы", path: "/access", icon: RolesWebm },
      { name: "Поля", path: "/fields", icon: FieldSettingsWebm },
      { name: "Курсы валют", path: "/currency-rates", icon: CurrencyRatesWebm },
      { name: "Фикс", path: "/fixes", icon: SettingsWebm },
    ],
  };

  const mainMenuItems = [
    { name: "Дашборд", path: "/dashboard", exact: "/statistics", iconActive: DashboardJson, iconInactive: DashboardJson },
    { name: "Рабочий стол", menu: "Desktop", iconActive: DesktopWebm, iconInactive: DesktopWebm },
    { name: "Финансы", menu: "transactions", iconActive: FinanceWebm, iconInactive: FinanceWebm },
    { name: "Справочник", menu: "directory", iconActive: DirectoryWebm, iconInactive: DirectoryWebm },
    { name: "Архив", path: "/archive", iconActive: ArchiveWebm, iconInactive: ArchiveWebm },
    { name: "Настройки", menu: "settings", iconActive: SettingsWebm, iconInactive: SettingsWebm },
  ];

  
  const handleMouseEnter = (menuName) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveMenu(menuName);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 300); 
  };

  const isActivePath = useCallback((path) => location.pathname === path, [location.pathname]);
  const isParentMenuActive = useCallback(
    (menuKey) => submenus[menuKey]?.some((submenuItem) => location.pathname === submenuItem.path) || false,
    [location.pathname]
  );

  
  const handleParentClick = (menuKey) => {
    const firstItem = submenus[menuKey]?.[0];
    if (firstItem && firstItem.path) {
      navigate(firstItem.path);
      setActiveMenu(null); 
    }
  };

  const copyClientId = useCallback((id) => {
    if (!id) return;
    navigator.clipboard
      .writeText(id)
      .then(() => console.log("ID пользователя скопирован:", id))
      .catch((err) => console.error("Ошибка копирования:", err));
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
    navigate("/login", { replace: true });
  }, [navigate]);

  const renderSubmenu = useCallback(
    (key) => {
      if (!submenus[key]) return null;
      return (
        <div
          key={`submenu-${key}`}
          className="submenu-panel show"
          onMouseEnter={() => handleMouseEnter(key)} 
          onMouseLeave={handleMouseLeave}
        >
          <ul className="submenu">
            {submenus[key].map(({ name, path, icon }) => (
              <li key={`${key}-${path}`}>
                <NavLink to={path} onClick={() => setActiveMenu(null)}>
                  {icon && (
                    <MediaIcon
                      src={icon}
                      alt={name}
                      className="submenu-icon"
                      active={location.pathname === path}
                    />
                  )}
                  <span>{name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      );
    },
    [location.pathname]
  );

  return (
    <>
      <nav className="sidebar">
        <div className="avatar-link" onMouseEnter={handleAvatarEnter}>
          <img src="/avatar.jpg" alt="Profile" className="avatar-sidebar" />
          <div className="avatar-dropdown">
            <div className="avatar-info">
              <div className="avatar-name">{profile.nickname || "Nickname"}</div>
              <div
                className="avatar-id"
                onClick={() => copyClientId(profile.userId)}
                style={{ cursor: "pointer" }}
                title="Нажмите чтобы скопировать"
              >
                ID: {profile.userId || "—"} 📋
              </div>
            </div>
            <div className="avatar-actions">
              <NavLink to="/profile" className="avatar-action">Профиль</NavLink>
              <button className="avatar-action" onClick={handleLogout}>Выход</button>
            </div>
          </div>
        </div>

        <div className="scrollable-menu hidden-scroll">
          <ul className="menu">
            {mainMenuItems.map((item) => {
              const isExactActive = isActivePath(item.exact || item.path);
              const isParentActive = item.menu ? isParentMenuActive(item.menu) : false;
              const isItemActive = isExactActive || isParentActive;
              const iconSrc = isItemActive ? item.iconActive || item.iconInactive : item.iconInactive || item.iconActive;

              return (
                <li
                  key={item.name}
                  className={`menu-item ${isItemActive ? "active" : ""}`}
                  onMouseEnter={() => item.menu && handleMouseEnter(item.menu)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => item.menu && handleParentClick(item.menu)}
                >
                  {item.path ? (
                    <NavLink to={item.path} className={isExactActive ? "active" : ""} onClick={() => setActiveMenu(null)}>
                      <MediaIcon src={iconSrc} alt={item.name} className="menu-icon" active={isItemActive} />
                      <span>{item.name}</span>
                    </NavLink>
                  ) : (
                    <div className={`submenu-toggle ${isParentActive ? "parent-active" : ""}`}>
                      <MediaIcon src={iconSrc} alt={item.name} className="menu-icon" active={isItemActive} />
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