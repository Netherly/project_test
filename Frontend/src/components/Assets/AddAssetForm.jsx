import React, { useState } from "react";
import "../../styles/AddAssetForm.css";
import { Plus, X, Minus } from "lucide-react";
import ConfirmationModal from "../modals/confirm/ConfirmationModal";
import AutoResizeTextarea from "../modals/OrderModal/AutoResizeTextarea";

import CreatableSelect from "../Client/ClientModal/CreatableSelect"; 

const AddAssetForm = ({ onAdd, onClose, employees, fields, onAddNewField }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { generalFields, assetsFields } = fields || {
    generalFields: { currency: [] },
    assetsFields: { type: [], paymentSystem: [], cardDesigns: [] },
  };

  const [formData, setFormData] = useState({
    accountName: "",
    currency: "",
    limitTurnover: "",
    type: "",
    paymentSystem: "",
    design: "",
    employeeId: "",
    cardDate: "", 
    cardCVV: "",  
    requisites: [{ label: "", value: "" }],
  });

  const handleFormChange = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    handleFormChange();
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    handleFormChange();
  };

  const handleCardDateChange = (e) => {
    const prevValue = formData.cardDate;
    const value = e.target.value;
    
    if (value.length < prevValue.length) {
      setFormData(prev => ({ ...prev, cardDate: value }));
      handleFormChange();
      return;
    }
    
    let v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      let month = v.substring(0, 2);
      if (parseInt(month, 10) > 12) month = '12';
      if (month === '00') month = '01';
      v = `${month}/${v.substring(2)}`;
    }
    
    setFormData(prev => ({ ...prev, cardDate: v }));
    handleFormChange();
  };

  const handleCardCVVChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').substring(0, 3);
    setFormData(prev => ({ ...prev, cardCVV: v }));
    handleFormChange();
  };

  const handleRequisiteChange = (index, e) => {
    const { name, value } = e.target;
    const newRequisites = [...formData.requisites];
    newRequisites[index][name] = value;

    setFormData((prevData) => ({
      ...prevData,
      requisites: newRequisites,
    }));
    handleFormChange();
  };

  const handleAddRequisite = () => {
    setFormData((prevData) => ({
      ...prevData,
      requisites: [...prevData.requisites, { label: "", value: "" }],
    }));
    handleFormChange();
  };

  const handleRemoveRequisite = (index) => {
    const newRequisites = formData.requisites.filter((_, i) => i !== index);
    setFormData((prevData) => ({
      ...prevData,
      requisites: newRequisites.length > 0 ? newRequisites : [{ label: "", value: "" }],
    }));
    handleFormChange();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const filteredRequisites = formData.requisites.filter(
      (req) => req.label.trim() !== "" || req.value.trim() !== ""
    );

    if (formData.cardDate.trim()) {
      filteredRequisites.push({ label: "Срок действия", value: formData.cardDate.trim() });
    }
    if (formData.cardCVV.trim()) {
      filteredRequisites.push({ label: "CVV", value: formData.cardCVV.trim() });
    }

    const selectedEmployee = employees?.find((emp) => emp.id === formData.employeeId);

    const newAssetPayload = {
      ...formData,
      limitTurnover: parseFloat(formData.limitTurnover) || 0,
      requisites: filteredRequisites,
      employeeName: selectedEmployee?.fullName || selectedEmployee?.full_name || "",
      employee:
        selectedEmployee?.fullName ||
        selectedEmployee?.full_name ||
        formData.employeeId ||
        "",
    };

    delete newAssetPayload.cardDate;
    delete newAssetPayload.cardCVV;

    try {
      if (onAdd) {
        await onAdd(newAssetPayload);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmationModal(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    onClose();
    setShowConfirmationModal(false);
  };

  const handleCancelClose = () => {
    setShowConfirmationModal(false);
  };

  const currencyOptions = (generalFields.currency || []).map(item => item?.code ?? item?.name ?? item?.value ?? item);
  const typeOptions = (assetsFields.type || []).map(item => item?.name ?? item?.value ?? item);
  const paymentSystemOptions = (assetsFields.paymentSystem || []).map(item => item?.name ?? item?.value ?? item);

  const designOptions = (assetsFields.cardDesigns || []).map(d => d?.name).filter(Boolean);
  const getDesignName = (id) => (assetsFields.cardDesigns || []).find(d => d?.id === id)?.name || "";

  const employeeOptions = employees?.map(emp => emp.fullName || emp.full_name || emp.name || emp.id).filter(Boolean) || [];
  const getEmployeeName = (id) => {
    const emp = employees?.find(e => e.id === id);
    return emp ? (emp.fullName || emp.full_name || emp.name || emp.id) : "";
  };

  return (
    <>
      <div className="add-asset-overlay" onClick={handleAttemptClose}>
        <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
          <div className="add-asset-header">
            <h2>Добавить актив</h2>
            <div className="add-asset-actions">
              <span className="icon" onClick={handleAttemptClose}>
                <X />
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="add-asset-form">
            <div className="form-row">
              <label htmlFor="accountName" className="form-label">
                Наименование
              </label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="Например, ПриватБанк - Ключ к счету"
                required
                className="form-input1"
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <label htmlFor="currency" className="form-label">
                Валюта счета
              </label>
              <CreatableSelect
                value={formData.currency}
                onChange={(val) => handleSelectChange("currency", val)}
                options={currencyOptions}
                placeholder="Выберите или введите валюту..."
                disabled={isLoading}
                onAdd={(val) => onAddNewField && onAddNewField("generalFields", "currency", val)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="limitTurnover" className="form-label">Лимит оборота</label>
              <div className="custom-number-input">
                <input
                  type="number"
                  id="limitTurnover"
                  name="limitTurnover"
                  value={formData.limitTurnover}
                  onChange={handleChange}
                  placeholder="Введите лимит оборота"
                  className="form-input1"
                  disabled={isLoading}
                  min={0}
                />
                <button 
                  type="button" 
                  className="num-btn minus-btn" 
                  onClick={() => {
                    const numValue = parseFloat(formData.limitTurnover) || 0;
                    setFormData(prev => ({ ...prev, limitTurnover: Math.max(0, numValue - 1000) }));
                    handleFormChange();
                  }} 
                  disabled={isLoading || (parseFloat(formData.limitTurnover) || 0) <= 0}
                >
                  <Minus />
                </button>
                <button 
                  type="button" 
                  className="num-btn plus-btn" 
                  onClick={() => {
                    const numValue = parseFloat(formData.limitTurnover) || 0;
                    setFormData(prev => ({ ...prev, limitTurnover: numValue + 1000 }));
                    handleFormChange();
                  }}
                  disabled={isLoading}
                >
                  <Plus />
                </button>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="type" className="form-label">
                Тип
              </label>
              <CreatableSelect
                value={formData.type}
                onChange={(val) => handleSelectChange("type", val)}
                options={typeOptions}
                placeholder="Выберите или введите тип..."
                disabled={isLoading}
                onAdd={(val) => onAddNewField && onAddNewField("assetsFields", "type", val)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="paymentSystem" className="form-label">
                Платежная система
              </label>
              <CreatableSelect
                value={formData.paymentSystem}
                onChange={(val) => handleSelectChange("paymentSystem", val)}
                options={paymentSystemOptions}
                placeholder="Выберите или введите..."
                disabled={isLoading}
                onAdd={(val) => onAddNewField && onAddNewField("assetsFields", "paymentSystem", val)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="design" className="form-label">
                Дизайн
              </label>
              <CreatableSelect
                value={getDesignName(formData.design)}
                onChange={(val) => {
                  const selected = (assetsFields.cardDesigns || []).find(d => d?.name === val);
                  handleChange({ target: { name: 'design', value: selected ? selected.id : "" } });
                }}
                options={designOptions}
                placeholder="Без темы"
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <label htmlFor="employeeId" className="form-label">
                Сотрудник
              </label>
              <CreatableSelect
                value={getEmployeeName(formData.employeeId)}
                onChange={(val) => {
                  const selected = employees?.find(emp => (emp.fullName || emp.full_name || emp.name || emp.id) === val);
                  handleChange({ target: { name: 'employeeId', value: selected ? selected.id : "" } });
                }}
                options={employeeOptions}
                placeholder="Не выбрано"
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <label className="form-label">
                Срок и CVV
              </label>
              <div style={{ display: 'flex', gap: '10px', flexBasis: '70%', width: '100%' }}>
                <input
                  type="text"
                  name="cardDate"
                  value={formData.cardDate}
                  onChange={handleCardDateChange}
                  placeholder="ММ/ГГ"
                  className="form-input1"
                  style={{ minWidth: '0', flex: 1 }}
                  maxLength={5}
                  disabled={isLoading}
                />
                <input
                  type="text"
                  name="cardCVV"
                  value={formData.cardCVV}
                  onChange={handleCardCVVChange}
                  placeholder="CVV"
                  className="form-input1"
                  style={{ minWidth: '0', flex: 1 }}
                  maxLength={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="requisites-section">
              <h3 className="requisites-header">Доп. реквизиты</h3>
              <div className="requisites-table-wrapper">
                {formData.requisites.map((req, index) => (
                  <div key={index} className="requisites-table-row">
                    <div className="requisites-table-cell">
                      <input
                        type="text"
                        name="label"
                        value={req.label}
                        onChange={(e) => handleRequisiteChange(index, e)}
                        placeholder="Введите название"
                        className="form-input1"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="requisites-table-cell">
                      <AutoResizeTextarea
                        name="value"
                        value={req.value}
                        onChange={(e) => handleRequisiteChange(index, e)}
                        placeholder="Введите значение"
                        className="assets-workplan-textarea"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="requisites-table-cell action-cell">
                      {formData.requisites.length > 1 && (
                        <button
                          type="button"
                          className="remove-category-btn"
                          onClick={() => handleRemoveRequisite(index)}
                          title="Удалить реквизит"
                          disabled={isLoading}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-requisite-btn-icon"
                onClick={handleAddRequisite}
                title="Добавить реквизит"
                disabled={isLoading}
              >
                <Plus size={20} color="white" /> Добавить
              </button>
            </div>

            <div className="assets-form-actions">
              <button
                type="button"
                className="cancel-order-btn"
                onClick={handleAttemptClose}
                disabled={isLoading}
              >
                Отменить
              </button>
              <button type="submit" className="save-order-btn" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirmationModal && (
        <ConfirmationModal
          title="Сообщение"
          message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?"
          confirmText="OK"
          cancelText="Отмена"
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}
    </>
  );
};

export default AddAssetForm;