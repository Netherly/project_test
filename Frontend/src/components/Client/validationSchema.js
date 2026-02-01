// src/components/Client/validationSchema.js
import * as yup from "yup";

/**
 * Теги у нас могут приходить:
 * - строкой: "VIP"
 * - объектом: { id, name, color, ... }
 * - иногда как relation: { tag: { id, name, color }, tagId, ... }
 */
const tagSchema = yup
  .mixed()
  .test("tag-shape", "Неверный тег", (value) => {
    if (typeof value === "string") return value.trim().length > 0;

    if (value && typeof value === "object") {
      const raw = value.tag ?? value;
      const name = raw?.name ?? raw?.value;
      return typeof name === "string" && name.trim().length > 0;
    }

    return false;
  });

const requiredOnCreate = (schema, message) =>
  schema.when('$isNew', {
    is: true,
    then: (s) => s.required(message),
    otherwise: (s) => s.notRequired(),
  });

const phoneSchema = yup
  .string()
  .nullable()
  .test('phone-format', 'Неверный формат телефона', (value) => {
    if (!value) return true;
    return /^\+?\d{7,15}$/.test(String(value).trim());
  });

export const clientSchema = yup.object().shape({
  // === INFO ===
  name: requiredOnCreate(yup.string(), 'Клиент обязателен'),
  category: requiredOnCreate(yup.string(), 'Категория обязательна'),
  source: requiredOnCreate(yup.string(), 'Источник обязателен'),
  tags: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required(),
        color: yup.string(),
      })
    )
    .when('$isNew', {
      is: true,
      then: (s) => s.min(1, 'Выберите хотя бы один тег').required('Теги обязательны'),
      otherwise: (s) => s.notRequired(),
    }),
  intro_description: requiredOnCreate(yup.string(), 'Вводное описание обязательно'),
  note: requiredOnCreate(yup.string(), 'Примечание обязательно'),

  // === CONTACTS ===
  full_name: requiredOnCreate(yup.string(), 'ФИО обязательно'),
  phone: requiredOnCreate(phoneSchema, 'Телефон обязателен'),
  email: requiredOnCreate(yup.string().email('Неверный формат'), 'Email обязателен'),
  country: requiredOnCreate(yup.string(), 'Страна обязательна'),
  city: yup.string().nullable(),
  chat_link: yup.string().nullable(),
  photo_link: yup.string().nullable(),
  folder_link: yup.string().nullable(),

  // === FINANCES ===
  currency: requiredOnCreate(yup.string(), 'Валюта обязательна'),
  payment_details: yup.string().nullable(),
  hourly_rate: yup.number().typeError("Введите число").nullable().min(0, "Не может быть меньше 0"),
  percent: requiredOnCreate(
    yup
      .number()
      .typeError('Введите число')
      .min(0, 'Не меньше 0')
      .max(100, 'Не больше 100'),
    'Процент обязателен'
  ),
  share_info: yup.boolean(),

  referrer_id: yup.string().when(['share_info', '$isNew'], {
    is: (shareInfo, isNew) => Boolean(shareInfo) && Boolean(isNew),
    then: (s) => s.required('Реферер обязателен при доле'),
    otherwise: (s) => s.notRequired(),
  }),

  referrer_first_id: yup.string().nullable(),
  manager_id: yup.string().nullable(),

  // === ACCESS ===
  accesses: yup.array().of(
    yup.object().shape({
      name: yup.string().nullable(),
      login: yup.string().nullable(),
      password: yup.string().nullable(),
      description: yup.string().nullable(),
    })
  ),
});
