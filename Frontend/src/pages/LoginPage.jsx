import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/LoginPage.css';

function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    
    if (login === "a" && password === "a") {
      localStorage.setItem("isAuthenticated", "true"); 
      navigate("/home");
    } else {
      setError("Неверный логин или пароль");
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
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Пароль"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Войти</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;