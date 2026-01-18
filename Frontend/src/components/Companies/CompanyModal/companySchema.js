import * as yup from 'yup';

export const companySchema = yup.object().shape({
    name: yup.string().required('Название компании обязательно'),
    phone: yup.string().nullable(),
    email: yup.string().email('Неверный формат email').nullable(),
});