import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/LoginPage.css";

function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ login, password });
      // что именно возвращает ваш бэк? предположим { token, employee }
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      // флажок аутентификации можно оставить для совместимости
      localStorage.setItem("isAuthenticated", "true");

      navigate("/home");
    } catch (err) {
      setError(err.message || "Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
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
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
