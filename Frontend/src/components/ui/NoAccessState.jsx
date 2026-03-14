import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import "./NoAccessState.css";

function hasUsefulHistoryEntry() {
  if (typeof window === "undefined") return false;

  const historyIndex = window.history?.state?.idx;
  if (typeof historyIndex === "number") {
    return historyIndex > 0;
  }

  return window.history.length > 1;
}

export default function NoAccessState({
  title = "Нет доступа",
  description,
  note = "",
  onBack,
  onHome,
  backLabel = "Назад",
  homeLabel = "На главную",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    if (hasUsefulHistoryEntry()) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  };

  const handleHome = () => {
    if (typeof onHome === "function") {
      onHome();
      return;
    }

    navigate("/dashboard");
  };

  return (
    <section className="no-access-state" aria-live="polite">
      <div className="no-access-state__card">
        <div className="no-access-state__icon" aria-hidden="true">
          <ShieldAlert size={24} strokeWidth={2} />
        </div>

        <div className="no-access-state__content">
          <h2 className="no-access-state__title">{title}</h2>
          <p className="no-access-state__description">{description}</p>
          {note ? <p className="no-access-state__note">{note}</p> : null}
        </div>

        <div className="no-access-state__actions">
          <button
            type="button"
            className="no-access-state__button no-access-state__button--ghost"
            onClick={handleBack}
          >
            {backLabel}
          </button>
          <button
            type="button"
            className="no-access-state__button no-access-state__button--primary"
            onClick={handleHome}
          >
            {homeLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
