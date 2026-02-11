import React, { useEffect, useState, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import TextareaWithCounter from "../TextareaWithCounter";
import "./InfoTab.css";

const defaultTags = ["Lead", "Hot", "VIP", "Test", "Internal"];

export default function InfoTab({
  companies = [],
  businesses = [],
  categories = [], 
  sources = [], 
  tagOptions = [],
  loadingLists = false,
  onAddCompany
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const [customTag, setCustomTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);

  const handleTagInputChange = (e) => setCustomTag(e.target.value);
  const handleTagInputFocus = () => setShowTagDropdown(true);

  const handleTagSelect = (tagName, fieldOnChange, currentTagsValue) => {
    const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
    if (tagName && !currentTags.find(t => t.name === tagName)) {
       fieldOnChange([...currentTags, { name: tagName, color: '#777' }]);
    }
    setCustomTag('');
    setShowTagDropdown(false);
  };

  const handleCustomTagAdd = (e, fieldOnChange, currentTagsValue) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      handleTagSelect(customTag.trim(), fieldOnChange, currentTagsValue);
    }
  };

  const handleTagRemove = (tagToRemove, fieldOnChange, currentTagsValue) => {
      const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
      fieldOnChange(currentTags.filter(tag => tag.name !== tagToRemove.name));
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="tab-section info-tab">

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
            <label>Клиент<span className="req">*</span></label>
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
            <label>Категория<span className="req">*</span></label>
            <select
              {...field}
              disabled={loadingLists}
              className={errors.category ? "input-error" : ""}
            >
              <option value="" disabled hidden>Не выбрано</option>
              {categories.map((c, i) => (
                <option key={`${c}-${i}`} value={c}>{c}</option>
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
            <label>Источник<span className="req">*</span></label>
            <select
              {...field}
              disabled={loadingLists}
              className={errors.source ? "input-error" : ""}
            >
              <option value="" disabled hidden>Не выбрано</option>
              {sources.map((s, i) => (
                <option key={`${s}-${i}`} value={s}>{s}</option>
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
            <label>Вводное описание<span className="req">*</span></label>
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
            <label>Примечание<span className="req">*</span></label>
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
           const suggestions = [...defaultTags, ...(tagOptions.map(t => typeof t === 'object' ? t.name : t))];
           const uniqueSuggestions = Array.from(new Set(suggestions));
           
           const filteredTags = uniqueSuggestions.filter(
              tagString => 
                tagString.toLowerCase().includes(customTag.toLowerCase()) && 
                !currentTags.find(t => t.name === tagString)
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
                      
                      {showTagDropdown && (filteredTags.length > 0 || (customTag.trim() && !uniqueSuggestions.includes(customTag) && !currentTags.find(t => t.name === customTag))) && (
                          <div className="tag-dropdown" ref={tagDropdownRef}>
                              {filteredTags.map(tag => (
                                  <div key={tag} className="tag-dropdown-item" onClick={() => handleTagSelect(tag, onChange, currentTagsValue)}>
                                      {tag}
                                  </div>
                              ))}
                              {customTag.trim() && !uniqueSuggestions.includes(customTag) && !currentTags.find(t => t.name === customTag.trim()) && (
                                  <div className="tag-dropdown-item" onClick={() => handleTagSelect(customTag.trim(), onChange, currentTagsValue)}>
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
                            >×</span>
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
        render={({ field }) => (
          <div className="form-field">
            <label>Компания</label>
            <select
              {...field}
              className={errors.company_id ? "input-error" : ""}
            >
              <option value="" disabled hidden>Не выбрано</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.company_id && (
              <p className="error grid-error">{errors.company_id.message}</p>
            )}
          </div>
        )}
      />

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
              <option value="" disabled>{loadingLists ? "Загрузка..." : "-- выбрать --"}</option>
              {businesses.map((b, i) => (
                <option key={`${b}-${i}`} value={b}>{b}</option>
              ))}
            </select>
            {errors.business && <p className="error grid-error">{errors.business.message}</p>}
          </div>
        )}
      />
    </div>
  );
}