import React, { useEffect, useState, useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Download, X } from "lucide-react";
import TextareaWithCounter from "../TextareaWithCounter";
import CreatableSelect from "../CreatableSelect";
import "./InfoTab.css";

const defaultTags = ["Lead", "Hot", "VIP", "Test", "Internal"];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export default function InfoTab({
  companies = [],
  businesses = [],
  categories = [],
  sources = [],
  tagOptions = [],
  loadingLists = false,
  onAddCompany,
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const watchedCompanyId = useWatch({ control, name: "company_id" });

  const [customTag, setCustomTag] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);

  const handleTagInputChange = (e) => setCustomTag(e.target.value);
  const handleTagInputFocus = () => setShowTagDropdown(true);

  const handleTagSelect = (tagName, fieldOnChange, currentTagsValue) => {
    const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];

    if (tagName && !currentTags.find((t) => t.name === tagName)) {
      fieldOnChange([...currentTags, { name: tagName, color: "#777" }]);
    }

    setCustomTag("");
    setShowTagDropdown(false);
  };

  const handleCustomTagAdd = (e, fieldOnChange, currentTagsValue) => {
    if (e.key === "Enter" && customTag.trim()) {
      e.preventDefault();
      handleTagSelect(customTag.trim(), fieldOnChange, currentTagsValue);
    }
  };

  const handleTagRemove = (tagToRemove, fieldOnChange, currentTagsValue) => {
    const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
    fieldOnChange(currentTags.filter((tag) => tag.name !== tagToRemove.name));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target) &&
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target)
      ) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="tab-section info-tab">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>
              Клиент<span className="req">*</span>
            </label>
            <input
              {...field}
              placeholder="Клиент"
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <p className="error grid-error">{errors.name.message}</p>}
          </div>
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>
              Категория<span className="req">*</span>
            </label>
            <select
              {...field}
              disabled={loadingLists}
              className={errors.category ? "input-error" : ""}
            >
              <option value="" disabled hidden>
                Не выбрано
              </option>
              {categories.map((c, i) => (
                <option key={`${c}-${i}`} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="error grid-error">{errors.category.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="source"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>
              Источник<span className="req">*</span>
            </label>
            <select
              {...field}
              disabled={loadingLists}
              className={errors.source ? "input-error" : ""}
            >
              <option value="" disabled hidden>
                Не выбрано
              </option>
              {sources.map((s, i) => (
                <option key={`${s}-${i}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.source && <p className="error grid-error">{errors.source.message}</p>}
          </div>
        )}
      />

      <Controller
        name="intro_description"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>
              Вводное описание<span className="req">*</span>
            </label>
            <TextareaWithCounter
              value={field.value || ""}
              onChange={field.onChange}
              maxLength={500}
              placeholder="Вводное описание"
              className={errors.intro_description ? "input-error" : ""}
              warningThreshold={0.8}
            />
            {errors.intro_description && (
              <p className="error grid-error">{errors.intro_description.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>
              Примечание<span className="req">*</span>
            </label>
            <TextareaWithCounter
              value={field.value || ""}
              onChange={field.onChange}
              maxLength={300}
              placeholder="Примечание"
              className={errors.note ? "input-error" : ""}
              warningThreshold={0.8}
            />
            {errors.note && <p className="error grid-error">{errors.note.message}</p>}
          </div>
        )}
      />

      <Controller
        name="tags"
        control={control}
        render={({ field: { onChange, value: currentTagsValue } }) => {
          const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
          const suggestions = [
            ...defaultTags,
            ...tagOptions.map((t) => (typeof t === "object" ? t.name : t)),
          ];
          const uniqueSuggestions = Array.from(new Set(suggestions));

          const filteredTags = uniqueSuggestions.filter(
            (tagString) =>
              tagString.toLowerCase().includes(customTag.toLowerCase()) &&
              !currentTags.find((t) => t.name === tagString)
          );

          return (
            <div className="form-field full-width">
              <label>Теги</label>

              <div className="custom-tags-wrapper">
                <div className="tag-input-container" ref={tagInputRef}>
                  <input
                    type="text"
                    placeholder="Добавить тег"
                    className="input-tag-control"
                    value={customTag}
                    onChange={handleTagInputChange}
                    onKeyDown={(e) => handleCustomTagAdd(e, onChange, currentTagsValue)}
                    onFocus={handleTagInputFocus}
                    autoComplete="off"
                  />

                  {showTagDropdown &&
                    (filteredTags.length > 0 ||
                      (customTag.trim() &&
                        !uniqueSuggestions.includes(customTag.trim()) &&
                        !currentTags.find((t) => t.name === customTag.trim()))) && (
                      <div className="tag-dropdown" ref={tagDropdownRef}>
                        {filteredTags.map((tag) => (
                          <div
                            key={tag}
                            className="tag-dropdown-item"
                            onClick={() => handleTagSelect(tag, onChange, currentTagsValue)}
                          >
                            {tag}
                          </div>
                        ))}

                        {customTag.trim() &&
                          !uniqueSuggestions.includes(customTag.trim()) &&
                          !currentTags.find((t) => t.name === customTag.trim()) && (
                            <div
                              className="tag-dropdown-item"
                              onClick={() =>
                                handleTagSelect(customTag.trim(), onChange, currentTagsValue)
                              }
                            >
                              Добавить: "{customTag.trim()}"
                            </div>
                          )}
                      </div>
                    )}
                </div>

                <div className="selected-tags-list">
                  {currentTags.map((tag, index) => (
                    <span key={tag.id || index} className="tag-chip-item">
                      {tag.name}
                      <span
                        className="remove-tag-icon"
                        onClick={() => handleTagRemove(tag, onChange, currentTagsValue)}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="company_id"
        control={control}
        render={({ field }) => {
          const selected = companies.find((c) => String(c.id) === String(field.value));
          const displayValue = selected ? selected.name : field.value || "";

          return (
            <div className="form-field">
              <label>Компания</label>
              <CreatableSelect
                value={displayValue}
                options={companies.map((c) => c.name)}
                onChange={(val) => {
                  const existing = companies.find((c) => c.name === val);
                  field.onChange(existing ? existing.id : val);
                }}
                onAdd={(val) => onAddCompany?.(val)}
                placeholder="Выберите или введите..."
                error={!!errors.company_id}
              />
              {errors.company_id && (
                <p className="error grid-error">{errors.company_id.message}</p>
              )}
            </div>
          );
        }}
      />

      {watchedCompanyId && (
        <Controller
          name="company_photo_link"
          control={control}
          render={({ field }) => {
            const handleFileUpload = (e) => {
              const file = e.target.files[0];
              setUploadError("");

              if (!file) return;

              const fileExtension = file.name.split(".").pop().toLowerCase();
              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension);

              if (!isImage) {
                setUploadError("Разрешены только изображения (JPG, PNG, GIF, WEBP)");
                e.target.value = "";
                return;
              }

              const maxSize = 5 * 1024 * 1024;
              if (file.size > maxSize) {
                setUploadError("Размер файла превышает 5 МБ");
                e.target.value = "";
                return;
              }

              const reader = new FileReader();
              reader.onloadend = () => {
                const fileData = {
                  name: file.name,
                  size: file.size,
                  url: reader.result,
                };
                field.onChange(JSON.stringify(fileData));
              };
              reader.readAsDataURL(file);
            };

            const handleRemoveFile = (e) => {
              e.preventDefault();
              field.onChange("");
              setUploadError("");
            };

            let parsedFile = null;
            if (field.value) {
              try {
                parsedFile = JSON.parse(field.value);
              } catch (err) {
                parsedFile = { name: "Изображение по ссылке", url: field.value };
              }
            }

            const handleDownloadFile = (e) => {
              e.preventDefault();
              if (!parsedFile?.url) return;

              if (parsedFile.url.startsWith("data:")) {
                const link = document.createElement("a");
                link.href = parsedFile.url;
                link.download = parsedFile.name || "image.jpg";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                window.open(parsedFile.url, "_blank");
              }
            };

            return (
              <div className="form-field" style={{ alignItems: "flex-start" }}>
                <label style={{ marginTop: "10px" }}>Картинка компании</label>
                <div style={{ flexBasis: "70%", width: "100%" }}>
                  {!parsedFile ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        marginTop: "5px",
                      }}
                    >
                      <label
                        className="save-order-btn"
                        style={{
                          cursor: "pointer",
                          margin: 0,
                          padding: "8px 15px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          style={{ display: "none" }}
                        />
                        Выбрать файл
                      </label>

                      <span style={{ fontSize: "13px", color: "var(--chips-color)" }}>
                        Фото до 5 МБ
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "var(--bg-menu-color)",
                        padding: "10px 15px",
                        borderRadius: "6px",
                        border: "1px solid rgba(128,128,128,0.3)",
                        marginTop: "5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--text-color)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {parsedFile.name}
                        </span>

                        {parsedFile.size && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--chips-color)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ({formatFileSize(parsedFile.size)})
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginLeft: "15px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleDownloadFile}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-color)",
                            display: "flex",
                            alignItems: "center",
                            padding: 0,
                          }}
                          title="Скачать/Посмотреть"
                        >
                          <Download size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ff4d4f",
                            display: "flex",
                            alignItems: "center",
                            padding: 0,
                          }}
                          title="Удалить файл"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div style={{ color: "#ff4d4f", fontSize: "13px", marginTop: "8px" }}>
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}

      <Controller
        name="business"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Вид деятельности</label>
            <select
              {...field}
              disabled={loadingLists}
              className={errors.business ? "input-error" : ""}
            >
              <option value="" disabled>
                {loadingLists ? "Загрузка..." : "-- выбрать --"}
              </option>
              {businesses.map((b, i) => (
                <option key={`${b}-${i}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {errors.business && <p className="error grid-error">{errors.business.message}</p>}
          </div>
        )}
      />
    </div>
  );
}