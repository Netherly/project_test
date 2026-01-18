import React from 'react';
import PropTypes from 'prop-types';
import './ActionsBar.css';

/** Вертикальная панель с быстрыми действиями. */
export default function ActionsBar({ onAddOrder, onDuplicate }) {
  return (
    <aside className="actions-bar">
      <button onClick={onAddOrder}>Добавить заказ</button>
      <button onClick={onDuplicate}>Дублировать клиента</button>
      {/* <button>Ещё действие</button> */}
    </aside>
  );
}

ActionsBar.propTypes = {
  onAddOrder:  PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired
};
