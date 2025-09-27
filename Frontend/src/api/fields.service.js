// src/api/fields.service.js
import http from './http'; // у тебя уже есть http.js (axios instance)

const base = '/fields';

const crud = (path) => ({
  list:   (params)        => http.get(`${base}/${path}`, { params }).then(r => r.data.data ?? r.data),
  create: (data)          => http.post(`${base}/${path}`, data).then(r => r.data.data ?? r.data),
  update: (id, data)      => http.patch(`${base}/${path}/${id}`, data).then(r => r.data.data ?? r.data),
  remove: (id, params={}) => http.delete(`${base}/${path}/${id}`, { params }).then(r => r.data.data ?? r.data),
});

export const FieldsAPI = {
  getBundle: () => http.get(`${base}/bundle`).then(r => r.data.data ?? r.data),

  countries:       crud('countries'),
  currencies:      crud('currencies'),
  clientSources:   crud('client-sources'),
  clientCategories:crud('client-categories'),
  executorRoles:   crud('executor-roles'),
  assetTypes:      crud('asset-types'),
  paymentSystems:  crud('payment-systems'),
  cardDesigns:     crud('card-designs'),
  orderIntervals:  crud('order-intervals'),
  orderCategories: {
    listByInterval: (intervalId, params) => http.get(`${base}/order-intervals/${intervalId}/categories`, { params }).then(r => r.data.data ?? r.data),
    create: (data)          => http.post(`${base}/order-categories`, data).then(r => r.data.data ?? r.data),
    update: (id, data)      => http.patch(`${base}/order-categories/${id}`, data).then(r => r.data.data ?? r.data),
    remove: (id, params={}) => http.delete(`${base}/order-categories/${id}`, { params }).then(r => r.data.data ?? r.data),
  },
  finance: {
    articles:      crud('finance/articles'),
    subcategories: crud('finance/subcategories'),
    subarticles:   crud('finance/subarticles'),
  },
};
