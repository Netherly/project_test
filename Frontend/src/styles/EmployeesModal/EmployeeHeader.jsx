import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import defaultAvatar from '../../../assets/avatar-placeholder.svg';
import styles from './EmployeeHeader.module.css';
import TagSelector from '../../Client/TagSelector';

export default function EmployeeHeader({ onClose, onDelete, isDirty, reset }) {
    const { watch, control } = useFormContext();
    const fullName = watch('fullName')?.trim() || 'Имя сотрудника';
    const login = watch('login')?.trim() || 'Логин';
    const avatarSrc = watch('photoLink')?.trim() || defaultAvatar;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEsc = useCallback((event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [handleEsc]);

    return (
        <div className={styles.employeeHeader}>
            <div className={styles.headerTopRow}>
                <div className={styles.avatarContainer}>
                    <img src={avatarSrc} alt="Аватар сотрудника" className={styles.avatar} />
                </div>

                <div className={styles.info}>
                    <h2 className={fullName === 'Имя сотрудника' ? styles.placeholder : ''}>
                        {fullName}
                    </h2>
                    <span className={login === 'Логин' ? styles.placeholder : ''}>
                        {login}
                    </span>
                </div>

                <div className={styles.actions}>
                    <div ref={menuRef}>
                        <button className={styles.btn} type="button" onClick={() => setMenuOpen(o => !o)}>
                            ⋮
                        </button>
                        {onDelete && (
                            <ul className={`${styles.dropdown} ${menuOpen ? styles.show : ''}`}>
                                <li onClick={() => { onDelete(); setMenuOpen(false); }}>
                                    🗑 Удалить сотрудника
                                </li>
                            </ul>
                        )}
                    </div>
                    <button className={styles.btn} type="button" onClick={onClose}>
                        ×
                    </button>
                </div>
            </div>


            <div className={styles.headerBottomRow}>
                <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                        <TagSelector
                            tags={Array.isArray(field.value) ? field.value : []}
                            onChange={field.onChange}
                        />
                    )}
                />
                
                <div className={styles.saveActions}>
                    <button className={styles.resetButton} type="button" onClick={() => reset()} disabled={!isDirty}>
                        Сбросить
                    </button>
                    <button className={styles.saveButton} type="submit">
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}