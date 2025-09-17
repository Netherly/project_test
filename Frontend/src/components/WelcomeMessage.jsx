import { useState, useEffect } from "react";

import '../styles/WelcomeMessage.css';

const WelcomeMessage = () => {
  const [showModal, setShowModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const modalStatus = localStorage.getItem('showWelcomeModal');
    if (modalStatus !== 'false') {
      setShowModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    localStorage.setItem('showWelcomeModal', dontShowAgain ? 'false' : 'true');
  };

  const handleCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  if (!showModal) return null;

  return (
    <div className="welcome-modal">
      <div className="welcome-modal-content">
        <button className="close-btn" onClick={handleCloseModal}>
          ×
        </button>
        <div className="welcome-flex-container">
            <h2 className="welcome-title">Добро пожаловать, пользователь!</h2> 
            <p className="welcome-description-msg">Желаю вам продуктивного рабочего дня. Проверьте ваши текущие заказы.</p>
        </div>
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="dont-show-again"
            onChange={handleCheckboxChange}
          />
          <label htmlFor="dont-show-again">Больше не показывать это сообщение</label>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;