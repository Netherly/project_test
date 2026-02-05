import React, { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { employeeSchema } from "./validationSchema";
import { useFields } from "../../../context/FieldsContext";

import EmployeeHeader from "./EmployeeHeader";
import TabsNav from "./TabsNav";
import GeneralInfoTab from "./GeneralInfoTab";
import SummaryTab from "./SummaryTab";
import ContactsTab from "./ContactsTab";
import RequisitesTab from "./RequisitesTab";
import FinancesTab from "./FinancesTab";
import OrdersTab from "./OrdersTab";
import ChatPanel from "../../Client/ClientModal/ChatPanel";

import { normalizeEmployee } from "../../../api/employees";

import "../../../styles/EmployeeModal.css";

const toText = (value) => String(value ?? '').trim();

export default function EmployeeModal({ employee, onClose, onSave, onDelete }) {
  const safeEmployee = useMemo(() => normalizeEmployee(employee ?? {}), [employee]);
  const isNew = !safeEmployee.id;
  const { fields, loading: loadingFields } = useFields();

  const [activeTab, setActiveTab] = useState(isNew ? "general" : "summary");
  const [closing, setClosing] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

 
  const [loadingData, setLoadingData] = useState(false);
  const [appData, setAppData] = useState({
    fields: { employeeFields: { country: [] }, executorFields: { currency: [] } },
    transactions: [],
    assets: [],
    orders: []
  });

  const formId = "employee-form";

  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  
  useEffect(() => {
    if (fields) {
      setAllFields(fields);
    }
  }, [fields]);

  const methods = useForm({
    resolver: yupResolver(employeeSchema),
    mode: "onChange",
    defaultValues: { status: "active", ...safeEmployee },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = methods;

  useEffect(() => {
    reset({ status: "active", ...safeEmployee });
  }, [reset, safeEmployee]);

  const errorMap = {
    general: ["fullName", "login", "password", "countryId"],
    contacts: ["phone", "email"],
  };

  const groupErrors = (err) => {
    const grouped = {};
    for (const field in err) {
      const tab = Object.keys(errorMap).find((t) => errorMap[t].includes(field));
      if (tab) {
        if (!grouped[tab]) grouped[tab] = [];
        grouped[tab].push(field);
      }
    }
    return grouped;
  };

  const submitHandler = async (data) => {
    try {
      if (typeof onSave === "function") {
        const saved = await onSave(data);
        if (saved) {
          reset({ status: "active", ...normalizeEmployee(saved) }, { keepValues: false });
        }
        setFormErrors(null);
      }
    } catch (e) {
      const raw = e?.message || "Ошибка сохранения";
      let msg = raw;
      const jsonMatch = raw.match(/(\{.*\})/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      setFormErrors({ submit: [msg] });
      console.error("Ошибка сохранения сотрудника:", e);
    }
  };

  const onInvalid = (err) => {
    const grouped = groupErrors(err);
    setFormErrors(grouped);
    const firstTabWithErrors = Object.keys(grouped)[0];
    if (firstTabWithErrors) setActiveTab(firstTabWithErrors);
  };

  const closeHandler = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const deleteHandler = () => {
    if (window.confirm("Вы уверены, что хотите удалить этого сотрудника?")) {
      onDelete?.(safeEmployee.id);
      closeHandler();
    }
  };

  return (
    <div className={`employee-modal-overlay ${isOpen ? "open" : ""} ${closing ? "closing" : ""}`} onClick={closeHandler}>
      <div className="employee-modal tri-layout" onClick={(e) => e.stopPropagation()}>
        <div className="left-panel">
          <FormProvider {...methods}>
            <form id={formId} className="employee-modal-body" onSubmit={handleSubmit(submitHandler, onInvalid)}>
              <EmployeeHeader
                isNew={isNew}
                onClose={closeHandler}
                onDelete={!isNew && onDelete ? deleteHandler : null}
                isDirty={isDirty}
                reset={reset}
              />

              <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} errors={groupErrors(errors)} isNew={isNew} />

              <div className={`tab-content-container`}>
                {activeTab === "summary" && <SummaryTab employee={safeEmployee} />}
                
                {activeTab === "general" && (
                  <GeneralInfoTab 
                    fieldsData={allFields}
                  />
                )}
                
                {activeTab === "contacts" && <ContactsTab isNew={isNew} />}
                
                {activeTab === "requisites" && <RequisitesTab />}
                
                {activeTab === "finances" && (
                  <FinancesTab 
                    isNew={isNew} 
                    employee={safeEmployee}
                  />
                )}
                
                {activeTab === "orders" && (
                  <OrdersTab 
                    isNew={isNew} 
                    employee={safeEmployee}
                  />
                )}
              </div>
            </form>
          </FormProvider>

          {isDirty && (
            <div className="employee-modal-actions">
              {formErrors?.submit?.length ? (
                <div className="form-submit-error error">{formErrors.submit[0]}</div>
              ) : null}
              <button className="cancel-order-btn" type="button" onClick={() => reset()} disabled={!isDirty}>
                Сбросить
              </button>
              <button className="save-order-btn" type="submit" form={formId}>
                Сохранить
              </button>
            </div>
          )}
        </div>

        {isNew ? (
          <div className="chat-panel-wrapper chat-placeholder">
            <p>Сохраните сотрудника, чтобы открыть чат.</p>
          </div>
        ) : (
          <div className="chat-panel-wrapper">
            <ChatPanel employeeId={safeEmployee.id} storageKey={`chat-employee-${safeEmployee.id}`} />
          </div>
        )}

        <div className="right-side-menu">
          {isNew ? (
            <div className="menu-placeholder">
              <p>Сохраните сотрудника, чтобы ставить задачи</p>
            </div>
          ) : (
            <>
              <button type="button" className="menu-button">
                Поставить задачу
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}