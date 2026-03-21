import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import AutoResizeTextarea from "./AutoResizeTextarea";
import { Minus, Plus } from 'lucide-react';
import CreatableSelect from "../../../components/Client/ClientModal/CreatableSelect.jsx";

const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0,00';
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Finance = ({ control, orderFields, transactions = [], onAddNewField }) => {
  const { watch } = useFormContext();

  const totalIncome = (transactions || [])
    .filter((t) => t.operation === "Зачисление")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = (transactions || [])
    .filter((t) => t.operation === "Списание")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currencyOptions = (orderFields?.currency || [])
    .map((curr) => {
      return (typeof curr === "string" ? curr : curr?.code ?? curr?.value ?? curr?.name) || "";
    })
    .filter(Boolean);

  const discountReasonOptions = (orderFields?.discountReasons || [])
    .map((opt) => opt?.value ?? opt?.name ?? "")
    .filter(Boolean);

  // --- Вытаскиваем значения из формы ---
  const budget = parseFloat(watch('budget')) || 0;
  const partnerSum = parseFloat(watch('partner_payment')) || 0;
  const expenses = parseFloat(watch('expenses')) || 0;
  const tips = parseFloat(watch('tips')) || 0;
  const currencyRate = parseFloat(watch('currency_rate')) || 1;
  const performers = watch('performers') || [];
  const workLog = watch('work_log') || [];

  // --- Расчеты ---
  const executorsSum = performers.reduce((acc, p) => acc + (parseFloat(p.orderSum) || 0), 0);
  const revenue = budget;
  const profit = revenue - executorsSum - partnerSum - expenses;
  
  const profitPercentRev = revenue > 0 ? (profit / revenue) * 100 : 0;
  const profitPercentSum = executorsSum > 0 ? (profit / executorsSum) * 100 : 0; 
  const profitPlusTips = profit + tips;

  const totalMinutes = workLog.reduce((acc, entry) => {
    if (!entry.hours || typeof entry.hours !== 'string') return acc;
    const parts = entry.hours.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return acc + (hours * 60) + mins;
  }, 0);
  
  const perHour = totalMinutes > 0 ? profit / (totalMinutes / 60) : 0;

  const payment = totalIncome;
  const paymentCurrency = currencyRate > 0 ? payment / currencyRate : 0;
  const refund = totalExpense;
  const refundCurrency = currencyRate > 0 ? refund / currencyRate : 0;

  // Формируем финальные данные
  const displayData = {
    ПартнерСумма: formatNumber(partnerSum),
    ВыручкаЗаказа: formatNumber(revenue),
    СммаИсполнителям: formatNumber(executorsSum),
    вЧас: formatNumber(perHour),
    Прибыль: formatNumber(profit),
    ПрибыльПроцентВыручки: formatNumber(profitPercentRev) + '%',
    ПрибыльПроцентСуммы: formatNumber(profitPercentSum) + '%',
    Чаевые: formatNumber(tips),
    ПрибыльПлюсЧаевые: formatNumber(profitPlusTips),
    Оплата: formatNumber(payment),
    ОплатаВалюта: formatNumber(paymentCurrency),
    ОплатаАльтернатива: "0,00", // Если появится отдельный курс/логика — можно будет заменить
    Возврат: formatNumber(refund),
    ВозвратВалюта: formatNumber(refundCurrency),
    ВозвратАльтернатива: "0,00",
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
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 5, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Доля %</div>
              <div className="custom-number-input">
                <input
                  {...restField}
                  type="number"
                  min="0"
                  max="100"
                  className="tab-content-input"
                  placeholder="..."
                  onChange={(e) => handlePercentChange(e.target.value, onChange)}
                  value={value || ""}
                />
                <button type="button" className="num-btn minus-btn" onClick={() => handlePercentChange(Math.max(min, numValue - step), onChange)} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => handlePercentChange(numValue + step, onChange)} disabled={numValue >= 100}><Plus/></button>
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="budget"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 100, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Бюджет</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="minOrderAmount"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 100, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Мин. сумма</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
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
                value={field.value || ""}
                onChange={field.onChange}
                options={currencyOptions}
                placeholder="Выберите или введите валюту..."
                onAdd={(val) => onAddNewField && onAddNewField("generalFields", "currency", val)}
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
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Ставка в час</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
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
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 5, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Скидка</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
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
                value={field.value || ""}
                onChange={field.onChange}
                options={discountReasonOptions}
                placeholder="Укажите причину..."
                onAdd={(val) => onAddNewField && onAddNewField("orderFields", "discountReasons", val)}
              />
            </div>
          </div>
        )}
      />

      <Controller
        name="upsell"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Апсейл</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="expenses"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Расходы</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="tips"
        control={control}
        render={({ field: { onChange, value, ...restField } }) => {
          const min = 0, step = 10, numValue = parseFloat(value) || 0;
          return (
            <div className="tab-content-row">
              <div className="tab-content-title">Чаевые</div>
              <div className="custom-number-input">
                <input type="number" {...restField} value={value || ''} onChange={onChange} min={min} className="tab-content-input" placeholder="..." />
                <button type="button" className="num-btn minus-btn" onClick={() => onChange(Math.max(min, numValue - step))} disabled={numValue <= min}><Minus/></button>
                <button type="button" className="num-btn plus-btn" onClick={() => onChange(numValue + step)}><Plus/></button>
              </div>
            </div>
          );
        }}
      />

      {Object.entries(displayData).map(([key, value]) => (
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