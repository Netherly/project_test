import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Sidebar from "../Sidebar";
import Requisites from "../ui/Requisites/Requisites";
import { ThemeContext } from "../../context/ThemeContext";
import { fetchProfile, saveProfile, uploadProfileBackground, withDefaults } from "../../api/profile";
import "../../styles/Profile.css";

function Profile() {
  const { theme, toggleTheme, setBackgroundImage } = useContext(ThemeContext);

  const emptySettings = useMemo(
    () => ({
      nickname: "",
      telegramUsername: null,
      password: "",
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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const methods = useForm({
    defaultValues: { requisites: emptySettings.requisites },
  });
  const watchedRequisites = methods.watch("requisites");
const handleLinkTelegram = () => {
  // Ваша логика для привязки аккаунта
  console.log("Привязка Telegram...");
  // Пример обновления состояния
  handleChange("telegramUsername", "my_user_name");
};

const handleUnlinkTelegram = () => {
  // Ваша логика для отвязки аккаунта
  console.log("Отвязка Telegram...");
  // Пример обновления состояния
  handleChange("telegramUsername", null);
};
  const changed =
    JSON.stringify({ ...settings, requisites: watchedRequisites }) !==
    JSON.stringify(originalSettings);

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
        if (serverSettings.crmBackground) setBackgroundImage(serverSettings.crmBackground);
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
  }, [emptySettings, methods, setBackgroundImage, theme, toggleTheme]);

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
    if (!settings.nickname.trim()) newErrors.nickname = "Введите никнейм";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) newErrors.email = "Введите корректный Email";
    if (!settings.password.trim()) newErrors.password = "Введите пароль";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const payload = { ...settings, requisites: requisitesFromForm };
    try {
      setSaving(true);
      const updated = await saveProfile(payload);
      const normalized = withDefaults(updated);
      setSettings(normalized);
      setOriginalSettings(normalized);
      methods.reset({ requisites: normalized.requisites || emptySettings.requisites });
      console.log("Профиль сохранён");
    } catch (e) {
      console.error("Не удалось сохранить профиль:", e?.message || e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    if (originalSettings.crmTheme !== theme) toggleTheme();
    setBackgroundImage(originalSettings.crmBackground);
    methods.reset({ requisites: originalSettings.requisites });
    setErrors({});
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadProfileBackground(file);
      if (!url) {
        console.error("Сервер не вернул url");
        return;
      }
      setBackgroundImage(url);
      handleChange("crmBackground", url);
      console.log("Фон обновлён");
    } catch (e) {
      console.error("Не удалось загрузить фон:", e?.message || e);
    } finally {
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="profile-main-wrapper">
        <Sidebar />
        <div className="profile-container hidden-scroll">
          <h3 className="title-section">Загрузка профиля…</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-main-wrapper">
      <Sidebar />
      <div className="profile-container hidden-scroll">
        {changed && (
          <div className="save-cancel">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Сохраняю…" : "Сохранить"}
            </button>
            <button className="cancel-btn" onClick={handleCancel} disabled={saving}>
              Отменить
            </button>
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
                <span className="user-fullname-span">{settings.fullName || "Не указано"}</span>
              </div>
              <div className="form-group">
                <label className="title-label">Nickname</label>
                <div className="input-error-container">
                  <input
                    name="nickname"
                    type="text"
                    value={settings.nickname}
                    onChange={(e) => handleChange("nickname", e.target.value)}
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
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={errors.password ? "input-error" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
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
                    onChange={(e) => handleChange("email", e.target.value)}
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
                        <td>
                          <span>120</span>
                        </td>
                        <td>
                          <span>120</span>
                        </td>
                        <td>
                          <span>120</span>
                        </td>
                        <td>
                          <span>120</span>
                        </td>
                        <td>
                          <span>120</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="form-group">
                <label className="title-label">Валюта учета</label>
                <select value={settings.currency} onChange={(e) => handleChange("currency", e.target.value)}>
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
              <div className="form-group">
                <label className="title-label">Напоминания от бота</label>
                <div className="bot-reminders">
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

        <h3 className="title-section">Интерфейс CRM</h3>
        <div className="profile-box">
          <div className="profile-header">
            <div className="avatar-padding"></div>
            <div className="profile-fields">
              <div className="form-group">
                <label className="title-label">Язык CRM</label>
                <select value={settings.crmLanguage} onChange={(e) => handleChange("crmLanguage", e.target.value)}>
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
         <h3 className="title-section">Интеграция с Telegram</h3>
<div className="profile-box">
  <div className="profile-header">
    <div className="avatar-padding"></div>
    <div className="profile-fields">
      <div className="form-group">
        <label className="title-label">Статус подключения</label>
        {settings.telegramUsername ? (
          <div className="telegram-status">
            <span>
              Ваш аккаунт привязан: <strong>@{settings.telegramUsername}</strong>
            </span>
            <button className="cancel-btn" onClick={handleUnlinkTelegram}>
              Отвязать
            </button>
          </div>
        ) : (
          <div className="telegram-status">
            <span>Telegram не привязан.</span>
            <button className="save-btn" onClick={handleLinkTelegram}>
              Привязать Telegram
            </button>
          </div>
        )}
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
                    onChange={(e) => handleChange("notifySound", e.target.checked)}
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
                    onChange={(e) => handleChange("notifyCounter", e.target.checked)}
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
                    onChange={(e) => handleChange("notifyTelegram", e.target.checked)}
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
