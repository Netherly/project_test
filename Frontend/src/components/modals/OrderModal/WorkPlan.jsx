import React, { useState, useRef, useEffect } from "react";
import { Controller, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { X, Plus, Copy } from "lucide-react";
import AutoResizeTextarea from "./AutoResizeTextarea";

const WorkPlan = ({ control, orderFields }) => {
  const { getValues, setValue } = useFormContext();

  const rawReadySolutions = Array.isArray(orderFields?.readySolution)
    ? orderFields.readySolution
    : Array.isArray(orderFields?.orderFields?.readySolution)
    ? orderFields.orderFields.readySolution
    : [];

  const readySolutions = rawReadySolutions.filter((item) => !item?.isDeleted);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "workList",
  });

  const {
    fields: additionalOptionFields,
    append: appendAdditionalOption,
    remove: removeAdditionalOption,
  } = useFieldArray({
    control,
    name: "additionalOptions",
  });

  const techTags = useWatch({ control, name: "techTags" }) || [];
  const taskTags = useWatch({ control, name: "taskTags" }) || [];

  const [customTechTag, setCustomTechTag] = useState("");
  const [customTaskTag, setCustomTaskTag] = useState("");
  const [showTechTagDropdown, setShowTechTagDropdown] = useState(false);
  const [showTaskTagDropdown, setShowTaskTagDropdown] = useState(false);

  const techTagInputRef = useRef(null);
  const techTagDropdownRef = useRef(null);
  const taskTagInputRef = useRef(null);
  const taskTagDropdownRef = useRef(null);

  const defaultTechTags = (orderFields?.techTags || [])
    .map((t) => (typeof t === "string" ? t : t?.name))
    .filter(Boolean);

  const defaultTaskTags = (orderFields?.taskTags || [])
    .map((t) => (typeof t === "string" ? t : t?.name))
    .filter(Boolean);

  const fallbackTechTags = [
    "React",
    "Node.js",
    "JavaScript",
    "Python",
    "Vue",
    "TypeScript",
    "MongoDB",
    "PostgreSQL",
  ];

  const fallbackTaskTags = [
    "Разработка",
    "Тестирование",
    "Дизайн",
    "Реализация",
    "Аналитика",
    "Документация",
  ];

  const techOptions = defaultTechTags.length ? defaultTechTags : fallbackTechTags;
  const taskOptions = defaultTaskTags.length ? defaultTaskTags : fallbackTaskTags;

  const descriptionOptions = ["Описание 1", "Описание 2", "Описание 3"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      if (
        techTagDropdownRef.current &&
        !techTagDropdownRef.current.contains(target) &&
        techTagInputRef.current &&
        !techTagInputRef.current.contains(target)
      ) {
        setShowTechTagDropdown(false);
      }

      if (
        taskTagDropdownRef.current &&
        !taskTagDropdownRef.current.contains(target) &&
        taskTagInputRef.current &&
        !taskTagInputRef.current.contains(target)
      ) {
        setShowTaskTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTechTags = techOptions.filter(
    (tag) => !techTags.includes(tag) && tag.toLowerCase().includes(customTechTag.toLowerCase())
  );

  const filteredTaskTags = taskOptions.filter(
    (tag) => !taskTags.includes(tag) && tag.toLowerCase().includes(customTaskTag.toLowerCase())
  );

  const handleAddTechSpecToTextarea = (e, field) => {
    if (e.key !== "Enter") return;

    if (e.shiftKey) {
      e.preventDefault();
      const currentValue = getValues("techSpecifications") || "";
      const newValue = `${currentValue}\n`;
      setValue("techSpecifications", newValue, { shouldDirty: true });
      field.onChange(newValue);
      return;
    }

    e.preventDefault();
    const workListValues = getValues("workList") || [];
    const techSpecs = workListValues
      .map((row) => row?.specification || "")
      .filter(Boolean)
      .join("\n");
    const currentValue = getValues("techSpecifications") || "";
    const newValue = techSpecs
      ? `${currentValue}${currentValue ? "\n" : ""}${techSpecs}`
      : currentValue;

    setValue("techSpecifications", newValue, { shouldDirty: true });
    field.onChange(newValue);
  };

  const handleAddWorkRow = () => {
    append({ description: "", amount: "", specification: "", sale: false });
  };

  const handleAddAdditionalOption = () => {
    appendAdditionalOption({ name: "", price: "" });
  };

  const handleCopyWorkRow = async (index) => {
    const currentDescription = getValues(`workList.${index}.description`);
    const currentAmount = getValues(`workList.${index}.amount`);
    const currentSpec = getValues(`workList.${index}.specification`);
    const currentSale = getValues(`workList.${index}.sale`);

    const textToCopy = `Описание: ${currentDescription || ""}, Сумма: ${currentAmount || ""}, ТЗ: ${currentSpec || ""}, Продажа: ${
      currentSale ? "Да" : "Нет"
    }`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert("Данные скопированы в буфер обмена!");
    } catch (e) {
      console.error("Clipboard copy failed:", e);
      alert("Не удалось скопировать. Возможно, браузер блокирует доступ к буферу обмена.");
    }
  };

  const projectOptions = (orderFields?.projects || [])
    .map((p) => p?.value ?? p?.name ?? (typeof p === "string" ? p : ""))
    .filter(Boolean);

  const fallbackProjects = [
    "Проект Альфа",
    "Разработка CRM",
    "Интернет-магазин 'Космос'",
    "Лендинг для конференции",
  ];

  return (
    <div className="tab-content-container workplan-tab-wrapper">
      <div className="tab-content-row">
        <div className="tab-content-title">Проект</div>
        <Controller
          name="project"
          control={control}
          render={({ field }) => (
            <select {...field} className="custom-content-input">
              <option value="" disabled hidden>Не выбрано</option>
              {(projectOptions.length ? projectOptions : fallbackProjects).map((project, index) => (
                <option key={index} value={project}>
                  {project}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Описание заказа</div>
        <Controller
          name="orderDescription"
          control={control}
          render={({ field }) => (
            <AutoResizeTextarea
              {...field}
              className="workplan-textarea"
              placeholder="Введите описание заказа"
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Готовое решение</div>
        <Controller
          name="readySolution"
          control={control}
          render={({ field }) => (
            <select {...field} className="custom-content-input">
              <option value="" disabled hidden>Не выбрано</option>
              {readySolutions.length > 0 ? (
                readySolutions.map((item) => (
                  <option key={item.id || item.value} value={item.value ?? item.name ?? item}>
                    {item.value ?? item.name ?? item}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Список пуст (добавьте в настройках)
                </option>
              )}
            </select>
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Технологии</div>
        <Controller
          name="techTags"
          control={control}
          render={({ field: { value = [], onChange } }) => (
            <div className="tags-section">
              <div className="tag-input-container" ref={techTagInputRef}>
                <input
                  type="text"
                  placeholder="Добавить тег технологии"
                  className="input-tag"
                  value={customTechTag}
                  onChange={(e) => {
                    setCustomTechTag(e.target.value);
                    setShowTechTagDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customTechTag.trim()) {
                      e.preventDefault();
                      const next = customTechTag.trim();
                      if (!value.includes(next)) onChange([...value, next]);
                      setCustomTechTag("");
                      setShowTechTagDropdown(false);
                    }
                  }}
                  onFocus={() => setShowTechTagDropdown(true)}
                  autoComplete="off"
                />

                {showTechTagDropdown && (filteredTechTags.length > 0 || customTechTag.trim()) && (
                  <div className="tag-dropdown" ref={techTagDropdownRef}>
                    {filteredTechTags.map((tag) => (
                      <div
                        key={tag}
                        className="tag-dropdown-item"
                        onClick={() => {
                          if (!value.includes(tag)) onChange([...value, tag]);
                          setCustomTechTag("");
                          setShowTechTagDropdown(false);
                        }}
                      >
                        {tag}
                      </div>
                    ))}

                    {customTechTag.trim() &&
                      !techOptions.includes(customTechTag.trim()) &&
                      !value.includes(customTechTag.trim()) && (
                        <div
                          className="tag-dropdown-item tag-dropdown-custom"
                          onClick={() => {
                            const next = customTechTag.trim();
                            onChange([...value, next]);
                            setCustomTechTag("");
                            setShowTechTagDropdown(false);
                          }}
                        >
                          Добавить: "{customTechTag}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="tag-chips-container">
                {value.map((tag, idx) => (
                  <span
                    key={`${tag}_${idx}`}
                    className="tag-chips tag-order-chips"
                    onClick={() => onChange(value.filter((t) => t !== tag))}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Тип задач</div>
        <Controller
          name="taskTags"
          control={control}
          render={({ field: { value = [], onChange } }) => (
            <div className="tags-section">
              <div className="tag-input-container" ref={taskTagInputRef}>
                <input
                  type="text"
                  placeholder="Добавить тег задачи"
                  className="input-tag"
                  value={customTaskTag}
                  onChange={(e) => {
                    setCustomTaskTag(e.target.value);
                    setShowTaskTagDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customTaskTag.trim()) {
                      e.preventDefault();
                      const next = customTaskTag.trim();
                      if (!value.includes(next)) onChange([...value, next]);
                      setCustomTaskTag("");
                      setShowTaskTagDropdown(false);
                    }
                  }}
                  onFocus={() => setShowTaskTagDropdown(true)}
                  autoComplete="off"
                />

                {showTaskTagDropdown && (filteredTaskTags.length > 0 || customTaskTag.trim()) && (
                  <div className="tag-dropdown" ref={taskTagDropdownRef}>
                    {filteredTaskTags.map((tag) => (
                      <div
                        key={tag}
                        className="tag-dropdown-item"
                        onClick={() => {
                          if (!value.includes(tag)) onChange([...value, tag]);
                          setCustomTaskTag("");
                          setShowTaskTagDropdown(false);
                        }}
                      >
                        {tag}
                      </div>
                    ))}

                    {customTaskTag.trim() &&
                      !taskOptions.includes(customTaskTag.trim()) &&
                      !value.includes(customTaskTag.trim()) && (
                        <div
                          className="tag-dropdown-item tag-dropdown-custom"
                          onClick={() => {
                            const next = customTaskTag.trim();
                            onChange([...value, next]);
                            setCustomTaskTag("");
                            setShowTaskTagDropdown(false);
                          }}
                        >
                          Добавить: "{customTaskTag}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="tag-chips-container">
                {value.map((tag, idx) => (
                  <span
                    key={`${tag}_${idx}`}
                    className="tag-chips tag-order-chips"
                    onClick={() => onChange(value.filter((t) => t !== tag))}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      <div className="tab-content-table">
        <div className="tab-content-title">Список работ</div>

        <div className="work-list-table main-work-table">
          <div className="work-list-row header-row">
            <div className="header-content-wrapper">
              <div className="work-list-cell">Описание</div>
              <div className="work-list-cell">Сумма</div>
              <div className="work-list-cell">ТЗ</div>
              <div className="work-list-cell">Продажа?</div>
            </div>
            <div className="work-list-cell action-cell" />
          </div>

          {fields.map((row, index) => (
            <div key={row.id} className="work-list-row">
              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`workList.${index}.description`}
                  render={({ field }) => (
                    <>
                      <AutoResizeTextarea
                        {...field}
                        placeholder="Описание"
                        list={`description-options-${index}`}
                      />
                      <datalist id={`description-options-${index}`}>
                        {descriptionOptions.map((opt, idx) => (
                          <option key={idx} value={opt} />
                        ))}
                      </datalist>
                    </>
                  )}
                />
              </div>

              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`workList.${index}.amount`}
                  render={({ field }) => <AutoResizeTextarea {...field} placeholder="0" />}
                />
              </div>

              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`workList.${index}.specification`}
                  render={({ field }) => <AutoResizeTextarea {...field} placeholder="ТЗ" />}
                />
              </div>

              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`workList.${index}.sale`}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="workplan-checkbox"
                    />
                  )}
                />
              </div>

              <div className="work-list-cell action-cell">
                <button
                  type="button"
                  className="action-btn-icon"
                  onClick={() => handleCopyWorkRow(index)}
                  title="Копировать строку"
                >
                  <Copy size={16} color="white" />
                </button>

                <button
                  type="button"
                  className="action-btn-icon"
                  onClick={() => remove(index)}
                  title="Удалить строку"
                >
                  <X size={18} color="#ff4d4f" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="add-requisites-btn" onClick={handleAddWorkRow}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">ТЗ</div>
        <Controller
          name="techSpecifications"
          control={control}
          render={({ field }) => (
            <AutoResizeTextarea
              {...field}
              className="workplan-textarea"
              placeholder="Введите ТЗ..."
              onKeyDown={(e) => handleAddTechSpecToTextarea(e, field)}
            />
          )}
        />
      </div>

      <div className="tab-content-table">
        <div className="tab-content-title">Доп. опции</div>

        <div className="work-list-table mini-options-table">
          <div className="work-list-row header-row">
            <div className="header-content-wrapper">
              <div className="work-list-cell">Значение</div>
              <div className="work-list-cell">Цена</div>
            </div>
            <div className="work-list-cell action-cell" />
          </div>

          {additionalOptionFields.map((item, index) => (
            <div key={item.id} className="work-list-row">
              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`additionalOptions.${index}.name`}
                  render={({ field }) => (
                    <AutoResizeTextarea {...field} placeholder="Название опции" />
                  )}
                />
              </div>

              <div className="work-list-cell">
                <Controller
                  control={control}
                  name={`additionalOptions.${index}.price`}
                  render={({ field }) => <AutoResizeTextarea {...field} placeholder="0" />}
                />
              </div>

              <div className="work-list-cell action-cell">
                <button
                  type="button"
                  className="action-btn-icon"
                  onClick={() => removeAdditionalOption(index)}
                  title="Удалить опцию"
                >
                  <X size={18} color="#ff4d4f" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="add-requisites-btn" onClick={handleAddAdditionalOption}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Доп. условия</div>
        <Controller
          name="additionalConditions"
          control={control}
          render={({ field }) => (
            <AutoResizeTextarea
              {...field}
              className="workplan-textarea"
              placeholder="Введите дополнительные условия..."
            />
          )}
        />
      </div>

      <div className="tab-content-row">
        <div className="tab-content-title">Примечание</div>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <AutoResizeTextarea
              {...field}
              className="workplan-textarea"
              placeholder="Введите примечание..."
            />
          )}
        />
      </div>
    </div>
  );
};

export default WorkPlan;
