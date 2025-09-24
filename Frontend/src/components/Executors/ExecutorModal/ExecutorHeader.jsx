import React from 'react';
import { useFormContext } from 'react-hook-form';
import defaultAvatar from '../../../assets/avatar-placeholder.svg'; 
import styles from './ExecutorHeader.module.css'; 

export default function ExecutorHeader({ onClose, onDelete, isDirty, reset }) {
    const { watch } = useFormContext();

    
    const performerName = watch('performer') || 'Имя исполнителя';
    const orderNumber = watch('orderNumber') ? `Заказ №${watch('orderNumber')}` : 'Выберите заказ';
    
    
    const avatarSrc = defaultAvatar; 

    return (
        <div className={styles.employeeHeader}>
            <div className={styles.headerTopRow}>
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

                <div className={styles.actions}>
                    {onDelete && (
                        <button className={styles.btn} type="button" onClick={onDelete}>🗑</button>
                    )}
                    <button className={styles.btn} type="button" onClick={onClose}>×</button>
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