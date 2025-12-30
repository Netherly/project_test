import { useEffect } from "react";

const useHorizontalDragScroll = (containerRef, isDraggingRef) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      if (e.button !== 0 || isDraggingRef.current || e.target.closest(".order-container")) return;
      isDown = true;
      container.classList.add("dragging");
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const stopScrolling = () => {
      isDown = false;
      container.classList.remove("dragging");
    };

    const onMouseLeave = () => stopScrolling();
    const onMouseUp = () => stopScrolling();

    const onMouseMove = (e) => {
      if (!isDown || isDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    const onDragEnd = () => stopScrolling();

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);
    document.addEventListener("dragend", onDragEnd);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("dragend", onDragEnd);
    };
  }, [containerRef, isDraggingRef]);
};

export default useHorizontalDragScroll;