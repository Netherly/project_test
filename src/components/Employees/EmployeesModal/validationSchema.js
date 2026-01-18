import * as yup from 'yup';

export const employeeSchema = yup.object().shape({
  fullName: yup.string().required('ФИО сотрудника обязательно'),
  login: yup.string().required('Логин обязателен'),
  email: yup.string().email('Некорректный email').nullable(), 
  phone: yup.string().matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Некорректный формат телефона').nullable(),

});