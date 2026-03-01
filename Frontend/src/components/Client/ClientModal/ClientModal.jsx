import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { clientSchema } from "../validationSchema";
import { fetchFields, saveFields, withDefaults, serializeForSave, rid } from "../../../api/fields";
import { useFields } from "../../../context/FieldsContext";

import ClientHeader from "./ClientHeader";
import TabsNav from "./TabsNav";
import InfoTab from "./InfoTab";
import ContactsTab from "./ContactsTab";
import FinancesTab from "./FinancesTab";
import AccessesTab from "./AccessesTab";
import ChatPanel from "./ChatPanel";
import ActionsBar from "./ActionsBar";
import AddCompanyModal from "../AddCompanyForm";
import ImagePreviewModal from "../ImagePreviewModal";

import "../../../styles/ClientModal.css";

export default function ClientModal({
  client,
  companies = [],
  employees = [],
  referrers = [],
  countries = [],
  currencies = [],
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
    tags: []
  });

  const loadFields = async () => {
    try {
      const raw = await fetchFields();
      const norm = withDefaults(raw);
      setFieldOptions({
        categories: (norm.clientFields?.category || []).filter(i=>!i.isDeleted).map(i=>i.value),
        sources: (norm.clientFields?.source || []).filter(i=>!i.isDeleted).map(i=>i.value),
        businesses: (norm.clientFields?.business || []).filter(i=>!i.isDeleted).map(i=>i.value),
        countries: (norm.generalFields?.country || []).filter(i=>!i.isDeleted).map(i=>i.value),
        currencies: (norm.generalFields?.currency || []).filter(i=>!i.isDeleted).map(i=>i.value),
        tags: (norm.clientFields?.tags || []).filter(i=>!i.isDeleted)
      });
    } catch (e) {
      console.error("Ошибка загрузки полей:", e);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleAddNewField = async (group, fieldName, newValue) => {
    try {
      const raw = await fetchFields();
      const normalized = withDefaults(raw);
      const list = normalized[group]?.[fieldName] || [];

      const exists = list.find(item => 
        item.value && item.value.toLowerCase() === newValue.toLowerCase()
      );

      if (!exists) {
        list.push({ id: rid(), value: newValue, isDeleted: false });
        normalized[group][fieldName] = list;
        const payload = serializeForSave(normalized);
        await saveFields(payload);
        await loadFields();
        if (refreshFields) await refreshFields();
      }
    } catch (e) {
      console.error("Ошибка при сохранении нового поля в БД:", e);
    }
  };

  const [activeTab, setActiveTab] = useState(isNew ? "info" : "summary");
  const [showCompany, setShowCompany] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [closing, setClosing] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const formId = "client-main-form";
  const sampleLogs = [
    { timestamp: "2023-03-07T12:36", author: "Менеджеры", message: "Отримувач: …" },
  ];

  const methods = useForm({
    resolver: yupResolver(clientSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      ...safeClient,
      tags: safeClient.tags ?? [],
      accesses: safeClient.accesses ?? [],
      share_info: safeClient.share_info ?? false,
      percent: safeClient.percent ?? 100,
    },
  });

  const { handleSubmit, getValues, setValue, reset, formState: { isDirty } } = methods;

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
      if (tab) (grouped[tab] ??= []).push(f);
    });
    return grouped;
  };

  const submitHandler = async (data) => {
    try {
      const payload = safeClient?.id ? { ...data, id: safeClient.id } : data;
      await onSave?.(payload);
      closeHandler();
    } catch (e) {
      setFormErrors({ submit: [e?.message || "Ошибка сохранения"] });
      console.error("saveClient failed:", e);
    }
  };

  const onInvalid = (err) => {
    const grouped = groupErrors(err);
    setFormErrors(grouped);
    const firstTab = ["info", "contacts", "finances", "accesses"].find((t) => grouped?.[t]?.length);
    if (firstTab) setActiveTab(firstTab);
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

  return (
    <div className={`client-modal-overlay${closing ? " closing" : ""}`}>
      <div className="client-modal tri-layout">
        <div className="left-panel">
          <FormProvider {...methods}>
            <ClientHeader onClose={closeHandler} onDelete={onDelete ? deleteHandler : null} tagOptions={fieldOptions.tags} />
          </FormProvider>

          <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} errors={formErrors} isNew={isNew} />

          <FormProvider {...methods}>
            <form id={formId} className="client-modal-body custom-scrollbar" onSubmit={handleSubmit(submitHandler, onInvalid)}>
              {activeTab === "info" && (
                <InfoTab
                  companies={companies}
                  categories={fieldOptions.categories} 
                  sources={fieldOptions.sources}         
                  businesses={fieldOptions.businesses}   
                  tagOptions={fieldOptions.tags}         
                  onAddCompany={() => setShowCompany(true)}
                  onAddNewField={handleAddNewField}
                />
              )}

              {activeTab === "contacts" && (
                <ContactsTab
                  countries={fieldOptions.countries} 
                  openImage={() => getValues("photo_link") && setShowImage(true)}
                  onAddNewField={handleAddNewField}
                />
              )}

              {activeTab === "finances" && (
                <FinancesTab
                  currencies={fieldOptions.currencies.length ? fieldOptions.currencies : currencies}
                  referrers={referrers}
                  employees={employees}
                  onAddNewField={handleAddNewField}
                />
              )}

              {activeTab === "accesses" && <AccessesTab />}
            </form>
          </FormProvider>
          
          <div className="form-actions-bottom">
            <button className="cancel-order-btn" type="button" onClick={() => reset()} disabled={!isDirty}>Отменить</button>
            <button className="save-order-btn" type="submit" form={formId}>Сохранить</button>
          </div>
        </div>

        {isNew ? (
          <div className="chat-panel-wrapper chat-placeholder"><p>Сохраните клиента, чтобы открыть чат.</p></div>
        ) : (
          <div className="chat-panel-wrapper"><ChatPanel clientId={safeClient.id} initialLogs={sampleLogs} /></div>
        )}

        {isNew ? (
          <div className="menu-placeholder"><p>Сохраните клиента, чтобы добавить заказ или дублировать.</p></div>
        ) : (
          <div className="right-side-menu"><ActionsBar onAddOrder={onAddOrder} onDuplicate={onDuplicate} /></div>
        )}
      </div>

      {showCompany && (
        <AddCompanyModal
          onCreate={async (data) => {
            const created = await onAddCompany(data);
            setValue("company_id", created.id);
            setShowCompany(false);
          }}
          onCancel={() => setShowCompany(false)}
        />
      )}
      {showImage && <ImagePreviewModal src={getValues("photo_link")} onClose={() => setShowImage(false)} />}
      {formErrors && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <h3>Заполните обязательные поля:</h3>
            <ul>
              {Object.entries(formErrors).map(([tab, fields]) => (
                <li key={tab}><b>{tab}</b>: {Array.isArray(fields) ? fields.join(", ") : String(fields)}</li>
              ))}
            </ul>
            <button onClick={() => setFormErrors(null)}>Ок</button>
          </div>
        </div>
      )}
    </div>
  );
}