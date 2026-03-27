import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { clientSchema } from "../validationSchema";

import ClientHeader from "./ClientHeader";
import TabsNav from "./TabsNav";
import InfoTab from "./InfoTab";
import ContactsTab from "./ContactsTab";
import FinancesTab from "./FinancesTab";
import AccessesTab from "./AccessesTab";
import ChatPanel from "./ChatPanel";
import ActionsBar from "./ActionsBar";
import ImagePreviewModal from "../ImagePreviewModal";

import { useFields } from "../../../context/FieldsContext";
import { addFieldOption, fetchFields, withDefaults } from "../../../api/fields";
import { rid } from "../../../utils/rid";
import { RESOURCE_CACHE_EVENT } from "../../../utils/resourceCache";

import "../../../styles/ClientModal.css";

export default function ClientModal({
  client,
  companies = [],
  employees = [],
  referrers = [],
  countries = [],
  currencies = [],
  clients = [], 
  onClose,
  onSave,
  onAddCompany,
  onDelete,
  onAddOrder = () => {},
  onDuplicate = () => {},
}) {
  const safeClient = client ?? {};
  const isNew = !safeClient.id;

  const { refreshFields } = useFields();

  const [fieldOptions, setFieldOptions] = useState({
    categories: [],
    sources: [],
    businesses: [],
    countries: [],
    currencies: [],
    tags: [],
  });

  const [activeTab, setActiveTab] = useState(isNew ? "info" : "summary");
  const [showImage, setShowImage] = useState(false);
  const [closing, setClosing] = useState(false);
  const [formErrors, setFormErrors] = useState(null);

  const formId = "client-main-form";
  const formDefaults = useMemo(
    () => ({
      ...safeClient,
      tags: safeClient.tags ?? [],
      accesses: safeClient.accesses ?? [],
      share_info: safeClient.share_info ?? false,
    }),
    [safeClient]
  );

  const sampleLogs = [
    { timestamp: "2023-03-07T12:36", author: "Менеджеры", message: "Отримувач: …" },
    { timestamp: "2023-03-07T12:38", author: "Менеджеры", message: "ДУБЛЬ!!!!!!!!!!!" },
    { timestamp: "2023-03-07T12:38", author: "Менеджеры", message: "гл talnova" },
    { timestamp: new Date().toISOString(), author: "Лев", message: "Не" },
  ];

  const applyFieldOptions = (normalized) => {
    const norm = withDefaults(normalized || {});

    setFieldOptions({
      categories: (norm.clientFields?.category || [])
        .filter((i) => !i.isDeleted)
        .map((i) => i.value),
      sources: (norm.clientFields?.source || [])
        .filter((i) => !i.isDeleted)
        .map((i) => i.value),
      businesses: (norm.clientFields?.business || [])
        .filter((i) => !i.isDeleted)
        .map((i) => i.value),
      countries: (norm.generalFields?.country || [])
        .filter((i) => !i.isDeleted)
        .map((i) => i.value),
      currencies: (norm.generalFields?.currency || [])
        .filter((i) => !i.isDeleted)
        .map((i) => i.value),
      tags: (norm.clientFields?.tags || []).filter((i) => !i.isDeleted),
    });

    return norm;
  };

  const loadFields = async () => {
    try {
      applyFieldOptions(await fetchFields());
    } catch (e) {
      console.error("Ошибка загрузки полей:", e);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    const handleCacheChange = (event) => {
      if (event?.detail?.key !== "fieldsData") return;
      applyFieldOptions(event.detail.value);
    };

    window.addEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);
    return () => {
      window.removeEventListener(RESOURCE_CACHE_EVENT, handleCacheChange);
    };
  }, []);

  const handleAddNewField = async (group, fieldName, newValue) => {
    try {
      const normalized = await addFieldOption(group, fieldName, newValue);
      applyFieldOptions(normalized);
      if (refreshFields) {
        await refreshFields();
      }
      return normalized;
    } catch (e) {
      console.error("Ошибка при сохранении нового поля в БД:", e);
      return null;
    }
  };

  const methods = useForm({
    resolver: yupResolver(clientSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
    defaultValues: formDefaults,
  });

  const {
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { isDirty, errors },
  } = methods;

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  const handleAddCompanyDirect = async (companyName) => {
    const clientFullName = getValues("full_name") || getValues("name") || "Новый клиент";

    const data = {
      name: companyName,
      firstContactName: clientFullName,
    };

    try {
      const created = await onAddCompany(data);
      setValue("company_id", created.id, { shouldDirty: true });
    } catch (e) {
      console.error("Ошибка при прямом создании компании:", e);
    }
  };

  const errorMap = {
    info: ["name", "company_id", "category", "source", "tags"],
    contacts: ["full_name", "phone", "email", "country"],
    finances: ["currency", "percent", "referrer_id"],
    accesses: ["accesses"],
  };

  const groupErrors = (err) => {
    const grouped = {};

    Object.keys(err || {}).forEach((f) => {
      const tab = Object.keys(errorMap).find((t) => errorMap[t].includes(f));
      if (tab) {
        (grouped[tab] ??= []).push(f);
      }
    });

    return grouped;
  };

  const submitHandler = async (data) => {
    try {
      const payload = safeClient?.id ? { ...data, id: safeClient.id } : data;
      await onSave?.(payload);
      
      reset(data);
    } catch (e) {
      setFormErrors({ submit: [e?.message || "Ошибка сохранения"] });
      console.error("saveClient failed:", e);
    }
  };

  const onInvalid = (err) => {
    console.log("Validation Errors:", err);

    const grouped = groupErrors(err);
    setFormErrors(grouped);

    const firstTab = ["info", "contacts", "finances", "accesses"].find(
      (t) => grouped?.[t]?.length
    );

    if (firstTab) {
      setActiveTab(firstTab);
    }
  };

  const closeHandler = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const deleteHandler = async () => {
    if (!onDelete) return;

    if (window.confirm("Удалить клиента безвозвратно?")) {
      await onDelete(safeClient.id);
      closeHandler();
    }
  };

  const availableClients = useMemo(() => {
    if (clients && clients.length > 0) return clients;
    if (safeClient.id) return [safeClient];
    return [];
  }, [clients, safeClient]);

  return (
    <div className={`client-modal-overlay${closing ? " closing" : ""}`}>
      <div className="client-modal tri-layout">
        <div className="left-panel">
          <FormProvider {...methods}>
            <ClientHeader
              onClose={closeHandler}
              onDelete={onDelete ? deleteHandler : null}
              tagOptions={fieldOptions.tags}
              onAddNewField={handleAddNewField}
            />
          </FormProvider>

          <TabsNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            /* ИСПРАВЛЕНИЕ ЗДЕСЬ: Передаем живые ошибки формы, а не статичный стейт formErrors */
            errors={groupErrors(errors)}
            isNew={isNew}
          />

          <FormProvider {...methods}>
            <form
              id={formId}
              className="client-modal-body custom-scrollbar"
              onSubmit={handleSubmit(submitHandler, onInvalid)}
            >
              {activeTab === "info" && (
                <InfoTab
                  companies={companies}
                  categories={fieldOptions.categories} 
                  sources={fieldOptions.sources}        
                  businesses={fieldOptions.businesses}   
                  tagOptions={fieldOptions.tags}         
                  isNew={isNew}
                  onAddCompany={handleAddCompanyDirect} 
                  onAddCategory={(val) => handleAddNewField("clientFields", "category", val)}
                  onAddSource={(val) => handleAddNewField("clientFields", "source", val)}
                  onAddBusiness={(val) => handleAddNewField("clientFields", "business", val)}
                />
              )}

              {activeTab === "contacts" && (
                <ContactsTab
                  countries={fieldOptions.countries}
                  openImage={() => getValues("photo_link") && setShowImage(true)}
                  onAddCountry={(val) => handleAddNewField("generalFields", "country", val)}
                />
              )}

              {activeTab === "finances" && (
                <FinancesTab
                  currencies={fieldOptions.currencies}
                  referrers={referrers}
                  employees={employees}
                  clients={availableClients} 
                  onAddCurrency={(val) => handleAddNewField("generalFields", "currency", val)}
                />
              )}

              {activeTab === "accesses" && <AccessesTab />}
            </form>
          </FormProvider>
          
          
          <div className={`form-actions-bottom ${isDirty ? "visible" : ""}`}>
            <button 
              className="cancel-order-btn" 
              type="button" 
              onClick={() => reset()}
            >
              Отменить
            </button>
            <button className="save-order-btn" type="submit" form={formId}>Сохранить</button>
          </div>
        </div>

        {isNew ? (
          <div className="chat-panel-wrapper chat-placeholder">
            <p>Сохраните клиента, чтобы открыть чат.</p>
          </div>
        ) : (
          <div className="chat-panel-wrapper">
            <ChatPanel clientId={safeClient.id} initialLogs={sampleLogs} />
          </div>
        )}

        {isNew ? (
          <div className="menu-placeholder">
            <p>Сохраните клиента, чтобы добавить заказ или дублировать.</p>
          </div>
        ) : (
          <div className="right-side-menu">
            <ActionsBar onAddOrder={onAddOrder} onDuplicate={onDuplicate} />
          </div>
        )}
      </div>

      {showImage && (
        <ImagePreviewModal
          src={getValues("photo_link")}
          onClose={() => setShowImage(false)}
        />
      )}

      {formErrors && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <h3>Заполните обязательные поля:</h3>
            <ul>
              {Object.entries(formErrors).map(([tab, fields]) => (
                <li key={tab}>
                  <b>{tab}</b>: {Array.isArray(fields) ? fields.join(", ") : String(fields)}
                </li>
              ))}
            </ul>
            <button onClick={() => setFormErrors(null)}>Ок</button>
          </div>
        </div>
      )}
    </div>
  );
}