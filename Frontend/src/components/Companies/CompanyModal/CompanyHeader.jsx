import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import defaultAvatar from '../../../assets/avatar-placeholder.svg'; 


import styles from '../../Employees/EmployeesModal/EmployeeHeader.module.css'; 
import { Trash2 } from 'lucide-react';


export default function CompanyHeader({ onClose, onDelete, isNew, tagOptions = [] }) {
    const { watch, control } = useFormContext();

    
    const companyName = watch('name')?.trim() || 'Название компании';
    const companyEmail = watch('email') || 'Email не указан';
    
    const avatarSrc = defaultAvatar; 

    
    const [customTag, setCustomTag] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const tagInputRef = useRef(null);
    const tagDropdownRef = useRef(null);

    const watchedTags = watch('tags', []);

    const handleTagInputChange = (e) => setCustomTag(e.target.value);
    const handleTagInputFocus = () => setShowTagDropdown(true);

    const handleTagSelect = (tagName, fieldOnChange) => {
        const currentTags = Array.isArray(watchedTags) ? watchedTags : [];
        if (tagName && !currentTags.find(t => t.name === tagName)) {
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

    const filteredTags = tagOptions.filter(
        tagString => tagString.toLowerCase().includes(customTag.toLowerCase()) && 
                     (!watchedTags || !watchedTags.find(t => t.name === tagString))
    );
    
    
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
            if (tagInputRef.current && !tagInputRef.current.contains(event.target) && tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
                setShowTagDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEsc = useCallback((event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
            setShowTagDropdown(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [handleEsc]);

    
    return (
        <div className={styles.employeeHeader}>
            <div className={styles.avatarContainer}>
                <img src={avatarSrc} alt="Аватар компании" className={styles.avatar} />
            </div>

            <div className={styles.mainContent}>
                <div className={styles.info}>
                    <h2 className={companyName === 'Название компании' ? styles.placeholder : ''}>{companyName}</h2>
                    <span className={!watch('email') ? styles.placeholder : ''}>{companyEmail}</span>
                </div>
                
                <div className={styles.tagsSectionHeader}>
                    <Controller
                        control={control}
                        name="tags" 
                        render={({ field: { onChange, value: currentTagsValue } }) => {
                            const currentTags = Array.isArray(currentTagsValue) ? currentTagsValue : [];
                            return (
                                <div className={styles.tagsWrapper}>
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
                                        {showTagDropdown && (filteredTags.length > 0 || (customTag.trim() && !tagOptions.includes(customTag) && !currentTags.find(t => t.name === customTag))) && (
                                            <div className={styles.tagDropdown} ref={tagDropdownRef}>
                                                {filteredTags.map(tag => (
                                                    <div key={tag} className={styles.tagDropdownItem} onClick={() => handleTagSelect(tag, onChange)}>
                                                        {tag}
                                                    </div>
                                                ))}
                                                {customTag.trim() && !tagOptions.includes(customTag) && !currentTags.find(t => t.name === customTag.trim()) && (
                                                    <div className={styles.tagDropdownItem} onClick={() => handleTagSelect(customTag.trim(), onChange)}>
                                                        Добавить: "{customTag.trim()}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {currentTags.map((tag, index) => (
                                        <span
                                            key={tag.id || index}
                                            className={styles.tagChip}
                                            onClick={() => handleTagRemove(tag, onChange)}
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

            <div className={styles.actions}>
                <div ref={menuRef} className={styles.actionItem}>
                    <button className={styles.btn} type="button" onClick={() => setMenuOpen(o => !o)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                    {onDelete && !isNew && ( 
                        <ul className={`${styles.dropdown} ${menuOpen ? styles.show : ''}`}>
                            <li onClick={() => { onDelete(); setMenuOpen(false); }}>
                                <Trash2 size={14} /> Удалить компанию
                            </li>
                        </ul>
                    )}
                </div>
                <button className={`${styles.btn} ${styles.actionItem}`} type="button" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>
    );
}