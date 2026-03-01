import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import CreatableSelect from "../../Client/ClientModal/CreatableSelect"; 
import AutoResizeTextarea from "./AutoResizeTextarea";

const Finance = ({ control, orderFields, transactions = [], onAddNewField }) => {
  useFormContext();

  const totalIncome = (transactions || [])
    .filter((t) => t.operation === "Зачисление")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = (transactions || [])
    .filter((t) => t.operation === "Списание")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currencyOptions = (orderFields?.currency || [])
    .filter(c => !c.isDeleted)
    .map((curr) => {
      const value = (typeof curr === "string" ? curr : curr?.code ?? curr?.value ?? curr?.name) || "";
      return value;
    })
    .filter(Boolean);

  const discountReasonOptions = (orderFields?.discountReason || [])
    .filter(r => !r.isDeleted)
    .map(r => r.value ?? r.name ?? "")
    .filter(Boolean);

  const maxData = {
    ПартнерСумма: "2323",
    ВыручкаЗаказа: "34234234",
    СммаИсполнителям: "234234234234",
    вЧас: "111",
    Прибыль: "222222222",
    ПрибыльПроцентВыручки: "345345345",
    ПрибыльПроцентСуммы: "345345345345",
    Чаевые: "345345345345",
    ПрибыльПлюсЧаевые: "345345345345",
    Оплата: "77777",
    ОплатаВалюта: "888888",
    ОплатаАльтернатива: "678666",
    Возврат: "77777",
    ВозвратВалюта: "888888",
    ВозвратАльтернатива: "678666",
  };

  const fieldLabels = {
    ПартнерСумма: "Партнер сумма",
    ВыручкаЗаказа: "Выручка заказа",
    СммаИсполнителям: "Исполнителям сумма",
    вЧас: "В час",
    Прибыль: "Прибыль",
    ПрибыльПроцентВыручки: "Прибыль % от выручки",
    ПрибыльПроцентСуммы: "Прибыль % от суммы",
    Чаевые: "Чаевые",
    ПрибыльПлюсЧаевые: "Прибыль + чаевые",
    Оплата: "Оплата",
    ОплатаВалюта: "Оплата валюта",
    ОплатаАльтернатива: "Оплата альтернатива",
    Возврат: "Возврат",
    ВозвратВалюта: "Возврат валюта",
    ВозвратАльтернатива: "Возврат альтернатива",
  };

  const handlePercentChange = (value, onChange) => {
    let num = Number(value);
    if (Number.isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    onChange(num);
  };

  return (
    <div className="tab-content-container">
      <Controller
        name="share_percent"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Доля %</div>
            <input
              {...field}
              type="number"
              min="0"
              max="100"
              className="tab-content-input"
              placeholder="..."
              onChange={(e) => handlePercentChange(e.target.value, field.onChange)}
              value={field.value || ""}
            />
          </div>
        )}
      />

      <Controller
        name="budget"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Бюджет</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="minOrderAmount"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Мин. сумма</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="currency_type"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Валюта</div>
            <div style={{ width: "100%" }}>
              <CreatableSelect
                value={field.value}
                onChange={field.onChange}
                options={currencyOptions}
                placeholder="Выберите или введите..."
                onAdd={(val) => onAddNewField("generalFields", "currency", val)}
              />
            </div>
          </div>
        )}
      />

      <Controller
        name="currency_rate"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Курс валют</div>
            <input {...field} type="text" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="hourly_rate"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Ставка в час</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="round_hour"
        control={control}
        defaultValue={false}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Округление часа</div>
            <span className="modal-content-span-info-checkbox">
              <input
                type="checkbox"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            </span>
          </div>
        )}
      />

      <Controller
        name="discount"
        control={control}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Скидка</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="discountReason"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Причина скидки</div>
            <div style={{ width: "100%" }}>
              <CreatableSelect
                value={field.value}
                onChange={field.onChange}
                options={discountReasonOptions}
                placeholder="Выберите или введите..."
                onAdd={(val) => onAddNewField("orderFields", "discountReason", val)}
              />
            </div>
          </div>
        )}
      />

      <Controller
        name="upsell"
        control={control}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Апсейл</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="expenses"
        control={control}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Расходы</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      <Controller
        name="tips"
        control={control}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Чаевые</div>
            <input {...field} type="number" className="tab-content-input" placeholder="..." />
          </div>
        )}
      />

      {Object.entries(maxData).map(([key, value]) => (
        <div className="tab-content-row" key={key}>
          <div className="tab-content-title">{fieldLabels[key]}</div>
          <span className="modal-content-span-info">{value}</span>
        </div>
      ))}

      <Controller
        name="payment_details"
        control={control}
        render={({ field }) => (
          <div className="tab-content-row">
            <div className="tab-content-title">Реквизиты для оплаты</div>
            <AutoResizeTextarea
              {...field}
              className="workplan-textarea"
              placeholder="Введите реквизиты..."
            />
          </div>
        )}
      />

      <div className="tab-content-row-column">
        <div className="tab-content-title">Журнал операций</div>

        <div className="finances-log-table">
          <div className="finances-log-row header-row">
            <div className="finances-log-content-wrapper">
              <div className="finances-log-cell">Дата и время</div>
              <div className="finances-log-cell">Статья</div>
              <div className="finances-log-cell">Подстатья</div>
              <div className="finances-log-cell">Счет</div>
              <div className="finances-log-cell">Сумма</div>
            </div>
          </div>

          {transactions.length > 0 ? (
            transactions.map((trx) => (
              <div key={trx.id} className="finances-log-row">
                <div className="finances-log-content-wrapper">
                  <div className="finances-log-cell">
                    <input type="text" value={trx.date || ""} readOnly />
                  </div>
                  <div className="finances-log-cell">
                    <input type="text" value={trx.category || ""} readOnly />
                  </div>
                  <div className="finances-log-cell">
                    <input type="text" value={trx.subcategory || ""} readOnly />
                  </div>
                  <div className="finances-log-cell">
                    <input type="text" value={trx.account || ""} readOnly />
                  </div>
                  <div className="finances-log-cell">
                    <input
                      type="text"
                      value={`${Number(trx.amount || 0).toFixed(2)} ${trx.accountCurrency || ""}`}
                      className={
                        trx.operation === "Зачисление" ? "text-success" : "text-danger"
                      }
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              className="no-transactions"
              style={{
                textAlign: "center",
                padding: "20px",
                color: "var(--container-text-color)",
                opacity: 0.7,
              }}
            >
              Операции по этому заказу отсутствуют.
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          <div>Итого зачисления: {totalIncome.toFixed(2)}</div>
          <div>Итого списания: {totalExpense.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default Finance;