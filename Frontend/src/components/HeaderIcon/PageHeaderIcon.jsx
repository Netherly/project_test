import React from "react";

import DashboardWebm from "../../assets/menu-icons/Дашборд.webm";
import FinanceWebm from "../../assets/menu-icons/Финансы.webm";
import DirectoryWebm from "../../assets/menu-icons/Справочники.webm";
import DesktopWebm from "../../assets/menu-icons/Рабочий стол.webm";
import FieldSettingsWebm from "../../assets/menu-icons/Настройки полей.webm";
import CurrencyRatesWebm from "../../assets/menu-icons/Курсы валют.webm";
import ClientsWebm from "../../assets/menu-icons/Клиенты.webm";
import OrdersWebm from "../../assets/menu-icons/Заказы.webm";
import AssetsNewWebm from "../../assets/menu-icons/Активы вектор вебм.webm";
import TasksWebm from "../../assets/menu-icons/Задачи.webm";
import RolesWebm from "../../assets/menu-icons/Роли.webm";
import EntryWebm from "../../assets/menu-icons/Доступы.webm";
import ArchiveWebm from "../../assets/menu-icons/Архив.webm";
import ExecutorsWebm from "../../assets/menu-icons/Исполнители.webm";
import SettingsWebm from "../../assets/menu-icons/Настройки.webm";
import JournalWebm from "../../assets/menu-icons/Журнал.webm";
import TransactionNewWebm from "../../assets/menu-icons/Транзакции вектор вебм.webm";
import ReportWebm from "../../assets/menu-icons/Отчеты.webm";
import EmployesWebm from "../../assets/menu-icons/Сотрудники.webm";

const pageIcons = {
    "Дашборд": DashboardWebm,
    "Рабочий стол": DesktopWebm,
    "Финансы": FinanceWebm,
    "Справочник": DirectoryWebm,
    "Архив": ArchiveWebm,
    "Настройки": SettingsWebm,
    "Заказы": OrdersWebm,
    "Исполнители": ExecutorsWebm,
    "Задачи": TasksWebm,
    "Журнал": JournalWebm,
    "Календарь": null, 
    "Клиенты": ClientsWebm,
    "Сотрудники": EmployesWebm,
    "Отчёты": ReportWebm,
    "Доступы": EntryWebm,
    "Активы": AssetsNewWebm,
    "Транзакции": TransactionNewWebm,
    "Роли/Доступы": RolesWebm,
    "Настройки полей": FieldSettingsWebm,
    "Курс валют": CurrencyRatesWebm,
};

const PageHeaderIcon = ({ pageName, className = "page-header-icon" }) => {
    const iconSrc = pageIcons[pageName];

    if (!iconSrc) {
        return null; 
    }

    return (
        <video
            src={iconSrc}
            autoPlay
            loop
            muted
            playsInline
            className={className}
            style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
                marginRight: "8px",
            }}
        />
    );
};

export default PageHeaderIcon;