import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Copy,
  Eye,
  EyeOff,
  Link2,
  Link2Off,
  RefreshCcw,
  Save,
  Upload,
  X,
} from "lucide-react";
import Sidebar from "../Sidebar";
import PageHeaderIcon from "../HeaderIcon/PageHeaderIcon";
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
import { fetchFields, withDefaults as withFieldDefaults } from "../../api/fields";
import "../../styles/Profile.css";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_RE = /^[\p{L}\p{N}_.@-]+$/u;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const FALLBACK_CURRENCIES = ["UAH", "USD", "EUR", "RUB", "USDT"];

const normalizeOptionalText = (value) => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || null;
};

const normalizeRequiredText = (value) => {
  return String(value === null || value === undefined ? "" : value).trim();
};

const normalizeCurrencyCode = (value) => {
  const text = normalizeOptionalText(value);
  return text ? text.toUpperCase() : "";
};

const formatTime = (value) => {
  const numbers = String(value || "").replace(/\D/g, "").slice(0, 4);
  let hours = numbers.slice(0, 2);
  let minutes = numbers.slice(2, 4);

  if (hours.length === 2) {
    const safeHours = Math.min(23, Number(hours) || 0);
    hours = String(safeHours).padStart(2, "0");
  }
  if (minutes.length === 2) {
    const safeMinutes = Math.min(59, Number(minutes) || 0);
    minutes = String(safeMinutes).padStart(2, "0");
  }

  return minutes.length ? `${hours}:${minutes}` : hours;
};

const sanitizeRequisites = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      currency: normalizeCurrencyCode(item?.currency),
      bank: normalizeRequiredText(item?.bank),
      account: normalizeRequiredText(item?.account),
    }))
    .filter((item) => item.currency || item.bank || item.account);

const buildComparableState = (settings, requisites) => ({
  nickname: normalizeRequiredText(settings?.nickname),
  fullName: normalizeRequiredText(settings?.fullName),
  email: normalizeOptionalText(settings?.email),
  photoLink: normalizeOptionalText(settings?.photoLink),
  currency: normalizeCurrencyCode(settings?.currency) || "UAH",
  workSchedule: Array.isArray(settings?.workSchedule)
    ? settings.workSchedule.map((day) => [
        normalizeRequiredText(day?.[0]),
        normalizeRequiredText(day?.[1]),
      ])
    : Array.from({ length: 7 }, () => ["09:00", "18:00"]),
  botReminders: Array.isArray(settings?.botReminders)
    ? settings.botReminders.map(Boolean)
    : Array(7).fill(false),
  crmLanguage: normalizeRequiredText(settings?.crmLanguage) || "ru",
  crmTheme: settings?.crmTheme === "light" ? "light" : "dark",
  crmBackground: normalizeOptionalText(settings?.crmBackground),
  notifySound: !!settings?.notifySound,
  notifyCounter: !!settings?.notifyCounter,
  notifyTelegram: !!settings?.notifyTelegram,
  requisites: sanitizeRequisites(requisites),
});

const buildCurrencyOptions = (fieldsPayload) => {
  try {
    const allFields = withFieldDefaults(fieldsPayload);
    const currencies = Array.isArray(allFields?.generalFields?.currency)
      ? allFields.generalFields.currency
      : [];

    const options = currencies
      .map((item) => {
        if (typeof item === "string") return normalizeCurrencyCode(item);
        return normalizeCurrencyCode(item?.code || item?.name || item?.value);
      })
      .filter(Boolean);

    return options.length ? Array.from(new Set(options)) : FALLBACK_CURRENCIES;
  } catch (_) {
    return FALLBACK_CURRENCIES;
  }
};

function Profile() {
  const { setTheme, setBackgroundImage } = useContext(ThemeContext);

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
      workSchedule: Array.from({ length: 7 }, () => ["09:00", "18:00"]),
      botReminders: Array(7).fill(false),
      crmLanguage: "ru",
      crmTheme: "dark",
      crmBackground: null,
      notifySound: true,
      notifyCounter: true,
      notifyTelegram: true,
    }),
    []
  );

  const [settings, setSettings] = useState(emptySettings);
  const [originalSettings, setOriginalSettings] = useState(emptySettings);
  const [currencyOptions, setCurrencyOptions] = useState(FALLBACK_CURRENCIES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const methods = useForm({ defaultValues: { requisites: emptySettings.requisites } });
  const watchedRequisites = methods.watch("requisites");

  const clearError = useCallback((key) => {
    setErrors((prev) => {
      if (!prev[key] && !prev.general) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.general;
      return next;
    });
  }, []);

  const applyProfile = useCallback(
    (data) => {
      const serverSettings = withDefaults({ ...emptySettings, ...data });
      setSettings(serverSettings);
      setOriginalSettings(serverSettings);
      methods.reset({ requisites: serverSettings.requisites || emptySettings.requisites });
      setTheme(serverSettings.crmTheme === "light" ? "light" : "dark");
      setBackgroundImage(serverSettings.crmBackground || null);
      setErrors({});
    },
    [emptySettings, methods, setBackgroundImage, setTheme]
  );

  const loadProfile = useCallback(async () => {
    const data = await fetchProfile();
    applyProfile(data);
  }, [applyProfile]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        setLoading(true);
        const [profileData, fieldsData] = await Promise.all([
          fetchProfile(),
          fetchFields().catch(() => null),
        ]);
        if (!mounted) return;
        applyProfile(profileData);
        if (fieldsData) {
          setCurrencyOptions(buildCurrencyOptions(fieldsData));
        }
      } catch (error) {
        console.error("Не удалось загрузить профиль:", error?.message || error);
        if (mounted) {
          setErrors({ general: "Не удалось загрузить профиль." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, [applyProfile]);

  const hasPasswordDraft = Boolean(currentPassword || newPassword || confirmPassword);
  const changed =
    JSON.stringify(buildComparableState(settings, watchedRequisites)) !==
      JSON.stringify(buildComparableState(originalSettings, originalSettings.requisites)) ||
    hasPasswordDraft;

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value || "");
    } catch (error) {
      console.error("Не удалось скопировать:", error);
    }
  };

  const handleChange = (field, value) => {
    clearError(field);
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkScheduleChange = (dayIndex, index, value) => {
    clearError("workSchedule");
    setSettings((prev) => {
      const updated = [...prev.workSchedule];
      updated[dayIndex] = [...updated[dayIndex]];
      updated[dayIndex][index] = formatTime(value);
      return { ...prev, workSchedule: updated };
    });
  };

  const validateProfile = (requisitesFromForm) => {
    const nextErrors = {};
    const nickname = normalizeRequiredText(settings.nickname);
    const fullName = normalizeRequiredText(settings.fullName);
    const email = normalizeOptionalText(settings.email);
    const currency = normalizeCurrencyCode(settings.currency);
    const requisites = sanitizeRequisites(requisitesFromForm);

    if (!nickname) {
      nextErrors.nickname = "Укажите nickname";
    } else if (nickname.length > 50) {
      nextErrors.nickname = "Nickname слишком длинный";
    } else if (!LOGIN_RE.test(nickname)) {
      nextErrors.nickname = "Nickname содержит недопустимые символы";
    }

    if (!fullName) {
      nextErrors.fullName = "Укажите ФИО";
    } else if (fullName.length > 120) {
      nextErrors.fullName = "ФИО слишком длинное";
    }

    if (email && !EMAIL_RE.test(email)) {
      nextErrors.email = "Некорректный email";
    }

    if (!currency) {
      nextErrors.currency = "Выберите валюту учета";
    }

    if (!Array.isArray(settings.workSchedule) || settings.workSchedule.length !== 7) {
      nextErrors.workSchedule = "График работы должен содержать 7 дней";
    } else {
      const invalidDayIndex = settings.workSchedule.findIndex((day) => {
        const from = normalizeRequiredText(day?.[0]);
        const to = normalizeRequiredText(day?.[1]);
        if (!TIME_RE.test(from) || !TIME_RE.test(to)) return true;
        return from >= to;
      });
      if (invalidDayIndex >= 0) {
        nextErrors.workSchedule = `Проверьте время в дне ${WEEKDAYS[invalidDayIndex]}`;
      }
    }

    const badRequisite = requisites.find(
      (item) =>
        (item.currency && !/^[A-Z0-9._-]{2,10}$/.test(item.currency)) ||
        item.bank.length > 100 ||
        item.account.length > 1000
    );
    if (badRequisite) {
      nextErrors.requisites = "Проверьте заполнение реквизитов";
    }

    if (hasPasswordDraft) {
      if (!currentPassword) {
        nextErrors.password = "Введите текущий пароль";
      } else if (!newPassword) {
        nextErrors.password = "Введите новый пароль";
      } else if (newPassword.length < 6) {
        nextErrors.password = "Новый пароль слишком короткий (мин. 6)";
      } else if (newPassword !== confirmPassword) {
        nextErrors.password = "Пароли не совпадают";
      }
    }

    return { nextErrors, requisites };
  };

  const dispatchProfileSync = (profile) => {
    try {
      window.dispatchEvent(
        new CustomEvent("profile:nickname-updated", {
          detail: { nickname: profile.nickname || "" },
        })
      );
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent("profile:photo-updated", {
          detail: { photo: profile.photoLink || null },
        })
      );
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent("profile:background-updated", {
          detail: { background: profile.crmBackground || null },
        })
      );
    } catch {}
  };

  const handleSave = async () => {
    const requisitesFromForm = methods.getValues("requisites");
    const { nextErrors, requisites } = validateProfile(requisitesFromForm);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (hasPasswordDraft) {
        try {
          await changePassword({ currentPassword, newPassword });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } catch (error) {
          setErrors({ password: error?.message || "Не удалось сменить пароль" });
          return;
        }
      }

      const payload = {
        ...settings,
        nickname: normalizeRequiredText(settings.nickname),
        fullName: normalizeRequiredText(settings.fullName),
        email: normalizeOptionalText(settings.email),
        currency: normalizeCurrencyCode(settings.currency),
        crmLanguage: settings.crmLanguage || "ru",
        crmTheme: settings.crmTheme === "light" ? "light" : "dark",
        requisites,
      };

      const updated = await saveProfile(payload);
      applyProfile(updated);
      dispatchProfileSync(updated);
    } catch (error) {
      console.error("Не удалось сохранить профиль:", error?.message || error);
      setErrors({
        general: error?.message || "Не удалось сохранить профиль. Попробуйте снова.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    applyProfile(originalSettings);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCur(false);
    setShowNew(false);
    setShowConf(false);
  };

  const handleReload = async () => {
    if (changed) {
      setErrors({ general: "Сначала сохраните или отмените изменения профиля." });
      return;
    }

    try {
      setLoading(true);
      await loadProfile();
    } catch (error) {
      setErrors({ general: error?.message || "Не удалось обновить профиль." });
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setBackgroundImage(dataUrl);
      handleChange("crmBackground", dataUrl);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleChange("photoLink", reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleThemeChange = (nextTheme) => {
    const normalized = nextTheme === "light" ? "light" : "dark";
    setTheme(normalized);
    handleChange("crmTheme", normalized);
  };

  const ensureTelegramActionAllowed = () => {
    if (changed) {
      setErrors({ general: "Сначала сохраните или отмените изменения профиля." });
      return false;
    }
    return true;
  };

  const handleLinkTelegram = async () => {
    if (!ensureTelegramActionAllowed()) return;

    try {
      const { code, tgLink, httpsLink } = await createTelegramLink();
      await openTelegramDeepLink({ tg: tgLink, https: httpsLink, code });
      setTimeout(() => {
        loadProfile().catch(() => {});
      }, 2000);
    } catch (error) {
      console.error("Не удалось получить ссылку для привязки:", error?.message || error);
      setErrors({ general: "Не удалось создать ссылку для Telegram." });
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!ensureTelegramActionAllowed()) return;

    try {
      await unlinkTelegram();
      await loadProfile();
    } catch (error) {
      console.error("Не удалось отвязать Telegram:", error?.message || error);
      setErrors({ general: error?.message || "Не удалось отвязать Telegram." });
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-page-content hidden-scroll">
          <div className="profile-page-shell">
            <h2 className="profile-page-loading">Загрузка профиля…</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-page-content hidden-scroll">
        <div className="profile-page-shell">
          <header className="profile-page-header">
            <h1 className="profile-page-title">
              <PageHeaderIcon pageName={"Настройки"} />
              Профиль
            </h1>

            <div className="profile-page-actions">
              <button
                type="button"
                className="profile-icon-button"
                onClick={handleReload}
                title="Обновить профиль"
                disabled={saving}
              >
                <RefreshCcw size={18} />
              </button>

              {changed && (
                <>
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X size={16} />
                    Отменить
                  </button>
                  <button
                    type="button"
                    className="profile-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? "Сохраняю…" : "Сохранить"}
                  </button>
                </>
              )}
            </div>
          </header>

          {errors.general && <div className="profile-banner-error">{errors.general}</div>}

          <section className="profile-section-card profile-section-hero">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-container">
                <img
                  src={settings.photoLink || "/avatar.jpg"}
                  alt="Avatar"
                  className="profile-avatar"
                />
                <label className="profile-avatar-overlay" title="Сменить аватар">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  <Upload size={16} />
                </label>
              </div>
            </div>

            <div className="profile-main-grid">
              <div className="profile-field">
                <label>Юзер ID</label>
                <div className="profile-readonly-row">
                  <span className="profile-readonly-value">{settings.userId || "Не назначен"}</span>
                  <button
                    type="button"
                    className="profile-inline-icon"
                    onClick={() => copyText(settings.userId || "")}
                    title="Копировать ID"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label>ФИО</label>
                <input
                  value={settings.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={`profile-input ${errors.fullName ? "profile-input-error" : ""}`}
                  placeholder="Введите ФИО"
                />
                {errors.fullName && <p className="profile-field-error">{errors.fullName}</p>}
              </div>

              <div className="profile-field">
                <label>Nickname</label>
                <input
                  value={settings.nickname}
                  onChange={(e) => handleChange("nickname", e.target.value)}
                  className={`profile-input ${errors.nickname ? "profile-input-error" : ""}`}
                  placeholder="Введите nickname"
                />
                {errors.nickname && <p className="profile-field-error">{errors.nickname}</p>}
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`profile-input ${errors.email ? "profile-input-error" : ""}`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="profile-field-error">{errors.email}</p>}
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-head">
              <h2>Безопасность</h2>
            </div>

            <div className="profile-password-grid">
              <div className="profile-field">
                <label>Текущий пароль</label>
                <div className="profile-input-with-action">
                  <input
                    type={showCur ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      clearError("password");
                      setCurrentPassword(e.target.value);
                    }}
                    className={`profile-input ${errors.password ? "profile-input-error" : ""}`}
                    placeholder="Текущий пароль"
                  />
                  <button
                    type="button"
                    className="profile-inline-icon"
                    onClick={() => setShowCur((prev) => !prev)}
                  >
                    {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label>Новый пароль</label>
                <div className="profile-input-with-action">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      clearError("password");
                      setNewPassword(e.target.value);
                    }}
                    className={`profile-input ${errors.password ? "profile-input-error" : ""}`}
                    placeholder="Новый пароль"
                  />
                  <button
                    type="button"
                    className="profile-inline-icon"
                    onClick={() => setShowNew((prev) => !prev)}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label>Подтверждение</label>
                <div className="profile-input-with-action">
                  <input
                    type={showConf ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      clearError("password");
                      setConfirmPassword(e.target.value);
                    }}
                    className={`profile-input ${errors.password ? "profile-input-error" : ""}`}
                    placeholder="Подтвердите пароль"
                  />
                  <button
                    type="button"
                    className="profile-inline-icon"
                    onClick={() => setShowConf((prev) => !prev)}
                  >
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {errors.password && <p className="profile-field-error">{errors.password}</p>}
          </section>

          <section className="profile-section-card">
            <div className="profile-section-head">
              <h2>Реквизиты и работа</h2>
            </div>

            <div className="profile-stack">
              <div className="profile-field profile-field-full">
                <label>Реквизиты</label>
                <FormProvider {...methods}>
                  <Requisites control={methods.control} />
                </FormProvider>
                {errors.requisites && <p className="profile-field-error">{errors.requisites}</p>}
              </div>

              <div className="profile-field">
                <label>Валюта учета</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className={`profile-input profile-select ${errors.currency ? "profile-input-error" : ""}`}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                {errors.currency && <p className="profile-field-error">{errors.currency}</p>}
              </div>

              <div className="profile-field profile-field-full">
                <label>График работы</label>
                <div className="profile-schedule-grid">
                  {WEEKDAYS.map((day, index) => (
                    <div key={day} className="profile-schedule-day">
                      <span className="profile-schedule-label">{day}</span>
                      <div className="profile-schedule-inputs">
                        <input
                          value={settings.workSchedule?.[index]?.[0] || ""}
                          onChange={(e) => handleWorkScheduleChange(index, 0, e.target.value)}
                          className={`profile-input ${errors.workSchedule ? "profile-input-error" : ""}`}
                          placeholder="09:00"
                          maxLength={5}
                        />
                        <input
                          value={settings.workSchedule?.[index]?.[1] || ""}
                          onChange={(e) => handleWorkScheduleChange(index, 1, e.target.value)}
                          className={`profile-input ${errors.workSchedule ? "profile-input-error" : ""}`}
                          placeholder="18:00"
                          maxLength={5}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.workSchedule && <p className="profile-field-error">{errors.workSchedule}</p>}
              </div>

              <div className="profile-field profile-field-full">
                <label>Напоминания от бота</label>
                <div className="profile-checkbox-row">
                  {WEEKDAYS.map((day, index) => (
                    <label key={day} className="profile-checkbox-chip">
                      <span>{day}</span>
                      <input
                        type="checkbox"
                        checked={!!settings.botReminders?.[index]}
                        onChange={(e) => {
                          const updated = [...(settings.botReminders || Array(7).fill(false))];
                          updated[index] = e.target.checked;
                          handleChange("botReminders", updated);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-head">
              <h2>Интерфейс CRM</h2>
            </div>

            <div className="profile-main-grid">
              <div className="profile-field">
                <label>Язык CRM</label>
                <select
                  value={settings.crmLanguage}
                  onChange={(e) => handleChange("crmLanguage", e.target.value)}
                  className="profile-input profile-select"
                >
                  <option value="ru">Русский</option>
                  <option value="ua">Українська</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="profile-field">
                <label>Тема CRM</label>
                <select
                  value={settings.crmTheme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="profile-input profile-select"
                >
                  <option value="dark">Темная</option>
                  <option value="light">Светлая</option>
                </select>
              </div>

              <div className="profile-field profile-field-full">
                <label>Фон CRM</label>
                <label className="profile-upload-button">
                  <Upload size={16} />
                  <span>Загрузить фон</span>
                  <input type="file" accept="image/*" onChange={handleBackgroundChange} />
                </label>
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-head">
              <h2>Интеграция с Telegram</h2>
            </div>

            <div className="profile-telegram-row">
              <div className="profile-telegram-status">
                {settings.telegramUsername ? (
                  <>
                    <span>
                      Ваш аккаунт привязан: <strong>@{settings.telegramUsername}</strong>
                    </span>
                    <div className="profile-inline-actions">
                      <button
                        type="button"
                        className="profile-cancel-btn"
                        onClick={handleUnlinkTelegram}
                      >
                        <Link2Off size={16} />
                        Отвязать
                      </button>
                      <button
                        type="button"
                        className="profile-link-btn"
                        onClick={handleLinkTelegram}
                      >
                        <Link2 size={16} />
                        Привязать заново
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>Telegram не привязан.</span>
                    <button type="button" className="profile-link-btn" onClick={handleLinkTelegram}>
                      <Link2 size={16} />
                      Привязать Telegram
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-head">
              <h2>Уведомления</h2>
            </div>

            <div className="profile-toggle-grid">
              <div className="profile-toggle-row">
                <span>Звук уведомлений</span>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifySound}
                    onChange={(e) => handleChange("notifySound", e.target.checked)}
                  />
                  <span className="profile-slider" />
                </label>
              </div>

              <div className="profile-toggle-row">
                <span>Счетчик уведомлений</span>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifyCounter}
                    onChange={(e) => handleChange("notifyCounter", e.target.checked)}
                  />
                  <span className="profile-slider" />
                </label>
              </div>

              <div className="profile-toggle-row">
                <span>Уведомления в Telegram</span>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifyTelegram}
                    onChange={(e) => handleChange("notifyTelegram", e.target.checked)}
                  />
                  <span className="profile-slider" />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;
