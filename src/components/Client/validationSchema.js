import * as yup from 'yup';

export const clientSchema = yup.object().shape({
  // === INFO ===
  name: yup.string().required('Клиент обязателен'),
  category: yup.string().required('Категория обязательна'),
  source: yup.string().required('Источник обязателен'),
  tags: yup.array().of(yup.string()).min(1, 'Выберите хотя бы один тег'),
  company_id: yup.string().required('Компания обязательна'),
  intro_description: yup.string().required('Вводное описание обязательно'),
  note: yup.string().required('Примечание обязательно'),

  // === CONTACTS ===
  full_name: yup.string().required('ФИО обязательно'),
  phone: yup
    .string()
    .required('Телефон обязателен')
    .matches(/^\+\d{7,}$/, 'Номер должен начинаться с "+" и содержать минимум 7 цифр'),
  email: yup
    .string()
    .required('Email обязателен')
    .email('Неверный формат'),
  country: yup.string().required('Страна обязательна'),
  city: yup.string().nullable(),
  chat_link: yup.string().nullable(),
  photo_link: yup.string().nullable(),
  folder_link: yup.string().nullable(),

  // === FINANCES ===
  currency: yup.string().required('Валюта обязательна'),
  payment_details: yup.string().nullable(),
  hourly_rate: yup
    .number()
    .typeError('Введите число')
    .nullable()
    .min(0, 'Не может быть меньше 0'),
  percent: yup
    .number()
    .typeError('Введите число')
    .required('Процент обязателен')
    .min(0, 'Не меньше 0')
    .max(100, 'Не больше 100'),
  share_info: yup.boolean(),
  referrer_id: yup.string().when('share_info', {
    is: true,
    then: s => s.required('Реферер обязателен при доле'),
    otherwise: s => s.notRequired()
  }),
  referrer_first_id: yup.string().nullable(),
  manager_id: yup.string().nullable(),

  // === ACCESS ===
  accesses: yup.array().of(
    yup.object().shape({
      name: yup.string().nullable(),
      login: yup.string().nullable(),
      password: yup.string().nullable(),
      description: yup.string().nullable()
    })
  )
});
