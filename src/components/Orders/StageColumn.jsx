import React, { useRef } from "react";
import { useDrop } from "react-dnd";
import OrderCard from "./OrderCard";
import { getStageColor } from "../Orders/stageColors";

const ItemTypes = { ORDER: "order" };

const StageColumn = ({
  stage,
  orders,
  moveOrder,
  onOrderClick,
  isDraggingRef,
  onDragStart,
  onDragEnd
}) => {
  const ref = useRef(null);
  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const totalAmount = orders.reduce(
    (sum, o) => sum + toNumber(o?.budget ?? o?.price ?? o?.amount),
    0
  );
  const stageColor = getStageColor(stage);

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ORDER,
    drop: (item) => {
      if (item.stage !== stage) {
        moveOrder(item.id, stage, orders.length);
      }
      // Завершаем перетаскивание
      if (onDragEnd) onDragEnd();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`stage-column ${isOver ? "highlight" : ""}`}
    >
      <header className="stage-column-header">
        <h3>{stage}</h3>
        <div className="stage-subtitle">
          {orders.length} заказов / {totalAmount.toLocaleString()} грн
        </div>
        <div
          className="stage-title-line"
          style={{ backgroundColor: stageColor }}
        ></div>
      </header>

      <div className="orders-list hidden-scroll">
        {orders.map((order, index) => (
          <OrderCard
            key={order.id}
            order={order}
            index={index}
            stage={stage}
            moveOrder={moveOrder}
            onClick={onOrderClick}
            isDraggingRef={isDraggingRef}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default StageColumn;
