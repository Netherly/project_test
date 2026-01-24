import React, { useState, useRef, useCallback, useEffect } from "react";

const ColumnMinimap = ({ containerRef, stages, onScrollToPosition, isDragging }) => {
    const [viewportData, setViewportData] = useState({
        scrollLeft: 0,
        scrollWidth: 0,
        clientWidth: 0,
        columnWidth: 320,
    });

    const [isVisible, setIsVisible] = useState(true);
    const minimapRef = useRef(null);
    const isDraggingMinimap = useRef(false);
    const hideTimeoutRef = useRef(null);

    const updateViewportData = useCallback(() => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setViewportData(prev => ({
                ...prev,
                scrollLeft,
                scrollWidth,
                clientWidth
            }));
        }
    }, [containerRef]);

    // Функции для управления видимостью
    const showMinimap = () => {
        setIsVisible(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const scheduleFade = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 4000);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            updateViewportData();
            showMinimap();
            scheduleFade();
        };

        const handleResize = () => {
            updateViewportData();
        };

        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        updateViewportData();
        scheduleFade();

        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [updateViewportData]);

    const handleMouseEnter = () => {
        showMinimap();
    };

    const handleMouseLeave = () => {
        if (!isDraggingMinimap.current) {
            scheduleFade();
        }
    };

    const totalColumns = stages.length;

    const rectWidth = 20;
    const rectHeight = 30;
    const rectGap = 2.5;

    const minimapWidth = (rectWidth + rectGap) * totalColumns - rectGap;

    const viewportStartPx = viewportData.scrollLeft;
    const viewportEndPx = viewportData.scrollLeft + viewportData.clientWidth;
    const totalContentWidth = viewportData.scrollWidth;

    const viewportIndicatorLeft = (viewportStartPx / totalContentWidth) * minimapWidth;
    const viewportIndicatorWidth = ((viewportEndPx - viewportStartPx) / totalContentWidth) * minimapWidth;

    const getColumnVisibility = (columnIndex) => {
        const columnStart = columnIndex * viewportData.columnWidth;
        const columnEnd = columnStart + viewportData.columnWidth;
        const viewportStart = viewportData.scrollLeft;
        const viewportEnd = viewportData.scrollLeft + viewportData.clientWidth;

        if (columnEnd <= viewportStart || columnStart >= viewportEnd) {
            return 0;
        }

        const intersectionStart = Math.max(columnStart, viewportStart);
        const intersectionEnd = Math.min(columnEnd, viewportEnd);
        const intersectionWidth = intersectionEnd - intersectionStart;

        return intersectionWidth / viewportData.columnWidth;
    };

    const handleMinimapClick = (e) => {
        if (!minimapRef.current || !containerRef.current) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickedColumn = Math.floor(clickX / (rectWidth + rectGap));

        const newScrollLeft = clickedColumn * viewportData.columnWidth;
        containerRef.current.scrollLeft = newScrollLeft;
        onScrollToPosition?.(newScrollLeft);
    };

    const handleViewportDrag = (e) => {
        e.preventDefault();

        if (!minimapRef.current || !containerRef.current) return;

        const startX = e.clientX;
        const startScrollLeft = viewportData.scrollLeft;
        isDraggingMinimap.current = true;

        showMinimap();

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const scrollRatio = (viewportData.scrollWidth / minimapWidth) * 0.85;
            const newScrollLeft = Math.max(0, Math.min(
                viewportData.scrollWidth - viewportData.clientWidth,
                startScrollLeft + (deltaX * scrollRatio)
            ));

            containerRef.current.scrollLeft = newScrollLeft;
        };

        const handleMouseUp = () => {
            isDraggingMinimap.current = false;
            scheduleFade();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (viewportData.clientWidth >= viewportData.scrollWidth) {
        return null;
    }

    return (
        <div
            className={`column-minimap-container ${isDragging ? 'with-quick-panel' : ''} ${!isVisible ? 'faded' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="column-minimap"
                ref={minimapRef}
                style={{ width: minimapWidth }}
                onClick={handleMinimapClick}
            >
                {stages.map((stage, index) => {
                    const visibility = getColumnVisibility(index);
                    return (
                        <div
                            key={stage}
                            className="minimap-column-rect"
                            style={{
                                left: index * (rectWidth + rectGap),
                                width: rectWidth,
                                height: rectHeight,
                            }}
                        >
                            <div
                                className="minimap-column-fill"
                                style={{
                                    width: '100%', // Всегда полная ширина
                                    height: '100%',
                                    opacity: visibility, // Управляем прозрачностью (от 0 до 1)
                                }}
                            />
                        </div>
                    );
                })}
                <div
                    className="minimap-viewport-indicator"
                    style={{
                        left: viewportIndicatorLeft,
                        width: viewportIndicatorWidth,
                    }}
                    onMouseDown={handleViewportDrag}
                />
            </div>
        </div>
    );
};

export default ColumnMinimap;