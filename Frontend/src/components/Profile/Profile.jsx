import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Sidebar from "../Sidebar";
import Requisites from "../ui/Requisites/Requisites";
import { ThemeContext } from "../../context/ThemeContext";
import {
    fetchProfile,
    saveProfile,
    withDefaults,
    changePassword,
    createTelegramLink,
    unlinkTelegram,
    openTelegramDeepLink,
} from "../../api/profile";
import "../../styles/Profile.css";

function Profile() {
    const { theme, toggleTheme, setBackgroundImage } = useContext(ThemeContext);

    const emptySettings = useMemo(
        () => ({
            nickname: "",
            telegramUsername: null,
            photoLink: null,
            email: "",
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
            notifyTelegram: true,
        }),
        []
    );

    const [settings, setSettings] = useState(emptySettings);
    const [originalSettings, setOriginalSettings] = useState(emptySettings);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Смена пароля
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);

    // Никнейм
    const [editingNickname, setEditingNickname] = useState(false);
    const [editNicknameValue, setEditNicknameValue] = useState("");

    const methods = useForm({ defaultValues: { requisites: emptySettings.requisites } });
    const watchedRequisites = methods.watch("requisites");

    const changed =
        JSON.stringify({ ...settings, requisites: watchedRequisites }) !==
        JSON.stringify(originalSettings);

    const reloadProfile = async () => {
        const data = await fetchProfile();
        const serverSettings = withDefaults({ ...emptySettings, ...data });

        setSettings(serverSettings);
        setOriginalSettings(serverSettings);
        methods.reset({ requisites: serverSettings.requisites || emptySettings.requisites });
        setBackgroundImage(serverSettings.crmBackground || null);
        if (serverSettings.crmTheme !== theme) toggleTheme();
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchProfile();
                if (!mounted) return;
                const serverSettings = withDefaults({ ...emptySettings, ...data });

                setSettings(serverSettings);
                setOriginalSettings(serverSettings);
                methods.reset({ requisites: serverSettings.requisites || emptySettings.requisites });
                setBackgroundImage(serverSettings.crmBackground || null);
                if (serverSettings.crmTheme !== theme) toggleTheme();
            } catch (e) {
                console.error("Не удалось загрузить профиль:", e?.message || e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const copyClientId = (clientId) => {
        navigator.clipboard
            .writeText(clientId || "")
            .then(() => console.log("ID клиента скопирован:", clientId || ""))
            .catch((err) => console.error("Ошибка при копировании:", err));
    };

    const handleChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const formatTime = (value) => {
        const numbers = value.replace(/\D/g, "").slice(0, 4);
        let hours = numbers.slice(0, 2);
        let minutes = numbers.slice(2, 4);
        if (hours.length === 2) {
            let h = parseInt(hours, 10);
            if (h > 23) h = 23;
            hours = h.toString().padStart(2, "0");
        }
        if (minutes.length === 2) {
            let m = parseInt(minutes, 10);
            if (m > 59) m = 59;
            minutes = m.toString().padStart(2, "0");
        }
        let formattedValue = hours;
        if (minutes.length > 0) formattedValue += ":" + minutes;
        return formattedValue;
    };

    const handleWorkScheduleChange = (dayIndex, index, value) => {
        const updated = [...settings.workSchedule];
        updated[dayIndex] = [...updated[dayIndex]];
        updated[dayIndex][index] = formatTime(value);
        handleChange("workSchedule", updated);
    };

    const handleSave = async () => {
        const requisitesFromForm = methods.getValues("requisites");
        const newErrors = {};

        const anyPw = currentPassword || newPassword || confirmPassword;
        if (anyPw) {
            if (!currentPassword) newErrors.password = "Введите текущий пароль";
            else if (!newPassword) newErrors.password = "Введите новый пароль";
            else if (newPassword.length < 6) newErrors.password = "Новый пароль слишком короткий (мин. 6)";
            else if (newPassword !== confirmPassword) newErrors.password = "Пароли не совпадают";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        try {
            setSaving(true);

            if (anyPw) {
                await changePassword({ currentPassword, newPassword });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                console.log("Пароль обновлён");
            }

            const payload = { ...settings, requisites: requisitesFromForm };
            try {
                const updated = await saveProfile(payload);
                const normalized = withDefaults(updated);
                setSettings(normalized);
                setOriginalSettings(normalized);
                methods.reset({ requisites: normalized.requisites || emptySettings.requisites });

                if (normalized.nickname !== undefined && normalized.nickname !== null && normalized.nickname !== '') {
                    try { window.dispatchEvent(new CustomEvent('profile:nickname-updated', { detail: { nickname: normalized.nickname } })); } catch { }
                }
                try { window.dispatchEvent(new CustomEvent('profile:photo-updated', { detail: { photo: normalized.photoLink || null } })); } catch { }
                try { window.dispatchEvent(new CustomEvent('profile:background-updated', { detail: { background: normalized.crmBackground || null } })); } catch { }
                console.log("Профиль сохранён на сервере");
            } catch (e) {

                setErrors({ general: "Не удалось сохранить профиль. Проверьте авторизацию и попробуйте снова." });
            }
        } catch (e) {
            console.error("Не удалось сохранить профиль:", e?.message || e);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setSettings(originalSettings);

        setEditingNickname(false);
        setEditNicknameValue("");

        if (originalSettings.crmTheme !== theme) toggleTheme();
        setBackgroundImage(originalSettings.crmBackground);
        methods.reset({ requisites: originalSettings.requisites });
        setErrors({});
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleBackgroundChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            // без сервера
            setBackgroundImage(dataUrl);
            handleChange("crmBackground", dataUrl);
            console.log('Фон обновлён локально');
        };
        reader.readAsDataURL(file);

        // отправлять фон на сервер
        // try {
        //   const { url } = await uploadProfileBackground(file);
        //   setBackgroundImage(url);
        //   handleChange("crmBackground", url);
        //   console.log("Фон обновлён на сервере");
        // } catch (e) {
        //   console.error("Не удалось загрузить фон на сервер:", e?.message || e);
        // }

        event.target.value = "";
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result;
            const payload = { ...settings, photoLink: dataUrl };

            setSettings(payload);
            setOriginalSettings(payload);
            try {
                window.dispatchEvent(new CustomEvent("profile:photo-updated", { detail: { photo: dataUrl } }));
            } catch { }

            try {
                const updated = await saveProfile(payload);
                const normalized = withDefaults(updated);
                setSettings(normalized);
                setOriginalSettings(normalized);
                try {
                    window.dispatchEvent(new CustomEvent("profile:photo-updated", { detail: { photo: normalized.photoLink || dataUrl } }));
                } catch { }
                console.log("Аватар обновлён и сохранён на сервере");
            } catch (e) {

                console.warn("Не удалось сохранить аватар на сервер. Локально сохранено.", e?.message || e);
            }
        };

        reader.readAsDataURL(file);
        event.target.value = "";
    };

    const handleLinkTelegram = async () => {
        try {
            const { code, tgLink, httpsLink } = await createTelegramLink();
            await openTelegramDeepLink({ tg: tgLink, https: httpsLink, code });
            console.log("Открыл Telegram для привязки:", code);
            setTimeout(() => reloadProfile(), 2000);
        } catch (e) {
            console.error("Не удалось получить ссылку для привязки:", e?.message || e);
        }
    };

    const handleUnlinkTelegram = async () => {
        try {
            await unlinkTelegram();
            handleChange("telegramUsername", null);
            await reloadProfile();
        } catch (e) {
            console.error("Не удалось отвязать Telegram:", e?.message || e);
            setErrors({ general: "Не удалось отвязать Telegram. Попробуйте снова." });
        }
    };

    if (loading) {
        return (
            <div className="profile-main-wrapper">
                <Sidebar />
                <div className="profile-container hidden-scroll">
                    <h3 className="profile-title-section">Загрузка профиля…</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-main-wrapper">
            <Sidebar />
            <div className="profile-container hidden-scroll">
                {changed && (
                    <div className="profile-save-cancel">
                        <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Сохраняю…" : "Сохранить"}
                        </button>
                        <button className="profile-cancel-btn" onClick={handleCancel} disabled={saving}>
                            Отменить
                        </button>
                    </div>
                )}
                {errors.general && (
                    <div className="profile-error-message">{errors.general}</div>
                )}

                <h3 className="profile-title-section">
                    Настройки профиля{" "}
                    <button className="profile-refresh-btn" onClick={reloadProfile} title="Обновить данные">
                        ⟳
                    </button>
                </h3>

                <div className="profile-box">
                    <div className="profile-header">
                        <div className="profile-avatar-container">
                            <img
                                src={settings.photoLink || "/avatar.jpg"}
                                alt="Avatar"
                                className="profile-avatar"
                            />
                            <label className="profile-avatar-overlay" title="Сменить аватар">
                                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                <span className="profile-avatar-edit">✎</span>
                            </label>
                        </div>
                        <div className="profile-fields">
                            <div className="profile-form-group">
                                <label className="profile-label">Юзер ID</label>
                                <span
                                    className="profile-user-id"
                                    onClick={() => copyClientId(settings.userId || "Не назначен")}
                                    title="Нажмите для копирования"
                                >
                                    {settings.userId || "Не назначен"}
                                </span>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">ФИО</label>
                                <span className="profile-user-fullname">
                                    {settings.fullName || "Не указано"}
                                </span>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">Nickname</label>
                                <div className="profile-input-error-container">
                                    {!editingNickname ? (
                                        <div className="profile-inline">
                                            <span className="profile-user-fullname">{settings.nickname || "Не назначен"}</span>
                                            <button
                                                type="button"
                                                className="profile-edit-btn"
                                                title="Редактировать никнейм"
                                                onClick={() => { setEditNicknameValue(settings.nickname || ""); setEditingNickname(true); }}
                                            >
                                                ✎
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="profile-inline-edit">
                                            <input
                                                name="nickname"
                                                type="text"
                                                value={editNicknameValue}
                                                onChange={(e) => setEditNicknameValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        setSettings((prev) => ({ ...prev, nickname: editNicknameValue }));
                                                        setEditingNickname(false);
                                                    } else if (e.key === "Escape") {
                                                        setEditingNickname(false);
                                                    }
                                                }}
                                                className="profile-text-input"
                                                autoFocus
                                            />
                                            <button type="button" className="profile-save-small" onClick={() => { setSettings((prev) => ({ ...prev, nickname: editNicknameValue })); if (editNicknameValue !== undefined && editNicknameValue !== null && editNicknameValue !== '') { try { window.dispatchEvent(new CustomEvent('profile:nickname-updated', { detail: { nickname: editNicknameValue } })); } catch { } } setEditingNickname(false); }}>
                                                ✓
                                            </button>
                                            <button type="button" className="profile-cancel-small" onClick={() => { setEditingNickname(false); setEditNicknameValue(""); }}>
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">Email</label>
                                <div className="profile-input-error-container">
                                    <span className="profile-user-fullname">{settings.email || "Не назначен"}</span>
                                </div>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">Смена пароля</label>
                                <div className="profile-pw-fields">
                                    <div className="profile-input-error-container">
                                        <div className="profile-input-with-button">
                                            <input
                                                name="currentPassword"
                                                type={showCur ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Текущий пароль"
                                                className="profile-text-input"
                                            />
                                            <button type="button" onClick={() => setShowCur((p) => !p)} className="profile-eye-button">
                                                {showCur ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="profile-input-error-container">
                                        <div className="profile-input-with-button">
                                            <input
                                                name="newPassword"
                                                type={showNew ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Новый пароль"
                                                className="profile-text-input"
                                            />
                                            <button type="button" onClick={() => setShowNew((p) => !p)} className="profile-eye-button">
                                                {showNew ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="profile-input-error-container">
                                        <div className="profile-input-with-button">
                                            <input
                                                name="confirmPassword"
                                                type={showConf ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Подтвердите пароль"
                                                className="profile-text-input"
                                            />
                                            <button type="button" onClick={() => setShowConf((p) => !p)} className="profile-eye-button">
                                                {showConf ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {errors.password && (
                                        <div className="profile-error-message">{errors.password}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="profile-title-section">Реквизиты</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="profile-avatar-spacer" />
                        <div className="profile-fields">
                            <div className="profile-form-group">
                                <label className="profile-label">Реквизиты</label>
                                <FormProvider {...methods}>
                                    <Requisites control={methods.control} />
                                </FormProvider>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">Оплата в час</label>
                                <div className="profile-hourly-pay-table">
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

                            <div className="profile-form-group">
                                <label className="profile-label">Валюта учета</label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => handleChange("currency", e.target.value)}
                                    className="profile-select-input"
                                >
                                    <option value="" disabled hidden>Не выбрано</option>
                                    <option>UAH</option>
                                    <option>RUB</option>
                                    <option>USD</option>
                                </select>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">График работы</label>
                                <div className="profile-work-schedule-table">
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
                                                        <div className="profile-time-inputs">
                                                            <input
                                                                type="text"
                                                                maxLength="5"
                                                                value={settings.workSchedule[i][0]}
                                                                onChange={(e) => handleWorkScheduleChange(i, 0, e.target.value)}
                                                            />
                                                            <span>|</span>
                                                            <input
                                                                type="text"
                                                                maxLength="5"
                                                                value={settings.workSchedule[i][1]}
                                                                onChange={(e) => handleWorkScheduleChange(i, 1, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">Напоминания от бота</label>
                                <div className="profile-bot-reminders">
                                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
                                        <label key={i}>
                                            <span>{day}</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.botReminders?.[i] || false}
                                                onChange={(e) => {
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

                <h3 className="profile-title-section">Интерфейс CRM</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="profile-avatar-spacer" />
                        <div className="profile-fields">
                            <div className="profile-crm-controls">
                                <div className="profile-form-group">
                                    <label className="profile-label">Язык CRM</label>
                                    <select
                                        value={settings.crmLanguage}
                                        onChange={(e) => handleChange("crmLanguage", e.target.value)}
                                        className="profile-select-input profile-crm-control"
                                    >
                                        <option value="" disabled hidden>Не выбрано</option>
                                        <option value="ua">Українська</option>
                                        <option value="ru">Русский</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-label">Тема CRM</label>
                                    <button
                                        className="profile-theme-toggle profile-crm-control"
                                        onClick={() => {
                                            toggleTheme();
                                            handleChange("crmTheme", settings.crmTheme === "light" ? "dark" : "light");
                                        }}
                                    >
                                        {settings.crmTheme === "light" ? "🌙 Темная тема" : "☀️ Светлая тема"}
                                    </button>
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-label">Настройка фона</label>
                                    <label className="profile-upload-bg profile-crm-control">
                                        <span>Загрузить фон</span>
                                        <input type="file" accept="image/*" onChange={handleBackgroundChange} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="profile-title-section">Интеграция с Telegram</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="profile-avatar-spacer" />
                        <div className="profile-fields">
                            <div className="profile-form-group">
                                <label className="profile-label">Статус подключения</label>
                                {settings.telegramUsername ? (
                                    <div className="profile-telegram-status">
                                        <span>
                                            Ваш аккаунт привязан: <strong>@{settings.telegramUsername}</strong>
                                        </span>
                                        <div className="profile-tg-actions">
                                            <button className="profile-cancel-btn" onClick={handleUnlinkTelegram}>
                                                Отвязать
                                            </button>
                                            <button className="profile-link-btn" onClick={handleLinkTelegram} title="Подключить заново">
                                                Привязать повторно
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="profile-telegram-status">
                                        <span>Telegram не привязан.</span>
                                        <button className="profile-link-btn" onClick={handleLinkTelegram}>
                                            Привязать Telegram
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="profile-title-section">Уведомления</h3>
                <div className="profile-box">
                    <div className="profile-header">
                        <div className="profile-avatar-spacer" />
                        <div className="profile-fields">
                            <div className="profile-form-group">
                                <label className="profile-label">Звук уведомлений</label>
                                <label className="profile-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifySound}
                                        onChange={(e) => handleChange("notifySound", e.target.checked)}
                                    />
                                    <span className="profile-slider"></span>
                                </label>
                            </div>
                            <div className="profile-form-group">
                                <label className="profile-label">Счетчик уведомлений</label>
                                <label className="profile-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyCounter}
                                        onChange={(e) => handleChange("notifyCounter", e.target.checked)}
                                    />
                                    <span className="profile-slider"></span>
                                </label>
                            </div>
                            <div className="profile-form-group">
                                <label className="profile-label">Уведомления в телеграм</label>
                                <label className="profile-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyTelegram}
                                        onChange={(e) => handleChange("notifyTelegram", e.target.checked)}
                                    />
                                    <span className="profile-slider"></span>
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
