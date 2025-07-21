'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { throttle } from '@/lib/utils/index';

interface VirtualScrollerProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * 가상 스크롤링 컴포넌트
 * 대용량 목록을 효율적으로 렌더링하기 위한 컴포넌트
 * 화면에 보이는 항목만 렌더링하여 메모리 사용량과 렌더링 성능 최적화
 */
export function VirtualScroller<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualScrollerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isEndReached, setIsEndReached] = useState(false);

  // 스크롤 이벤트 핸들러 (스로틀링 적용)
  const handleScroll = useCallback(
    throttle(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);

        // 스크롤이 하단에 가까워지면 onEndReached 호출
        if (onEndReached && !isEndReached) {
          const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
          const scrollPosition = scrollTop + clientHeight;
          const scrollThreshold = scrollHeight * endReachedThreshold;

          if (scrollPosition >= scrollThreshold) {
            setIsEndReached(true);
            onEndReached();
          }
        }
      }
    }, 50),
    [onEndReached, isEndReached, endReachedThreshold]
  );

  // 새 아이템이 로드되면 isEndReached 초기화
  useEffect(() => {
    setIsEndReached(false);
  }, [items.length]);

  // 보이는 아이템 계산
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );

  // 렌더링할 아이템
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // 전체 컨테이너 높이
  const totalHeight = items.length * itemHeight;

  // 상단 패딩 (보이지 않는 아이템 공간)
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}