import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchFields } from "../api/fields";

export const FieldsContext = createContext();

export const useFields = () => {
  const context = useContext(FieldsContext);
  if (!context) {
    throw new Error("useFields должен использоваться внутри FieldsProvider");
  }
  return context;
};

export const FieldsProvider = ({ children }) => {
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка полей
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFields();
        setFields(data);
      } catch (err) {
        console.error("Ошибка загрузки полей:", err);
        setError(err?.message || "Не удалось загрузить поля");
        setFields(null);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, []);

  // ручная обнова полей
  const refreshFields = async () => {
    try {
      setLoading(true);
      const data = await fetchFields();
      setFields(data);
    } catch (err) {
      console.error("Ошибка обновления полей:", err);
      setError(err?.message || "Не удалось обновить поля");
    } finally {
      setLoading(false);
    }
  };

  // обратная совместимость
  const getFieldValues = (category, fieldName) => {
    if (!fields || !fields[category] || !fields[category][fieldName]) {
      return [];
    }
    const field = fields[category][fieldName];
    if (Array.isArray(field)) {
      return field
        .filter(item => !item.isDeleted)
        .map(item => item.value || item.code || item.name || item);
    }
    return [];
  };

  const value = {
    fields,
    loading,
    error,
    refreshFields,
    getFieldValues,

    // доступ к используемым полям
    
    currencies: getFieldValues("generalFields", "currency"),
    employeeCountries: getFieldValues("employeeFields", "country"),
    employeeTags: fields?.employeeFields?.tags || [],
    clientSources: getFieldValues("clientFields", "source"),
    clientCategories: getFieldValues("clientFields", "category"),
    clientCountries: getFieldValues("clientFields", "country"),
    clientTags: fields?.clientFields?.tags || [],
    executorRoles: getFieldValues("executorFields", "role"),
    assetTypes: getFieldValues("assetsFields", "type"),
    paymentSystems: getFieldValues("assetsFields", "paymentSystem"),
    orderStatuses: getFieldValues("orderFields", "statuses"),
  };

  return (
    <FieldsContext.Provider value={value}>
      {children}
    </FieldsContext.Provider>
  );
};
