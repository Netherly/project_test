import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import defaultAvatar from '../../../assets/avatar-placeholder.svg';
import styles from './ExecutorHeader.module.css';


export default function ExecutorHeader({ onClose, onDelete, onDuplicate, isDirty, reset }) {
    const { watch } = useFormContext();

    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const menuRef = useRef(null);

    const performerName = watch('performer') || 'Имя исполнителя';
    const orderNumber = watch('orderNumber') ? `Заказ №${watch('orderNumber')}` : 'Выберите заказ';
    const avatarSrc = defaultAvatar;

    
    useEffect(() => {
        
        const handleClickOutside = (event) => {
            
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

       
        document.addEventListener('mousedown', handleClickOutside);
       
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); 


    return (
        <div className={styles.employeeHeader}>
            <div className={styles.headerTopRow}>
                <button className="close-button" onClick={onClose}>{'<'}</button>
                <div className={styles.avatarContainer}>
                    <img src={avatarSrc} alt="Аватар исполнителя" className={styles.avatar} />
                </div>

                <div className={styles.info}>
                    <h2 className={performerName === 'Имя исполнителя' ? styles.placeholder : ''}>
                        {performerName}
                    </h2>
                    <span className={orderNumber === 'Выберите заказ' ? styles.placeholder : ''}>
                        {orderNumber}
                    </span>
                </div>

               
                <div className={styles.actions} ref={menuRef}>
                    
                    <button
                        className={styles.menuButton}
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        ⋮
                    </button>

                    
                    {isMenuOpen && (
                        <div className={styles.dropdownMenu}>
                            {onDelete && (
                                <button type="button" onClick={onDelete} className={styles.deleteOption}>
                                    Удалить исполнителя
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.headerBottomRow}>
                <div className={styles.tagsPlaceholder}></div>

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