import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchFields } from "../api/fields";
import {
  CACHE_TTL,
  hasDataChanged,
  readCacheSnapshot,
  writeCachedValue,
} from "../utils/resourceCache";

export const FieldsContext = createContext();

export const useFields = () => {
  const context = useContext(FieldsContext);
  if (!context) {
    throw new Error("useFields должен использоваться внутри FieldsProvider");
  }
  return context;
};

export const FieldsProvider = ({ children, authReady, isAuthenticated }) => {
  const [fields, setFields] = useState(() =>
    readCacheSnapshot("fieldsData").data
  );
  const [loading, setLoading] = useState(() => !readCacheSnapshot("fieldsData").hasData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    const snapshot = readCacheSnapshot("fieldsData", { ttlMs: CACHE_TTL.fields });
    if (snapshot.hasData) {
      setFields((prev) => (hasDataChanged(prev, snapshot.data) ? snapshot.data : prev));
      setLoading(false);
      if (snapshot.isFresh) {
        setError(null);
        return;
      }
    }

    let mounted = true;

    const loadFields = async () => {
      try {
        if (!snapshot.hasData) {
          setLoading(true);
        }
        setError(null);
        const data = await fetchFields();
        if (!mounted) return;
        setFields((prev) => (hasDataChanged(prev, data) ? data : prev));
        writeCachedValue("fieldsData", data);
      } catch (err) {
        if (!mounted) return;
        console.error("Ошибка загрузки полей:", err);
        setError(err?.message || "Не удалось загрузить поля");
        if (!snapshot.hasData) {
          setFields(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFields();

    return () => {
      mounted = false;
    };
  }, [authReady, isAuthenticated]);

  const refreshFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFields();
      setFields((prev) => (hasDataChanged(prev, data) ? data : prev));
      writeCachedValue("fieldsData", data);
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
