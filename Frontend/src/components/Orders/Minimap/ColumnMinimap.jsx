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
    const rawIndicatorWidth = ((viewportEndPx - viewportStartPx) / totalContentWidth) * minimapWidth;
    const viewportIndicatorWidth = Math.min(rawIndicatorWidth, minimapWidth - viewportIndicatorLeft);

    const handleMinimapClick = (e) => {
        if (!minimapRef.current || !containerRef.current) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickRatio = clickX / minimapWidth;
        const targetScrollLeft = clickRatio * viewportData.scrollWidth - (viewportData.clientWidth / 2);

        const newScrollLeft = Math.max(0, Math.min(
             viewportData.scrollWidth - viewportData.clientWidth,
             targetScrollLeft
        ));

        containerRef.current.scrollLeft = newScrollLeft;
        onScrollToPosition?.(newScrollLeft);
    };

    const handleViewportDrag = (e) => {
        e.preventDefault();
        e.stopPropagation(); 

        if (!minimapRef.current || !containerRef.current) return;

        const startX = e.clientX;
        const startScrollLeft = viewportData.scrollLeft;
        isDraggingMinimap.current = true;

        showMinimap();

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const scrollRatio = viewportData.scrollWidth / minimapWidth;

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

    if (viewportData.clientWidth >= viewportData.scrollWidth || totalContentWidth === 0) {
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
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
    );
};

export default ColumnMinimap;