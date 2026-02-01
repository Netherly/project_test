import * as yup from 'yup';

const optionalString = () =>
  yup
    .string()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable();

export const employeeSchema = yup.object().shape({
  fullName: yup.string().required('ФИО сотрудника обязательно'),
  login: yup.string().required('Логин обязателен'),
  email: optionalString().email('Некорректный email'),
  phone: optionalString().matches(
    /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/,
    { message: 'Некорректный формат телефона', excludeEmptyString: true }
  ),
});
