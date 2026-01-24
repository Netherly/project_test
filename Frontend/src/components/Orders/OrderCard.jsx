import React, { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date) ? "" : date.toLocaleDateString();
};

const getUrgencyText = (urgencyValue) => {
  const urgencyMap = {
    "1": "Не горит",
    "2": "Умеренно",
    "3": "Жопа уже подгорает",
    "4": "ЛИБО СДАЛ ЛИБО ШТРАФ"
  };
  return urgencyMap[urgencyValue] || urgencyValue;
};

const ItemTypes = { ORDER: "order" };

const OrderCard = ({
  order,
  index,
  stage,
  moveOrder,
  onClick,
  isDraggingRef,
  onDragStart,
  onDragEnd
}) => {
  const ref = useRef(null);
  const [expandedRegular, setExpandedRegular] = useState(false);
  const [expandedTech, setExpandedTech] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ORDER,
    item: () => {
      isDraggingRef.current = true;
      if (onDragStart) onDragStart();
      return { id: order.id, index, stage };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      isDraggingRef.current = false;

      if (onDragEnd) onDragEnd();
    },
  });

  const [, drop] = useDrop({
    accept: ItemTypes.ORDER,
    hover(item, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceStage = item.stage;
      const targetStage = stage;

      if (dragIndex === hoverIndex && sourceStage === targetStage) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (
        (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
        (dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
      )
        return;

      moveOrder(item.id, targetStage, hoverIndex);
      item.index = hoverIndex;
      item.stage = targetStage;
    },
  });

  drag(drop(ref));

  const TagGroup = ({ tags, expanded, setExpanded, className }) => {
    if (!tags?.length) return null;

    const visibleTags = expanded ? tags : tags.slice(0, 4);
    const hiddenCount = Math.max(tags.length - 4, 0);

    return (
      <div className={`tag-group ${className}`}>
        <div className="tag-chips-container">
          {visibleTags.map((tag, i) => (
            <span
              key={i}
              className={`tag-chips ${className === "tech-tags" ? "tech-tag" : ""}`}
            >
              {tag}
            </span>
          ))}
          {!expanded && hiddenCount > 0 && (
            <span
              className="tag-chips tag-expand"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
            >
              +{hiddenCount}
            </span>
          )}
        </div>
        {expanded && (
          <span
            className="tag-chips tag-collapse"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            ×
          </span>
        )}
      </div>
    );
  };

  const displayAmount = order?.budget ?? order?.price ?? order?.amount;
  const amountValue = Number(displayAmount);
  const showAmount =
    displayAmount !== undefined && displayAmount !== null && displayAmount !== "";
  const amountText = Number.isFinite(amountValue) ? amountValue : displayAmount;

  return (
    <div
      ref={ref}
      className={`order-container ${isDragging ? "dragging" : ""}`}
      onClick={() => onClick(order)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="order-card-header">
        <div className="order-left-content">
          <div>
            {order.numberOrder
              ? `${order.orderSequence !== undefined && order.orderSequence !== null ? "Заказ №" : "Заявка №"} ${order.numberOrder}`
              : `Заявка #${order.id}`}
          </div>
          {order.client && <div>{order.client}</div>}
          {order.urgency && <div className="order-urgency">{getUrgencyText(order.urgency)}</div>}
        </div>

        <div className="order-right-content">
          {showAmount && <div className="planned-date">{amountText} ₴</div>}
          {order.date && <div className="planned-date">{order.date}</div>}
          {order.plannedFinishDate && (
            <div className="planned-date">{formatDate(order.plannedFinishDate)}</div>
          )}
        </div>
      </div>

      <div className="order-card-footer">
        {order.name && <div className="order-name">{order.name}</div>}
        <TagGroup
          tags={order.techTags}
          expanded={expandedTech}
          setExpanded={setExpandedTech}
          className="tech-tags"
        />
        <TagGroup
          tags={order.tags}
          expanded={expandedRegular}
          setExpanded={setExpandedRegular}
          className="regular-tags"
        />

      </div>
    </div>
  );
};

export default OrderCard;
