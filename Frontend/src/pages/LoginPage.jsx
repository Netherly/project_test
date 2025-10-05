import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";
import { api } from "../api/api"; // <-- если путь другой, поправьте импорт

function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // регистрация (UI + модалка)
  const [showRegister, setShowRegister] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
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

  // основной логин: API + тестовый фолбэк user/123456
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Пытаемся залогиниться через общий API-клиент
      const data = await api.login({ login, password }); // ожидаем { token, ... }
      if (data?.token) localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/home");
      return;
    } catch (err) {
      // 2) Тестовый фолбэк для стенда без бэка
      if (login === "user" && password === "123456") {
        localStorage.setItem("token", "dev-token-user-123456");
        localStorage.setItem("isAuthenticated", "true");
        navigate("/home");
        return;
      }
      setError(err?.message || "Не удалось выполнить вход");
    } finally {
      setLoading(false);
    }
  };

  // регистрация (пока без API, генерим ссылку и показываем модалку)
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegData((prev) => ({ ...prev, [name]: value }));
    setRegErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateRegistration = () => {
    const errors = {};
    let isValid = true;

    for (const key in regData) {
      if (regData[key].trim() === "") {
        errors[key] = true;
        isValid = false;
      }
    }

    if (regData.email.trim() !== "" && !regData.email.toLowerCase().endsWith("@gmail.com")) {
      errors.email = true;
      isValid = false;
    }

    if (regData.password !== regData.confirmPassword) {
      errors.password = true;
      errors.confirmPassword = true;
      isValid = false;
    }

    setRegErrors(errors);
    return isValid;
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    if (!validateRegistration()) {
      return;
    }

    // здесь можно вставить POST на /api/auth/register
    const link = `https://t.me/pridumatLink${Math.floor(Math.random() * 100000)}`;
    setTelegramLink(link);
    setShowConfirm(true);
    setShowRegister(false);
    resetRegForm();
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

  const getInputClassName = (name) => {
    return regErrors[name] ? "input-error" : "";
  };

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

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>

          <p className="register-link" onClick={() => setShowRegister(true)}>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
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
                </div>
                <div className="form-register-group">
                  <label htmlFor="birthDate">Дата рождения</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={regData.birthDate}
                    onChange={handleRegisterChange}
                    className={getInputClassName("birthDate")}
                    required
                  />
                </div>
                <div className="form-register-group">
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={regData.phone}
                    onChange={handleRegisterChange}
                    placeholder="Введите ваш номер телефона"
                    className={getInputClassName("phone")}
                    required
                  />
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
                  {regErrors.email && (
                    <p className="validation-hint">Почта должна быть в домене @gmail.com</p>
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
                    onBlur={() => setUsernameFocused(false)}
                    placeholder="Введите ваш логин"
                    className={getInputClassName("username")}
                    required
                  />
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
                    <p className="validation-hint">Пароли не совпадают</p>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Отправить заявку</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmationModal
          title="Регистрация отправлена!"
          message={
            <>
              Чтобы привязать Telegram, откройте ссылку:
              <br />
              <a href={telegramLink} target="_blank" rel="noreferrer">
                {telegramLink}
              </a>
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