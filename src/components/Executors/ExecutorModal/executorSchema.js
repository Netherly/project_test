import * as yup from "yup";

export const executorSchema = yup.object().shape({
  orderNumber: yup.string().required("Необходимо выбрать номер заказа"),
  performer: yup.string().required("Необходимо выбрать исполнителя"),
  role: yup.string().required("Необходимо выбрать роль"),
  dateForPerformer: yup.date().nullable().transform(v => (v instanceof Date && !isNaN(v) ? v : null)),
  hideClient: yup.boolean(),
  roundHours: yup.boolean(),
  currency: yup.string().required("Выберите валюту"),
  hourlyRate: yup.number().typeError("Должно быть числом").nullable().positive("Ставка должна быть положительной"),
  amountInput: yup.number().typeError("Должно быть числом").nullable(),
  maxAmount: yup.number().typeError("Должно быть числом").nullable().positive("Сумма должна быть положительной"),
});