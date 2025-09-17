import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import Tag from './Tag';
import defaultAvatar from '../../../assets/avatar-placeholder.svg';
import styles from './ClientHeader.module.css';

/**
 * Шапка клиента: имя, ник, теги, аватар, меню «⋮» → «Удалить клиента», крестик.
 */
export default function ClientHeader({
  onClose,
  onDelete = () => {}  // default no-op, чтобы всегда рендерить пункт
}) {
  /* -------- данные формы -------- */
  const { watch }   = useFormContext();
  const name        = watch('name')?.trim()            || 'Имя клиента';
  const nick        = watch('messenger_name')?.trim()  || '@username';
  const avatarSrc   = watch('photo_link')?.trim()      || defaultAvatar;
  const tags        = watch('tags')?.length ? watch('tags') : ['Новый'];

  /* -------- управление меню -------- */
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  /* клик вне меню */
  useEffect(() => {
    const outside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  /* Esc для закрытия */
  const escClose = useCallback(e => {
    if (e.key === 'Escape') setOpen(false);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', escClose);
    return () => document.removeEventListener('keydown', escClose);
  }, [escClose]);

  /* ======== JSX ======== */
  return (
    <div className={styles.clientHeader}>
      {/* инфо */}
      <div className={styles.info}>
        <h2 className={name === 'Имя клиента' ? styles.placeholder : undefined}>
          {name}
        </h2>
        <span className={nick === '@username' ? styles.placeholder : undefined}>
          {nick}
        </span>
        <div className={styles.tags}>
          {tags.slice(0, 4).map(tag => (
            <Tag key={typeof tag === 'string' ? tag : tag.name} tag={tag} />
          ))}
          {tags.length > 4 && (
            <div className={styles.moreTags}>+{tags.length - 4}</div>
          )}
        </div>
      </div>

      {/* аватар */}
      <div className={styles.avatarWrap}>
        <img src={avatarSrc} alt="Аватар клиента" className={styles.avatar} />
      </div>

      {/* действия */}
      <div className={styles.actions} ref={menuRef}>
        <button
          className={styles.btn}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          ⋮
        </button>

        <ul
          className={`${styles.dropdown} ${open ? styles.show : ''}`}
          role="menu"
        >
          
          <li role="menuitem" onClick={onDelete}>
            🗑 Удалить {name}
          </li>
        </ul>

        <button
          className={styles.btn}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
}
