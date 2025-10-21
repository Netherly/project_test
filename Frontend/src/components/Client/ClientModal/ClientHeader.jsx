import React, { useState, useRef, useEffect, useCallback } from 'react';
// 1. Добавили Controller
import { useFormContext, Controller } from 'react-hook-form';
import defaultAvatar from '../../../assets/avatar-placeholder.svg';
import styles from '../../Employees/EmployeesModal/EmployeeHeader.module.css'; 
import { Trash2 } from 'lucide-react';

// 3. Константа с тегами по умолчанию (из EmployeeHeader)
// !! Возможно, ты захочешь изменить этот список для КЛИЕНТОВ
const defaultTags = ["Lead", "Hot", "VIP", "Test", "Internal"];

export default function ClientHeader({
  onClose,
  onDelete = () => {}
}) {
  
  /* -------- данные формы -------- */
  // 2. Получили control
  const { watch, control } = useFormContext();
  const name = watch('name')?.trim() || 'Имя клиента';
  const nick = watch('messenger_name')?.trim() || '@username';
  const avatarSrc = watch('photo_link')?.trim() || defaultAvatar;
  
  // Используем watchedTags как в EmployeeHeader
  const watchedTags = watch('tags', []);

  /* -------- 4. Управление тегами (вся логика из EmployeeHeader) -------- */
  const [customTag, setCustomTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);

  const handleTagInputChange = (e) => setCustomTag(e.target.value);
  const handleTagInputFocus = () => setShowTagDropdown(true);

  const handleTagSelect = (tagName, fieldOnChange) => {
      const currentTags = Array.isArray(watchedTags) ? watchedTags : [];
      // Убедимся, что тег - это объект
      if (tagName && !currentTags.find(t => t.name === tagName)) {
          // ВАЖНО: Убедись, что твоя форма ждет объекты { name: "...", color: "..." }
          fieldOnChange([...currentTags, { name: tagName, color: '#777' }]);
      }
      setCustomTag('');
      setShowTagDropdown(false);
  };

  const handleCustomTagAdd = (e, fieldOnChange) => {
      if (e.key === 'Enter' && customTag.trim()) {
          e.preventDefault();
          handleTagSelect(customTag.trim(), fieldOnChange);
      }
  };
  
  const handleTagRemove = (tagToRemove, fieldOnChange) => {
      const currentTags = Array.isArray(watchedTags) ? watchedTags : [];
      fieldOnChange(currentTags.filter(tag => tag.name !== tagToRemove.name));
  };

  const filteredTags = defaultTags.filter(
      tagString => tagString.toLowerCase().includes(customTag.toLowerCase()) && !watchedTags.find(t => t.name === tagString)
  );

  /* -------- управление меню и дропдаунами -------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // 5. ОБНОВЛЕННЫЙ useEffect (закрывает и меню, и теги)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      // Добавлено для тегов
      if (tagInputRef.current && !tagInputRef.current.contains(event.target) && tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
          setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 6. ОБНОВЛЕННЫЙ handleEsc (закрывает и меню, и теги)
  const handleEsc = useCallback((event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      setShowTagDropdown(false); // Добавлено для тегов
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  /* ======== JSX (структура от EmployeeHeader) ======== */
  return (
    <div className={styles.employeeHeader}>
      
      {/* 1. Аватар */}
      <div className={styles.avatarContainer}>
        <img src={avatarSrc} alt="Аватар клиента" className={styles.avatar} />
      </div>

      {/* 2. Основной контент */}
      <div className={styles.mainContent}>
        
        {/* Инфо (Имя + Ник) */}
        <div className={styles.info}>
          <h2 className={name === 'Имя клиента' ? styles.placeholder : ''}>
            {name}
          </h2>
          <span className={nick === '@username' ? styles.placeholder : ''}>
            {nick}
          </span>
        </div>
        
        {/* 7. ЗАМЕНЕННЫЙ БЛОК ТЕГОВ (из EmployeeHeader) */}
        <div className={styles.tagsSectionHeader}>
            <Controller
                control={control}
                name="tags" // Убедись, что в форме это поле называется 'tags'
                render={({ field: { onChange, value: currentTagsValue } }) => {
                    const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
                    return (
                        <div className={styles.tagsWrapper}>
                            
                            {/* Поле ввода тега */}
                            <div className={styles.tagInputContainer} ref={tagInputRef}>
                                <input
                                    type="text"
                                    size={22} 
                                    placeholder="Добавить тег"
                                    className={styles.inputTag}
                                    value={customTag}
                                    onChange={handleTagInputChange}
                                    onKeyDown={(e) => handleCustomTagAdd(e, onChange)}
                                    onFocus={handleTagInputFocus}
                                    autoComplete="off"
                                />
                                {/* Выпадашка с тегами */}
                                {showTagDropdown && (filteredTags.length > 0 || (customTag.trim() && !defaultTags.includes(customTag) && !currentTags.find(t => t.name === customTag))) && (
                                    <div className={styles.tagDropdown} ref={tagDropdownRef}>
                                        {filteredTags.map(tag => (
                                            <div key={tag} className={styles.tagDropdownItem} onClick={() => handleTagSelect(tag, onChange)}>
                                                {tag}
                                            </div>
                                        ))}
                                        {customTag.trim() && !defaultTags.includes(customTag) && !currentTags.find(t => t.name === customTag.trim()) && (
                                            <div className={styles.tagDropdownItem} onClick={() => handleTagSelect(customTag.trim(), onChange)}>
                                                Добавить: "{customTag.trim()}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Отображение уже добавленных тегов */}
                            {currentTags.map((tag, index) => (
                                <span
                                    key={tag.id || index} // Используем tag.id или index
                                    className={styles.tagChip}
                                    onClick={() => handleTagRemove(tag, onChange)} // 'tag' - это объект {name, ...}
                                >
                                    {tag.name} <span className={styles.removeTagIcon}>×</span>
                                </span>
                            ))}
                        </div>
                    );
                }}
            />
        </div>
      </div>

      {/* 3. Действия (кнопки) */}
      <div className={styles.actions}>
        
        <div ref={menuRef} className={styles.actionItem}>
          <button className={styles.btn} type="button" onClick={() => setMenuOpen(o => !o)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          
          <ul className={`${styles.dropdown} ${menuOpen ? styles.show : ''}`}>
            <li onClick={() => { onDelete(); setMenuOpen(false); }}>
              <Trash2 size={14} /> Удалить {name}
            </li>
          </ul>
        </div>

        <button className={`${styles.btn} ${styles.actionItem}`} type="button" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

    </div>
  );
}