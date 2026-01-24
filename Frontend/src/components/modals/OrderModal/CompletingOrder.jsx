import React from "react";
import { Controller, useWatch } from "react-hook-form";
import AutoResizeTextarea from "./AutoResizeTextarea";

const CompletingOrder = ({ control }) => {
  const completingTime = useWatch({ control, name: "completingTime" });
  const completingLink = useWatch({ control, name: "completingLink" });
  const stage = useWatch({ control, name: "stage" });

  const finalStages = ["Успешно завершен", "Завершен", "Неудачно завершен", "Удаленные"];
  const isFinalStage = finalStages.includes(stage);

  return (
    <div className="tab-content-container">
      <Controller
        name="completedDate"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Дата завершения заказа</div>
            <input type="date" className="tab-content-input" {...field} />
          </div>
        )}
      />

      <div className="tab-content-row">
        <div className="tab-content-title">Длительность заказа</div>
        <span className="modal-content-span-info">{completingTime || "—"}</span>
      </div>

      <Controller
        name="orderImpressions"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Впечатления о заказе</div>
            <AutoResizeTextarea {...field} placeholder="Введите впечатление о заказе" />
          </div>
        )}
      />

      <div className="tab-content-row">
        <div className="tab-content-title">Ссылка на форму для отзыва</div>
        {completingLink ? (
          <a
            href={completingLink}
            className="modal-content-span-info"
            target="_blank"
            rel="noopener noreferrer"
          >
            Перейти
          </a>
        ) : (
          <span className="modal-content-span-info">—</span>
        )}
      </div>

      {isFinalStage && (
        <>
          <div
            className="modal-separator"
            style={{ margin: "20px 0", borderBottom: "1px solid var(--border--color)" }}
          />

          <Controller
            name="readySolution"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="tab-content-row">
                <div className="tab-content-title">Готовое решение</div>
                <input
                  type="text"
                  className="tab-content-input"
                  placeholder="Телеграм бот / Кейс / и т.д."
                  {...field}
                />
              </div>
            )}
          />

          <Controller
            name="solutionLink"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="tab-content-row">
                <div className="tab-content-title">Ссылка на решение</div>
                <input type="text" className="tab-content-input" placeholder="https://..." {...field} />
              </div>
            )}
          />

          <Controller
            name="solutionCopyLink"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="tab-content-row">
                <div className="tab-content-title">Ссылка на копию решения</div>
                <input type="text" className="tab-content-input" placeholder="https://..." {...field} />
              </div>
            )}
          />

          <Controller
            name="additionalSolutionLinks"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="tab-content-row">
                <div className="tab-content-title">Доп ссылки на решение</div>
                <AutoResizeTextarea {...field} placeholder="Вставьте дополнительные ссылки" />
              </div>
            )}
          />
        </>
      )}
    </div>
  );
};

export default CompletingOrder;
