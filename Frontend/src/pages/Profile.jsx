import React, { useState, useContext } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Sidebar from "../components/Sidebar";
import Requisites from "../components/ui/Requisites/Requisites";
import { ThemeContext } from "../context/ThemeContext";
import "../styles/Profile.css";

function Profile() {

    const { theme, toggleTheme, setBackgroundImage } = useContext(ThemeContext);

    // Дефолт настрйоки профиля
    const defaultSettings = {
        nickname: "admin-001",
        password: "11111111",
        email: "admin@gmail.com",
        userId: "",
        fullName: "",
        requisites: [{ currency: "", bank: "", account: "" }],
        currency: "UAH",
        workSchedule: Array(7).fill(["09:00", "18:00"]),
        botReminders: Array(7).fill(false),
        crmLanguage: "ua",
        crmTheme: "light",
        crmBackground: null,
        notifySound: true,
        notifyCounter: true,
        notifyTelegram: true
    };

    // Сохраненные настройки из localStorage
    const savedSettings = JSON.parse(localStorage.getItem("profileSettings")) || defaultSettings;

    // Форма с реквизитами
    const methods = useForm({
        defaultValues: {
            requisites: savedSettings.requisites
        }
    });

    // Текущие настройки профиля
    const [settings, setSettings] = useState(savedSettings);

    // Оригинальные настройки
    const [originalSettings, setOriginalSettings] = useState(savedSettings);

    // Отслеживание изменений в реквизитах
    const watchedRequisites = methods.watch("requisites");

    // Отображать пароль как текст
    const [showPassword, setShowPassword] = useState(false);

    // Проверка изменнений
    const changed =
        JSON.stringify({ ...settings, requisites: watchedRequisites }) !==
        JSON.stringify(originalSettings);

    // Копирования ID клиента
    const copyClientId = (clientId) => {
        navigator.clipboard.writeText(clientId).then(() => {
            console.log('ID клиента скопирован:', clientId);
        }).catch(err => {
            console.error('Ошибка при копировании:', err);
        });
    };

    // Обработчик изменения полей настроек
    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    // Обработчик изменения графика работы
    const handleWorkScheduleChange = (dayIndex, index, value) => {
        const updated = [...settings.workSchedule];
        updated[dayIndex] = [...updated[dayIndex]];
        updated[dayIndex][index] = formatTime(value);
        handleChange("workSchedule", updated);
    };

    // Времена суток
    const formatTime = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 4);

        let hours = numbers.slice(0, 2);
        let minutes = numbers.slice(2, 4);

        if (hours.length === 2) {
            let h = parseInt(hours, 10);
            if (h > 23) h = 23;
            hours = h.toString().padStart(2, '0');
        }

        if (minutes.length === 2) {
            let m = parseInt(minutes, 10);
            if (m > 59) m = 59;
            minutes = m.toString().padStart(2, '0');
        }

        let formattedValue = hours;
        if (minutes.length > 0) {
            formattedValue += ':' + minutes;
        }

        return formattedValue;
    };

    // Ошибки валидации
    const [errors, setErrors] = useState({});

    // Сохранение настроек в localStorage
    const handleSave = () => {
        const requisitesFromForm = methods.getValues("requisites");
        const newErrors = {};

        if (!settings.nickname.trim()) {
            newErrors.nickname = "Введите никнейм";
        }

        if (!settings.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = "Введите корректный Email";
        }

        if (!settings.password.trim()) {
            newErrors.password = "Введите пароль";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const newSettings = { ...settings, requisites: requisitesFromForm };

        setSettings(newSettings);
        setOriginalSettings(newSettings);
        localStorage.setItem("profileSettings", JSON.stringify(newSettings));
        methods.reset({ requisites: newSettings.requisites });
    };


    // Отмена изменений и возврат к исходникам
    const handleCancel = () => {
        setSettings(originalSettings);
        if (originalSettings.crmTheme !== theme) toggleTheme();
        setBackgroundImage(originalSettings.crmBackground);
        methods.reset({ requisites: originalSettings.requisites });
        setErrors({});
    };

    // Обработчик изменения фона
    const handleBackgroundChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundImage(reader.result);
                handleChange("crmBackground", reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="profile-main-wrapper">
            <Sidebar />
            <div className="profile-container hidden-scroll">

                {changed && (
                    <div className="save-cancel">
                        <button className="save-btn" onClick={handleSave}>Сохранить</button>
                        <button className="cancel-btn" onClick={handleCancel}>Отменить</button>
                    </div>
                )}

                <h3 className="title-section">Настройки профиля</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <img src="/avatar.jpg" alt="Avatar" className="avatar-profile" />
                        <div className="profile-fields">
                            <div className="form-group">
                                <label className="title-label">Юзер ID</label>
                                <span
                                    className="user-id-span"
                                    onClick={() => copyClientId(settings.userId || "Не назначен")}
                                    title="Нажмите для копирования"
                                >
                                    {settings.userId || "Не назначен"}
                                </span>
                            </div>
                            <div className="form-group">
                                <label className="title-label">ФИО</label>
                                <span className="user-fullname-span">
                                    {settings.fullName || "Не указано"}
                                </span>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Nickname</label>
                                <div className="input-error-container">
                                    <input
                                        name="nickname"
                                        type="text"
                                        value={settings.nickname}
                                        onChange={e => handleChange("nickname", e.target.value)}
                                        className={errors.nickname ? "input-error" : ""}
                                    />
                                    {errors.nickname && <div className="error-message">{errors.nickname}</div>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Password</label>
                                <div className="input-error-container">
                                    <div className="input-with-button">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={settings.password}
                                            onChange={e => handleChange("password", e.target.value)}
                                            className={errors.password ? "input-error" : ""}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            className="eye-button"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {errors.password && <div className="error-message">{errors.password}</div>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Email</label>
                                <div className="input-error-container">
                                    <input
                                        name="email"
                                        type="email"
                                        value={settings.email}
                                        onChange={e => handleChange("email", e.target.value)}
                                        className={errors.email ? "input-error" : ""}
                                    />
                                    {errors.email && <div className="error-message">{errors.email}</div>}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <h3 className="title-section">Реквизиты</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="avatar-padding"></div>
                        <div className="profile-fields">

                            <div className="form-group">
                                <label className="title-label">Реквизиты</label>
                                <FormProvider {...methods}>
                                    <Requisites control={methods.control} />
                                </FormProvider>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Оплата в час</label>
                                <div className="hourly-pay-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>UAH</th>
                                                <th>RUB</th>
                                                <th>USDT</th>
                                                <th>USD</th>
                                                <th>EUR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span>120</span></td>
                                                <td><span>120</span></td>
                                                <td><span>120</span></td>
                                                <td><span>120</span></td>
                                                <td><span>120</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Валюта учета</label>
                                <select
                                    value={settings.currency}
                                    onChange={e => handleChange("currency", e.target.value)}
                                >
                                    <option>UAH</option>
                                    <option>RUB</option>
                                    <option>USD</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="title-label">График работы</label>
                                <div className="work-schedule-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Пн</th>
                                                <th>Вт</th>
                                                <th>Ср</th>
                                                <th>Чт</th>
                                                <th>Пт</th>
                                                <th>Сб</th>
                                                <th>Вс</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {[...Array(7)].map((_, i) => (
                                                    <td key={i}>
                                                        <div className="time-inputs">
                                                            <input
                                                                type="text"
                                                                maxLength="5"
                                                                value={settings.workSchedule[i][0]}
                                                                onChange={e =>
                                                                    handleWorkScheduleChange(i, 0, e.target.value)
                                                                }
                                                            />
                                                            <span>|</span>
                                                            <input
                                                                type="text"
                                                                maxLength="5"
                                                                value={settings.workSchedule[i][1]}
                                                                onChange={e =>
                                                                    handleWorkScheduleChange(i, 1, e.target.value)
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Напоминания от бота</label>
                                <div className="bot-reminders">
                                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
                                        <label key={i}>
                                            <span>{day}</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.botReminders?.[i] || false}
                                                onChange={e => {
                                                    const updated = [...(settings.botReminders || Array(7).fill(false))];
                                                    updated[i] = e.target.checked;
                                                    handleChange("botReminders", updated);
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <h3 className="title-section">Интерфейс CRM</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="avatar-padding"></div>
                        <div className="profile-fields">
                            <div className="form-group">
                                <label className="title-label">Язык CRM</label>
                                <select
                                    value={settings.crmLanguage}
                                    onChange={e => handleChange("crmLanguage", e.target.value)}
                                >
                                    <option value="ua">Українська</option>
                                    <option value="ru">Русский</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Тема CRM</label>
                                <button
                                    className="theme-toggle"
                                    onClick={() => {
                                        toggleTheme();
                                        handleChange("crmTheme", settings.crmTheme === "light" ? "dark" : "light");
                                    }}
                                >
                                    {settings.crmTheme === "light" ? "🌙 Темная тема" : "☀️ Светлая тема"}
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Настройка фона</label>
                                <label className="upload-bg">
                                    <span>Загрузить фон</span>
                                    <input type="file" accept="image/*" onChange={handleBackgroundChange} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="title-section">Уведомления</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="avatar-padding"></div>
                        <div className="profile-fields">
                            <div className="form-group">
                                <label className="title-label">Звук уведомлений</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifySound}
                                        onChange={e => handleChange("notifySound", e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Счетчик уведомлений</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyCounter}
                                        onChange={e => handleChange("notifyCounter", e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="title-label">Уведомления в телеграм</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyTelegram}
                                        onChange={e => handleChange("notifyTelegram", e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Profile;
