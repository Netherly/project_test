import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";
import { api } from "../api/api";

function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [telegramLink, setTelegramLink] = useState("");

  const [usernameFocused, setUsernameFocused] = useState(false);

  const [regData, setRegData] = useState({
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const data = await api.login({ login, password });
      if (data?.token) localStorage.setItem("token", data.token);
      navigate("/dashboard");
      return;
    } catch (err) {
      const status = err?.status;
      if (status === 401 || status === 404) {
        setLoginError("Неверный логин или пароль");
      } else {
        setLoginError(err?.message || "Не удалось выполнить вход");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegData((prev) => ({ ...prev, [name]: value }));
    setRegisterError("");
    setRegErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const checkUsernameAvailability = async (value) => {
    const username = String(value || "").trim();
    if (!username) return;
    try {
      if (typeof api?.checkUsername === "function") {
        const res = await api.checkUsername({ username });
        if (!res?.available) {
          setRegErrors((prev) => ({ ...prev, username: "Такой логин уже занят" }));
        }
      }
    } catch {}
  };

  const validateRegistration = () => {
    const errors = {};
    let isValid = true;

    for (const key in regData) {
      if (String(regData[key] || "").trim() === "") {
        errors[key] = "Поле обязательно";
        isValid = false;
      }
    }

    if (
      regData.email.trim() !== "" &&
      !regData.email.toLowerCase().endsWith("@gmail.com")
    ) {
      errors.email = "Почта должна быть в домене @gmail.com";
      isValid = false;
    }

    const phone = regData.phone.trim();
    if (phone) {
      const hasPlus = phone.includes("+");
      const digitsOnly = /^[0-9]+$/.test(phone);
      const lengthOk = phone.length >= 11 && phone.length <= 14;
      const notStartsWithZero = !/^0/.test(phone);
      if (hasPlus || !digitsOnly || !lengthOk || !notStartsWithZero) {
        errors.phone =
          "Телефон должен быть без «+», только цифры, с кодом страны, 11–14 цифр, не начинается с 0 (пример: 380XXXXXXXXX).";
        isValid = false;
      }
    }

    const pwd = regData.password;
    if (pwd && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{6,}$/.test(pwd)) {
      errors.password =
        "Пароль должен быть не короче 6 символов, содержать строчную, заглавную, цифру и спецсимвол, без пробелов.";
      isValid = false;
    }

    if (
      regData.password.trim() !== "" &&
      regData.confirmPassword.trim() !== "" &&
      regData.password !== regData.confirmPassword
    ) {
      errors.password = errors.password || "Пароли не совпадают";
      errors.confirmPassword = "Пароли не совпадают";
      isValid = false;
    }

    setRegErrors(errors);
    return isValid;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegistration()) return;

    setRegisterError("");
    setLoading(true);
    try {
      const payload = {
        full_name: regData.fullName,
        birthDate: regData.birthDate || undefined,
        phone: regData.phone,
        email: regData.email,
        login: regData.username,
        password: regData.password,
      };
      await api.register(payload);

      const loginResp = await api.login({
        login: regData.username,
        password: regData.password,
      });
      if (loginResp?.token) {
        localStorage.setItem("token", loginResp.token);
      }

      const linkResp = await api.createTelegramLink();
      setTelegramLink(linkResp?.link || "");
      setConfirmMessage(
        "Профиль создан и вы вошли в систему. Для привязки Telegram нажмите ссылку ниже и нажмите Start в боте."
      );

      setShowConfirm(true);
      setShowRegister(false);
      resetRegForm();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const msg = (err?.message || err?.response?.data?.message || "").toString().toLowerCase();
      if (status === 409) {
        if (/email|почт/.test(msg)) {
          setRegErrors((prev) => ({ ...prev, email: "Такая почта уже используется" }));
        } else if (/username|login|логин/.test(msg)) {
          setRegErrors((prev) => ({ ...prev, username: "Такой логин уже занят" }));
        } else {
          setRegisterError("Логин или почта уже используются");
        }
      } else {
        setRegisterError(err?.message || "Ошибка при регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetRegForm = () => {
    setRegData({
      fullName: "",
      birthDate: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
    setRegErrors({});
    setRegisterError("");
    setUsernameFocused(false);
  };

  const handleCloseRegister = () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseRegister = () => {
    resetRegForm();
    setShowRegister(false);
    setShowCloseConfirm(false);
  };

  const getInputClassName = (name) => (regErrors[name] ? "input-error" : "");

  return (
    <div className="login-page">
      <div className="login-window">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-header">GSSE Team</h2>

          <div className="input-group">
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="login-input"
              placeholder="Логин / Почта"
              required
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Пароль"
              required
              autoComplete="current-password"
            />
          </div>

          {loginError && <p className="error-message">{loginError}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>

          <p
            className="register-link"
            onClick={() => {
              setLoginError("");
              setRegisterError("");
              setShowRegister(true);
            }}
          >
            Стать частью команды
          </p>
        </form>
      </div>

      {showRegister && (
        <div className="modal-overlay-reg" onClick={handleCloseRegister}>
          <div className="register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>Регистрация</h2>
              <span className="close-icon" onClick={handleCloseRegister}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
            </div>

            <form onSubmit={handleRegisterSubmit} className="register-form" noValidate>
              <div className="form-register-fields">
                <div className="form-register-group">
                  <label htmlFor="fullName">ФИО</label>
                  <input
                    type="text"
                    name="fullName"
                    value={regData.fullName}
                    onChange={handleRegisterChange}
                    placeholder="Введите полное ФИО"
                    className={getInputClassName("fullName")}
                    required
                  />
                  {regErrors.fullName && (
                    <p className="validation-hint">{regErrors.fullName}</p>
                  )}
                </div>
              <div className="form-register-group">
                  <label htmlFor="birthDate">Дата рождения</label>
                  {/* Додано спеціальний контейнер для стилізації іконки */}
                  <div className="date-input-container">
                    <input
                      type="date"
                      name="birthDate"
                      value={regData.birthDate}
                      onChange={handleRegisterChange}
                      
                      className={`date-input ${getInputClassName("birthDate")}`}
                      required
                    />
                  </div>
                  {regErrors.birthDate && (
                    <p className="validation-hint">{regErrors.birthDate}</p>
                  )}
                </div>
                <div className="form-register-group">
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={regData.phone}
                    onChange={(e) => {
                      handleRegisterChange(e);
                    }}
                    placeholder="Введите ваш номер телефона"
                    className={getInputClassName("phone")}
                    required
                  />
                  {regErrors.phone && (
                    <p className="validation-hint">{regErrors.phone}</p>
                  )}
                </div>
                <div className="form-register-group">
                  <label htmlFor="email">Почта</label>
                  <input
                    type="email"
                    name="email"
                    value={regData.email}
                    onChange={handleRegisterChange}
                    placeholder="Введите почту @gmail.com"
                    className={getInputClassName("email")}
                    required
                  />
                  {regErrors.email ? (
                    <p className="validation-hint">{regErrors.email}</p>
                  ) : (
                    regData.email && (
                      <p className="validation-hint">Почта должна быть в домене @gmail.com</p>
                    )
                  )}
                </div>
                <div className="form-register-group">
                  <label htmlFor="username">Логин</label>
                  <input
                    type="text"
                    name="username"
                    value={regData.username}
                    onChange={handleRegisterChange}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => {
                      setUsernameFocused(false);
                      checkUsernameAvailability(regData.username);
                    }}
                    placeholder="Введите ваш логин"
                    className={getInputClassName("username")}
                    required
                  />
                  {regErrors.username && (
                    <p className="validation-hint">{regErrors.username}</p>
                  )}
                </div>
                {usernameFocused && (
                  <p className="username-hint">
                    Отправьте ваш никнейм, который будет привязан к вам в системе.<br />
                    У нас правило, что никнейм должен быть связан с IT-сферой,
                    латинскими буквами и с цифрами в конце
                    (например: <b>Support-404</b>, <b>Dev-245</b>, <b>JSDev-008</b>).<br />
                    Подобрать себе никнейм можете с помощью{" "}
                    <a href="https://science.involta.ru/glossary" target="_blank" rel="noreferrer">
                      сайта
                    </a>.
                  </p>
                )}
                <div className="form-register-group">
                  <label htmlFor="password">Пароль</label>
                  <input
                    type="password"
                    name="password"
                    value={regData.password}
                    onChange={handleRegisterChange}
                    placeholder="Придумайте пароль"
                    className={getInputClassName("password")}
                    required
                  />
                  {regErrors.password && (
                    <p className="validation-hint">{regErrors.password}</p>
                  )}
                </div>
                <div className="form-register-group">
                  <label htmlFor="confirmPassword"></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={regData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Подтвердите пароль"
                    className={getInputClassName("confirmPassword")}
                    required
                  />
                  {regErrors.confirmPassword && (
                    <p className="validation-hint">{regErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="form-actions">
                {registerError && <p className="register-error">{registerError}</p>}
                <button type="submit" disabled={loading}>
                  {loading ? "Отправляем..." : "Отправить заявку"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmationModal
          title="Профиль создан"
          message={
            <>
              {confirmMessage}
              <br /><br />
              Ссылка для привязки Telegram:
              <br />
              {telegramLink ? (
                <a href={telegramLink} target="_blank" rel="noreferrer">
                  {telegramLink}
                </a>
              ) : (
                <span>ссылка не получена</span>
              )}
            </>
          }
          confirmText="OK"
          cancelText="Закрыть"
          onConfirm={() => setShowConfirm(false)}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showCloseConfirm && (
        <ConfirmationModal
          title="Закрыть регистрацию?"
          message="При закрытии все несохранённые данные будут стёрты. Продолжить?"
          confirmText="Да, закрыть"
          cancelText="Отмена"
          onConfirm={confirmCloseRegister}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </div>
  );
}

export default LoginPage;
