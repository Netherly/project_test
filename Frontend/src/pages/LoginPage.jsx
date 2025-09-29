// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import ConfirmationModal from "../components/modals/confirm/ConfirmationModal";

function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // регистрация (UI + модалка)
  const [showRegister, setShowRegister] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [telegramLink, setTelegramLink] = useState("");

  const [regData, setRegData] = useState({
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  // основной логин: API + dev-фолбэк
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // прямой fetch, чтобы не тянуть сюда ещё один слой абстракции
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ login, password }),
      });

      if (!res.ok) {
        // если 401 — неуспешный логин; остальные ошибки попробуем обработать как текст
        if (res.status === 401) throw new Error("Неверный логин или пароль");
        let text = "";
        try {
          text = await res.text();
        } catch {}
        throw new Error(text || `Ошибка входа (HTTP ${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      if (data?.token) localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/home");
      return;
    } catch (err) {
      // dev-фолбэк для стенда без бэка
      if (login === "a" && password === "a") {
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
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    // здесь можно вставить POST на /api/auth/register
    const link = `https://t.me/pridumatLink${Math.floor(Math.random() * 100000)}`;
    setTelegramLink(link);
    setShowConfirm(true);
    setShowRegister(false);
    setRegData({
      fullName: "",
      birthDate: "",
      phone: "",
      email: "",
      username: "",
      password: "",
    });
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
              placeholder="Логин"
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
        <div className="modal-overlay-reg" onClick={() => setShowRegister(false)}>
          <div className="register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>Регистрация</h2>
              <span className="close-icon" onClick={() => setShowRegister(false)}>
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

            <form onSubmit={handleRegisterSubmit} className="register-form">
              <div className="form-fields">
                <input
                  type="text"
                  name="fullName"
                  value={regData.fullName}
                  onChange={handleRegisterChange}
                  placeholder="ФИО"
                  required
                />
                <input
                  type="date"
                  name="birthDate"
                  value={regData.birthDate}
                  onChange={handleRegisterChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  value={regData.phone}
                  onChange={handleRegisterChange}
                  placeholder="Телефон"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={regData.email}
                  onChange={handleRegisterChange}
                  placeholder="Почта @gmail.com"
                  required
                />
                <input
                  type="text"
                  name="username"
                  value={regData.username}
                  onChange={handleRegisterChange}
                  placeholder="Логин (Support-404, Dev-245)"
                  required
                />
                <p>
                  🌐 Подобрать никнейм можно с{" "}
                  <a href="https://science.involta.ru/glossary" target="_blank" rel="noreferrer">
                    сайта
                  </a>
                </p>
                <input
                  type="password"
                  name="password"
                  value={regData.password}
                  onChange={handleRegisterChange}
                  placeholder="Пароль"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit">Зарегистрироваться</button>
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
    </div>
  );
}

export default LoginPage;
