// components/Client/ClientModal/InfoTab.jsx
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import TagSelector from "../TagSelector";
import TextareaWithCounter from "../TextareaWithCounter";
import "./InfoTab.css";

import { Plus } from "lucide-react";

import { FieldsAPI } from "../../../api/fields";

export default function InfoTab({
  companies = [],
  categoriesInit = [],
  sourcesInit = [],
  onAddCompany,
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const [loadingLists, setLoadingLists] = useState(true);
  const [savingCat, setSavingCat] = useState(false);
  const [savingSrc, setSavingSrc] = useState(false);


  const normalizeStr = (s) => String(s ?? "").trim();
  const extractNames = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) =>
        typeof x === "string"
          ? normalizeStr(x)
          : normalizeStr(x?.name ?? x?.label ?? x?.value ?? "")
      )
      .filter(Boolean);
  };
  const unique = (arr) =>
    Array.from(
      new Map(arr.map((v) => [v.toLowerCase(), v])).values()
    );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const clientFields = await FieldsAPI.getClient();
  const apiCats = extractNames(clientFields?.category);
  const apiSrcs = extractNames(clientFields?.source);
  const apiTags = Array.isArray(clientFields?.tags) ? clientFields.tags : [];
        const initCats = extractNames(categoriesInit);
        const initSrcs = extractNames(sourcesInit);
        if (!mounted) return;
        setCategories(apiCats.length ? apiCats : initCats);
        setSources(apiSrcs.length ? apiSrcs : initSrcs);
  setTagOptions(apiTags);
      } catch (e) {
        console.error("FieldsAPI.getClient failed:", e);
        setCategories(extractNames(categoriesInit));
        setSources(extractNames(sourcesInit));
        setTagOptions([]);
      } finally {
        if (mounted) setLoadingLists(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const addOption = async (kind) => {
    const label = kind === "category" ? "Категория" : "Источник";
    const raw = prompt(`Новое значение для "${label}"`);
    const v = normalizeStr(raw);
    if (!v) return;

    if (kind === "category") {
      if (categories.some((x) => x.toLowerCase() === v.toLowerCase())) return;
      const next = unique([...categories, v]);
      setSavingCat(true);
      try {
        await FieldsAPI.setClientCategories(next);
        setCategories(next);
      } catch (e) {
        console.error("setClientCategories failed:", e);
      } finally {
        setSavingCat(false);
      }
    } else {
      if (sources.some((x) => x.toLowerCase() === v.toLowerCase())) return;
      const next = unique([...sources, v]);
      setSavingSrc(true);
      try {
        await FieldsAPI.setClientSources(next);
        setSources(next);
      } catch (e) {
        console.error("setClientSources failed:", e);
      } finally {
        setSavingSrc(false);
      }
    }
  };


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
              <option value="">{loadingLists ? "Загрузка..." : "-- выбрать --"}</option>
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
              <option value="">{loadingLists ? "Загрузка..." : "-- выбрать --"}</option>
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

      {/* Теги клиента */}
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <div className="form-field full-width">
            <label>Теги</label>
            <TagSelector
              options={tagOptions}
              tags={Array.isArray(field.value) ? field.value : []}
              onChange={field.onChange}
            />
          </div>
        )}
      />

      {/* Компания */}
      <Controller
        name="company_id"
        control={control}
        render={({ field }) => (
          <div className="form-field">
       
            <label>Компания<span className="req">*</span></label>
      
            <select
              {...field}
              className={errors.company_id ? "input-error" : ""}
            >
              <option value="">-- выбрать --</option>
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
        name="messenger_name"
        control={control}
        render={({ field }) => (
          <div className="form-field">
           
            <label>Имя в мессенджере</label>
           
            <input {...field} placeholder="Имя в мессенджере" />
           
          </div>
        )}
      />
    </div>
  );
}